'use strict';
const fs = require('node:fs');
const path = require('node:path');
function runDashboardSafetyTests(appSource, tenjinSource, htmlSource) {
  const results = [];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
  const equal = (a, b, message) => assert(JSON.stringify(canonical(a)) === JSON.stringify(canonical(b)), message);
  const extract = (source, name, indent = '') => {
    const match = source.match(new RegExp('^' + indent + 'function ' + name + '\\([^]*?^' + indent + '\\}', 'm'));
    if (!match) throw new Error('Missing function: ' + name);
    return match[0];
  };
  const test = (name, fn) => { fn(); results.push(name); };
  const functions = [
    ...new Set([...appSource.matchAll(/^function (normalize\w+)\(/gm)].map((match) => match[1])),
    'getChannelPermanentKey','getDateKey','addDays','toDateTimeLocalValue',
    'parseStoredState','saveState','validateDashboardBackup','importDashboardBackup',
    'importJson','exportPreImportBackup','deleteHistoryBatch','undoDelete','renderUndoBanner','renderTaskSummary'
  ];
  const constants = appSource.slice(0, appSource.indexOf('const state ='));
  function harness() {
    const values = new Map();
    const alerts = [], confirmations = [], downloads = [];
    const config = { confirm: true, failMain: false, failPre: false };
    const classList = { add() {}, remove() {} };
    const els = {
      saveStatus: { textContent: '', classList, offsetWidth: 0 },
      taskTotalCount: {}, taskOpenCount: {}, undoBanner: {}, undoTitle: {}, undoText: {}
    };
    const label = {};
    const state = { data: null, lastDeleted: null, selectedChannelIds: new Set(), historyBatchTime: '', taskAnchorDate: new Date() };
    const localStorage = {
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, value) {
        if (config.failMain && key === 'local-dashboard-app-v1') throw new Error('QuotaExceededError');
        if (config.failPre && key === 'local-dashboard-pre-import-v1') throw new Error('QuotaExceededError');
        values.set(key, String(value));
      },
      removeItem(key) { values.delete(key); }
    };
    class FileReader {
      readAsText(file) {
        if (file.readError) { this.onerror(); return; }
        this.result = file.text; this.onload();
      }
    }
    const window = {
      confirm(message) { confirmations.push(message); return config.confirm; },
      alert(message) { alerts.push(message); }
    };
    let sequence = 0;
    const bindings = {
      state, els, localStorage, window, FileReader, structuredClone: clone,
      crypto: { randomUUID: () => 'test-' + ++sequence },
      console: { error() {} }, document: { getElementById: () => label },
      render() {}, updateSelectedChannelSum() {}, formatBatchDisplay: (x) => x,
      Blob: class { constructor(parts) { this.text = parts.join(''); } },
      downloadBlob: (blob, filename) => downloads.push({ text: blob.text, filename })
    };
    const api = new Function(...Object.keys(bindings), constants + '\n' +
      functions.map((name) => extract(appSource, name)).join('\n') +
      '\nreturn {' + functions.join(',') + '};')(...Object.values(bindings));
    state.data = api.normalizeState({
      tasks: [{ id: 'old-task', name: 'existing', history: { '2026-09-21': true }, archivedAt: '2026-09-20' }],
      channels: [{ id: 'old-channel', name: 'old', updatedAt: 'old-batch' }],
      stickyNotes: [{ id: 'old-note', text: 'keep me' }],
      dialogDb: { templates: [{ id: 'old-dialog', title: 'keep' }] }
    });
    api.saveState();
    return { api, state, values, config, alerts, confirmations, downloads, label, els };
  }
  const incoming = { tasks: [{ id: 'new-task', name: 'new', todayDone: true }], channels: [] };
  test('JavaScript and inline scripts parse', () => {
    new Function(appSource); new Function(tenjinSource);
    for (const match of htmlSource.matchAll(/<script\b[^>]*>([^]*?)<\/script>/g)) {
      if (match[1].trim()) new Function(match[1]);
    }
  });
  test('Reject unrelated, malformed and corrupt JSON without writes', () => {
    for (const input of [null, {}, [], 'hello', { foo: 1 }, { tasks: null }, { tasks: [null] },
      { tasks: [], channels: 'wrong' }, { tasks: [], dialogDb: { templates: [null] } }]) {
      const h = harness(), before = [...h.values];
      h.api.importJson({ text: JSON.stringify(input) });
      equal([...h.values], before, 'invalid backup modified storage');
      assert(!h.confirmations.length, 'invalid input reached confirmation');
    }
    const h = harness(), before = [...h.values];
    h.api.importJson({ text: '{broken' });
    h.api.importJson({ readError: true });
    equal([...h.values], before, 'file error modified storage');
  });
  test('Cancellation leaves all stored data unchanged', () => {
    const h = harness(), before = [...h.values]; h.config.confirm = false;
    h.api.importJson({ text: JSON.stringify(incoming) });
    equal([...h.values], before, 'cancel changed storage');
    assert(h.confirmations[0].includes('任務 1 筆'), 'missing preview');
  });
  test('Successful legacy import preserves recoverable before-import snapshot', () => {
    const h = harness(), before = clone(h.state.data);
    h.state.lastDeleted = { type: 'task' }; h.state.selectedChannelIds.add('old-channel');
    h.api.importJson({ text: JSON.stringify(incoming) });
    assert(h.state.data.tasks[0].id === 'new-task', 'not imported');
    assert(h.state.data.tasks[0].history[h.api.getDateKey(new Date())], 'legacy completion lost');
    equal(JSON.parse(h.values.get('local-dashboard-pre-import-v1')).data, before, 'before snapshot incorrect');
    equal(JSON.parse(h.values.get('local-dashboard-app-v1')), h.state.data, 'not persisted');
    assert(h.alerts.some((x) => x.includes('已匯入並儲存')), 'success absent');
    assert(h.state.lastDeleted === null && h.state.selectedChannelIds.size === 0, 'stale undo or selection');
    h.api.saveState();
    h.api.exportPreImportBackup();
    equal(JSON.parse(h.downloads[0].text), before, 'before backup not downloadable or overwritten');
  });
  test('Valid empty dashboard and channel-only legacy backups remain supported', () => {
    for (const data of [{ tasks: [], channels: [] }, { channels: [{ id: 'c', name: 'legacy' }] }]) {
      const h = harness(); h.api.importJson({ text: JSON.stringify(data) });
      assert(h.alerts.some((x) => x.includes('已匯入並儲存')), 'valid backup rejected');
    }
  });
  test('Backup storage failure aborts before replacing live data', () => {
    const h = harness(), before = clone(h.state.data), stored = [...h.values]; h.config.failPre = true;
    h.api.importJson({ text: JSON.stringify(incoming) });
    equal(h.state.data, before, 'state changed'); equal([...h.values], stored, 'storage changed');
    assert(h.alerts.some((x) => x.includes('已取消匯入')), 'no failure notice');
  });
  test('Save failure preserves original data and sticky backup without false success', () => {
    const h = harness(), before = clone(h.state.data);
    const sticky = h.values.get('local-dashboard-sticky-notes-v1');
    h.config.failMain = true;
    h.api.importJson({ text: JSON.stringify(incoming) });
    equal(h.state.data, before, 'memory changed');
    equal(JSON.parse(h.values.get('local-dashboard-app-v1')), before, 'live storage changed');
    assert(h.values.get('local-dashboard-sticky-notes-v1') === sticky, 'sticky backup changed');
    assert(!h.alerts.some((x) => x.includes('已匯入')), 'false success');
  });
  function batchHarness() {
    const h = harness();
    h.state.data.channels = [
      { id: 'a', name: 'a', updatedAt: 'target', amount: '123', extras: { custom: 'keep' } },
      { id: 'b', name: 'b', updatedAt: 'other' },
      { id: 'c', name: 'c', updatedAt: 'target' },
      { id: 'd', name: 'd', updatedAt: 'other' }
    ].map(h.api.normalizeChannel);
    h.state.data.channelBatchNotes = { target: 'restore this', other: 'untouched' };
    h.state.data.hiddenChannelRows = ['a'];
    h.state.historyBatchTime = 'target';
    h.state.selectedChannelIds = new Set(['a', 'b']);
    h.api.saveState();
    return h;
  }
  test('Batch delete and undo restore rows, order, custom data, notes and selection', () => {
    const h = batchHarness(), before = clone(h.state.data);
    h.api.deleteHistoryBatch();
    equal(h.state.data.channels.map((x) => x.id), ['b', 'd'], 'wrong rows deleted');
    assert(!('target' in h.state.data.channelBatchNotes), 'note not removed');
    equal([...h.state.selectedChannelIds], ['b'], 'selection stale');
    h.api.renderUndoBanner();
    assert(h.els.undoText.textContent.includes('2 筆'), 'wrong undo feedback');
    h.api.undoDelete();
    equal(h.state.data, before, 'batch restoration incomplete');
    equal([...h.state.selectedChannelIds].sort(), ['a', 'b'], 'selection not restored');
    assert(h.state.historyBatchTime === 'target', 'wrong history selection');
    h.api.undoDelete();
    equal(h.state.data, before, 'second undo duplicated rows');
  });
  test('Batch cancellation and failed persistence leave original state intact', () => {
    const h = batchHarness(), before = clone(h.state.data);
    h.config.confirm = false; h.api.deleteHistoryBatch();
    equal(h.state.data, before, 'cancel changed batch');
    h.config.confirm = true; h.config.failMain = true; h.api.deleteHistoryBatch();
    equal(h.state.data, before, 'failure changed batch');
    assert(h.state.lastDeleted === null, 'failed deletion advertised undo');
    assert(h.state.selectedChannelIds.has('a'), 'failed deletion changed selection');
  });
  test('Failed undo retains deletion record and permits successful retry', () => {
    const h = batchHarness(), before = clone(h.state.data);
    h.api.deleteHistoryBatch();
    const deletedState = clone(h.state.data);
    h.config.failMain = true; h.api.undoDelete();
    equal(h.state.data, deletedState, 'failed undo changed state');
    assert(h.state.lastDeleted?.type === 'channel-batch', 'undo record lost');
    h.config.failMain = false; h.api.undoDelete();
    equal(h.state.data, before, 'retry did not restore');
  });
  test('Existing single-task undo reconnects child and single-channel undo still works', () => {
    const h = harness();
    h.state.data.tasks = [{ id: 'child', parentId: '', name: 'child' }];
    h.state.lastDeleted = { type: 'task', item: { id: 'parent', name: 'parent' }, index: 0, childIds: ['child'] };
    h.api.undoDelete();
    assert(h.state.data.tasks[1].parentId === 'parent', 'child not reconnected');
    h.state.lastDeleted = { type: 'channel', item: { id: 'restored' }, index: 0 };
    h.api.undoDelete();
    assert(h.state.data.channels[0].id === 'restored', 'channel not restored');
  });
  test('Task count label follows selected date and returns to today', () => {
    const h = harness();
    h.state.data.tasks = [{ id: 't', history: { '2026-09-21': true } }];
    h.state.taskAnchorDate = new Date(2026, 8, 21); h.api.renderTaskSummary();
    assert(h.label.textContent.includes('2026-09-21'), 'wrong historical label');
    assert(h.els.taskOpenCount.textContent === '0', 'wrong count');
    h.state.taskAnchorDate = new Date(); h.api.renderTaskSummary();
    assert(h.label.textContent === '今日未完成：', 'today label not restored');
  });
  const monitor = new Function(extract(tenjinSource, 'beijingDateKey', '  ') + '\n' +
    extract(tenjinSource, 'latestCheckStatus', '  ') + '\nreturn { beijingDateKey, latestCheckStatus };')();
  const at = (time) => Date.parse('2026-09-22T' + time + '+08:00');
  const record = (time, error) => ({ checkedAt: '2026-09-22T' + time + '+08:00', error });
  test('Monitor distinguishes no result, old day, errors and malformed timestamps', () => {
    assert(monitor.latestCheckStatus(null, at('12:00:00')).text.includes('尚未執行'), 'missing empty status');
    assert(monitor.latestCheckStatus({ checkedAt: '2026-09-21T15:00:00+08:00' }, at('09:00:00')).text.includes('資料過期'), 'yesterday marked success');
    assert(monitor.latestCheckStatus(record('10:01:00', 'failure'), at('12:00:00')).text.includes('查詢失敗'), 'error lost');
    assert(monitor.latestCheckStatus({ checkedAt: 'bad' }, at('12:00:00')).warning, 'bad timestamp accepted');
    assert(monitor.latestCheckStatus(record('15:00:00'), at('12:00:00')).warning, 'future timestamp accepted');
  });
  test('Monitor uses Beijing day, scheduled deadlines, grace period and manual result', () => {
    assert(monitor.beijingDateKey('2026-09-21T16:01:00Z') === '2026-09-22', 'wrong timezone');
    assert(!monitor.latestCheckStatus(record('09:00:00'), at('10:14:59')).warning, 'grace period missing');
    assert(monitor.latestCheckStatus(record('09:00:00'), at('10:15:00')).warning, '10:00 stale not detected');
    assert(!monitor.latestCheckStatus(record('10:01:00'), at('15:14:59')).warning, 'afternoon grace missing');
    assert(monitor.latestCheckStatus(record('10:01:00'), at('15:15:00')).warning, '15:00 stale not detected');
    assert(!monitor.latestCheckStatus(record('15:20:00'), at('15:25:00')).warning, 'manual current result rejected');
  });
  test('Schedule cells use actual Beijing date rather than an old snapshot date', () => {
    const snapshot = { date: '2026-09-21' };
    const checks = [{ date: '2026-09-21', slot: '10:00' }, { date: '2026-09-22', slot: '10:00' }];
    const scheduled = new Function('snapshot','checksFor','beijingDateKey','Date',
      extract(tenjinSource, 'scheduledCheck', '  ') + '\nreturn scheduledCheck;')(
        snapshot, () => checks, monitor.beijingDateKey, { now: () => at('12:00:00') });
    assert(scheduled('id', '10:00') === checks[1], 'old day shown as today');
  });
  return results;
}
const root = path.resolve(__dirname, '..');
const results = runDashboardSafetyTests(...['app.js', 'tenjin-monitor.js', 'index.html'].map(name => fs.readFileSync(path.join(root, name), 'utf8')));
console.log(results.map(name => 'PASS ' + name).join('\n'));
console.log(results.length + ' tests passed');
