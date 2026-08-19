(function () {
  'use strict';

  var els = {
    input: document.getElementById('tenjin-appids-input'),
    save: document.getElementById('tenjin-save-appids-btn'),
    checkNow: document.getElementById('tenjin-check-now-btn'),
    status: document.getElementById('tenjin-monitor-status'),
    message: document.getElementById('tenjin-monitor-message'),
    body: document.getElementById('tenjin-monitor-body'),
    empty: document.getElementById('tenjin-monitor-empty')
  };
  if (!els.body) return;

  var snapshot = { appIds: [], checks: [], date: '' };
  var loading = false;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function formatDate(value) {
    if (!value) return '—';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('zh-TW', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  }

  function formatTime(value) {
    if (!value) return '尚未執行';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '尚未執行';
    return date.toLocaleTimeString('zh-TW', {
      timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  }

  function setMessage(text, isError) {
    els.message.hidden = !text;
    els.message.textContent = text || '';
    els.message.classList.toggle('is-error', Boolean(isError));
  }

  function displayError(value) {
    var text = String(value || '');
    if (/TENJIN_TIMEOUT|timed out|timeout|超时|逾時|操作超時/i.test(text)) {
      return 'Tenjin 網站回應逾時，系統會在下一次排程自動重試。';
    }
    if (text.indexOf('LOCAL_REQUEST_TIMEOUT') >= 0) {
      return '本機查詢等待逾時，請稍後再按一次「立即查詢」。';
    }
    if (text.indexOf('TENJIN_REQUEST_FAILED:') === 0) {
      return 'Tenjin 網站目前無法查詢，系統會在下一次排程自動重試。';
    }
    return text || '查詢失敗';
  }

  function parseAppIds(raw) {
    var values = String(raw || '').split(/[\s,，;；]+/).map(function (value) {
      return value.trim();
    }).filter(Boolean);
    var invalid = values.filter(function (value) { return !/^\d{6,15}$/.test(value); });
    if (invalid.length) throw new Error('APPID 只能輸入 6–15 位數字：' + invalid.join('、'));
    return Array.from(new Set(values));
  }

  async function request(path, options) {
    var controller = new AbortController();
    var timer = window.setTimeout(function () { controller.abort(); }, 32000);
    try {
      var response = await fetch(path, Object.assign({
        headers: { Accept: 'application/json' }, signal: controller.signal
      }, options || {}));
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok || payload.ok === false) throw new Error(payload.error || '服務回應失敗（' + response.status + '）');
      return payload;
    } catch (error) {
      if (error && error.name === 'AbortError') throw new Error('LOCAL_REQUEST_TIMEOUT');
      throw error;
    } finally {
      window.clearTimeout(timer);
    }
  }

  function checksFor(appId) {
    return (Array.isArray(snapshot.checks) ? snapshot.checks : []).filter(function (item) {
      return String(item.appId) === String(appId);
    }).sort(function (a, b) { return String(b.checkedAt || '').localeCompare(String(a.checkedAt || '')); });
  }

  function scheduledCheck(appId, slot) {
    return checksFor(appId).find(function (check) {
      return check.date === snapshot.date && check.slot === slot;
    });
  }

  function metricValue(item, key) {
    if (!item || item.error || !Object.prototype.hasOwnProperty.call(item, key)) return '—';
    return String(item[key] == null ? 0 : item[key]);
  }

  function metricsCell(item, isLatest) {
    var badgeClass = 'tenjin-count-badge' + (isLatest ? ' is-latest' : '');
    return [
      '<div class="tenjin-metric-lines">',
      '<span><small>完成註冊</small><strong class="' + badgeClass + '">' + escapeHtml(metricValue(item, 'count')) + '</strong></span>',
      '<span><small>進入驗證碼頁</small><strong class="' + badgeClass + '">' + escapeHtml(metricValue(item, 'c4EnterOptCount')) + '</strong></span>',
      '</div>'
    ].join('');
  }

  function scheduledTimeCell(item) {
    if (!item) return '<span class="tenjin-schedule-pending">尚未執行</span>';
    if (item.error) return '<span class="tenjin-schedule-error">執行失敗<br>' + escapeHtml(formatTime(item.checkedAt)) + '</span>';
    return '<time class="tenjin-schedule-time" datetime="' + escapeHtml(item.checkedAt || '') + '">' +
      escapeHtml(formatTime(item.checkedAt)) + '</time>';
  }

  function render() {
    var ids = Array.isArray(snapshot.appIds) ? snapshot.appIds : [];
    els.empty.hidden = ids.length > 0;
    els.body.innerHTML = ids.map(function (appId, index) {
      var latest = checksFor(appId)[0];
      var statusText = latest ? (latest.error ? displayError(latest.error) : '正常') : '等待第一次查詢';
      var statusClass = latest && latest.error ? ' is-error' : '';
      return [
        '<tr data-tenjin-appid="' + escapeHtml(appId) + '">',
        '<td>' + (index + 1) + '</td>',
        '<td><strong class="tenjin-appid">' + escapeHtml(appId) + '</strong></td>',
        '<td>' + scheduledTimeCell(scheduledCheck(appId, '10:00')) + '</td>',
        '<td>' + scheduledTimeCell(scheduledCheck(appId, '15:00')) + '</td>',
        '<td>' + metricsCell(latest, true) + '</td>',
        '<td>' + escapeHtml(formatDate(latest && latest.checkedAt)) + '</td>',
        '<td><span class="google-play-row-status' + statusClass + '">' + escapeHtml(statusText) + '</span></td>',
        '<td><button class="danger-button compact-mini-button" data-tenjin-action="delete" type="button">刪除</button></td>',
        '</tr>'
      ].join('');
    }).join('');
    els.status.textContent = '固定查詢：每日 10:00、15:00（上海時間）';
  }

  async function refresh(options) {
    options = options || {};
    if (loading) return;
    loading = true;
    try {
      snapshot = await request('/api/tenjin-monitor');
      if (!options.keepInput) els.input.value = (snapshot.appIds || []).join('\n');
      render();
      if (!options.quiet) setMessage('', false);
    } catch (error) {
      els.status.textContent = '本機監控服務未連線';
      setMessage(error.message && error.message.includes('fetch')
        ? '請使用「啟動總儀表板.cmd」開啟背景查詢服務。'
        : (error.message || '讀取失敗'), true);
    } finally {
      loading = false;
    }
  }

  async function saveAppIds() {
    try {
      var appIds = parseAppIds(els.input.value);
      els.save.disabled = true;
      snapshot = await request('/api/tenjin-monitor', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ appIds: appIds })
      });
      els.input.value = (snapshot.appIds || []).join('\n');
      render();
      setMessage('已儲存 ' + appIds.length + ' 個 APPID；背景會在 10:00 與 15:00 自動查詢。', false);
    } catch (error) {
      setMessage(error.message || '儲存失敗', true);
    } finally {
      els.save.disabled = false;
    }
  }

  async function checkNow() {
    if (!(snapshot.appIds || []).length) {
      setMessage('請先輸入並儲存 APPID。', true);
      return;
    }
    els.checkNow.disabled = true;
    els.checkNow.textContent = '查詢中…';
    setMessage('正在查詢 Tenjin，請稍候。', false);
    try {
      snapshot = await request('/api/tenjin-monitor/check', { method: 'POST' });
      render();
      var failed = Array.isArray(snapshot.manualFailedAppIds) ? snapshot.manualFailedAppIds : [];
      if (failed.length) {
        setMessage('查詢未完成：' + failed.join('、') + ' 的 Tenjin 網站回應失敗，系統會在下一次排程自動重試。', true);
      } else {
        setMessage('立即查詢已完成。', false);
      }
    } catch (error) {
      setMessage(displayError(error.message), true);
    } finally {
      els.checkNow.disabled = false;
      els.checkNow.textContent = '立即查詢';
    }
  }

  els.save.addEventListener('click', saveAppIds);
  els.checkNow.addEventListener('click', checkNow);
  els.body.addEventListener('click', async function (event) {
    var button = event.target.closest('[data-tenjin-action="delete"]');
    var row = event.target.closest('[data-tenjin-appid]');
    if (!button || !row) return;
    var remaining = (snapshot.appIds || []).filter(function (id) { return id !== row.dataset.tenjinAppid; });
    els.input.value = remaining.join('\n');
    await saveAppIds();
  });

  void refresh();
  window.setInterval(function () { void refresh({ quiet: true, keepInput: true }); }, 60 * 1000);
})();
