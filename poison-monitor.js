(function () {
  'use strict';

  var SOURCE = {
    spreadsheetId: '1B298mjXY1HBAz4ohtNr1pletE9xTE44uYzL0932RRFU',
    gid: '1177376120'
  };
  var STORAGE_KEY = 'dashboard-poison-monitor-v1';
  var state = {
    headers: [], rows: [], loading: false, error: '', lastFetchedAt: 0,
    search: '', online: '', developerStatus: '', mechanism: '', poisonStatus: '',
    sortHeader: '', sortDirection: 'asc', hiddenHeaders: new Set()
  };
  var els = {
    count: document.getElementById('poison-monitor-count'),
    poisonCount: document.getElementById('poison-monitor-poison-count'),
    status: document.getElementById('poison-monitor-sync-status'),
    refresh: document.getElementById('poison-monitor-refresh-btn'),
    syncMode: document.getElementById('poison-monitor-sync-mode'),
    syncUrl: document.getElementById('poison-monitor-sync-url'),
    syncSave: document.getElementById('poison-monitor-sync-save-btn'),
    search: document.getElementById('poison-monitor-search'),
    online: document.getElementById('poison-monitor-online-filter'),
    developerStatus: document.getElementById('poison-monitor-developer-filter'),
    mechanism: document.getElementById('poison-monitor-mechanism-filter'),
    poisonStatus: document.getElementById('poison-monitor-poison-filter'),
    clear: document.getElementById('poison-monitor-clear-btn'),
    fieldSettings: document.getElementById('poison-monitor-field-settings-btn'),
    message: document.getElementById('poison-monitor-message'),
    head: document.getElementById('poison-monitor-table-head'),
    body: document.getElementById('poison-monitor-table-body'),
    dialog: document.getElementById('poison-monitor-field-dialog'),
    settingsList: document.getElementById('poison-monitor-field-list')
  };
  if (!els.body) return;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function loadSettings() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch (error) { saved = {}; }
    state.hiddenHeaders = new Set(Array.isArray(saved.hiddenHeaders) ? saved.hiddenHeaders : []);
    if (saved.sync && saved.sync.url) return saved.sync;
    try {
      var dashboard = JSON.parse(localStorage.getItem('local-dashboard-app-v1') || '{}') || {};
      if (dashboard.channelSummarySync && dashboard.channelSummarySync.url) {
        return { mode: dashboard.channelSummarySync.mode || 'apps-script', url: dashboard.channelSummarySync.url };
      }
    } catch (error) {}
    return { mode: 'apps-script', url: '' };
  }

  var syncConfig = loadSettings();

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sync: syncConfig,
      hiddenHeaders: Array.from(state.hiddenHeaders)
    }));
  }

  function readValue(row, aliases) {
    for (var index = 0; index < aliases.length; index += 1) {
      var header = aliases[index];
      if (Object.prototype.hasOwnProperty.call(row, header)) return String(row[header] || '').trim();
    }
    return '';
  }

  function isPoisoned(row) {
    var explicit = readValue(row, ['\u5831\u6bd2', '\u62a5\u6bd2', '\u5831\u6bd2\u72c0\u614b', '\u62a5\u6bd2\u72b6\u6001']);
    if (explicit) return !/^(\u5426|\u672a\u5831\u6bd2|\u672a\u62a5\u6bd2|false|0)$/i.test(explicit);
    return /(\u5831\u6bd2|\u62a5\u6bd2)/i.test(
      readValue(row, ['\u5099\u8a3b', '\u5907\u6ce8', 'remark', 'remarks', 'note'])
    );
  }

  function uniqueValues(aliases) {
    return Array.from(new Set(state.rows.map(function (row) {
      return readValue(row, aliases);
    }).filter(Boolean))).sort(function (left, right) {
      return left.localeCompare(right, 'zh-Hant', { numeric: true });
    });
  }

  function fillSelect(select, placeholder, values, current) {
    if (!select) return;
    select.innerHTML = ['<option value="">' + escapeHtml(placeholder) + '</option>']
      .concat(values.map(function (value) {
        return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
      })).join('');
    select.value = current || '';
  }

  function syncFilters() {
    fillSelect(els.online, '\u5168\u90e8\u5728\u7dda\u72c0\u614b',
      uniqueValues(['\u662f\u5426\u5728\u7dda', '\u662f\u5426\u5728\u7ebf']), state.online);
    fillSelect(els.developerStatus, '\u5168\u90e8\u5c01\u865f\u72c0\u614b',
      uniqueValues(['\u958b\u767c\u8005\u662f\u5426\u5c01\u865f', '\u5f00\u53d1\u8005\u662f\u5426\u5c01\u53f7']), state.developerStatus);
    fillSelect(els.mechanism, '\u5168\u90e8\u5305\u6a5f\u5236',
      uniqueValues(['\u5305\u6a5f\u5236', '\u5305\u673a\u5236']), state.mechanism);
    els.poisonStatus.value = state.poisonStatus;
    els.search.value = state.search;
  }

  function filteredRows() {
    var search = state.search.trim().toLowerCase();
    var rows = state.rows.filter(function (row) {
      if (state.online && readValue(row, ['\u662f\u5426\u5728\u7dda', '\u662f\u5426\u5728\u7ebf']) !== state.online) return false;
      if (state.developerStatus && readValue(row, ['\u958b\u767c\u8005\u662f\u5426\u5c01\u865f', '\u5f00\u53d1\u8005\u662f\u5426\u5c01\u53f7']) !== state.developerStatus) return false;
      if (state.mechanism && readValue(row, ['\u5305\u6a5f\u5236', '\u5305\u673a\u5236']) !== state.mechanism) return false;
      if (state.poisonStatus === 'poisoned' && !isPoisoned(row)) return false;
      if (state.poisonStatus === 'clean' && isPoisoned(row)) return false;
      if (!search) return true;
      return state.headers.some(function (header) {
        return String(row[header] || '').toLowerCase().includes(search);
      });
    });
    if (!state.sortHeader) return rows;
    return rows.slice().sort(function (left, right) {
      var valueA = String(left[state.sortHeader] || '').trim();
      var valueB = String(right[state.sortHeader] || '').trim();
      var result = valueA.localeCompare(valueB, 'zh-Hant', { numeric: true, sensitivity: 'base' });
      return state.sortDirection === 'asc' ? result : -result;
    });
  }

  function cellHtml(value) {
    var text = String(value == null ? '' : value);
    if (/^https?:\/\//i.test(text)) {
      return '<a href="' + escapeHtml(text) + '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(text) + '</a>';
    }
    return escapeHtml(text).replaceAll('\n', '<br>');
  }

  function renderHead() {
    var visible = state.headers.filter(function (header) { return !state.hiddenHeaders.has(header); });
    els.head.innerHTML = '<tr>' + visible.map(function (header) {
      var arrow = state.sortHeader === header
        ? (state.sortDirection === 'asc' ? ' \u2191' : ' \u2193')
        : ' \u2195';
      return '<th><button type="button" class="sort-button" data-poison-sort="' + escapeHtml(header) + '">' +
        escapeHtml(header) + '<span aria-hidden="true">' + arrow + '</span></button></th>';
    }).join('') + '</tr>';
  }

  function renderRows(rows) {
    var visible = state.headers.filter(function (header) { return !state.hiddenHeaders.has(header); });
    if (!rows.length) {
      els.body.innerHTML = '<tr><td colspan="' + Math.max(visible.length, 1) + '" class="empty-cell">' +
        (state.loading ? '\u540c\u6b65\u4e2d\u2026' : '\u6c92\u6709\u7b26\u5408\u689d\u4ef6\u7684\u8cc7\u6599') +
        '</td></tr>';
      return;
    }
    els.body.innerHTML = rows.map(function (row) {
      return '<tr class="' + (isPoisoned(row) ? 'is-poisoned' : '') + '">' +
        visible.map(function (header) { return '<td>' + cellHtml(row[header]) + '</td>'; }).join('') +
        '</tr>';
    }).join('');
  }

  function render() {
    syncFilters();
    var rows = filteredRows();
    els.count.textContent = String(rows.length);
    els.poisonCount.textContent = String(state.rows.filter(isPoisoned).length);
    els.status.textContent = state.loading
      ? '\u540c\u6b65\u4e2d'
      : state.lastFetchedAt
        ? '\u66f4\u65b0 ' + new Date(state.lastFetchedAt).toLocaleTimeString('zh-Hant', {
            hour: '2-digit', minute: '2-digit'
          }) + '\u30fb' + state.headers.length + ' \u6b04'
        : '\u5c1a\u672a\u540c\u6b65';
    els.message.hidden = !state.error;
    els.message.textContent = state.error;
    els.message.classList.toggle('is-error', Boolean(state.error));
    els.syncMode.value = syncConfig.mode || 'apps-script';
    els.syncUrl.value = syncConfig.url || '';
    renderHead();
    renderRows(rows);
  }

  function rowsFromArrays(values) {
    if (!Array.isArray(values) || !values.length) return { headers: [], rows: [] };
    var headers = values[0].map(function (value, index) {
      return String(value || '').trim() || '\u6b04\u4f4d ' + (index + 1);
    });
    var rows = values.slice(1).filter(function (row) {
      return row.some(function (cell) { return String(cell || '').trim(); });
    }).map(function (sourceRow) {
      var record = {};
      headers.forEach(function (header, index) {
        record[header] = String(sourceRow[index] || '').trim();
      });
      return record;
    });
    return { headers: headers, rows: rows };
  }

  function parseCsv(text) {
    var output = [];
    var row = [];
    var value = '';
    var quoted = false;
    for (var index = 0; index < text.length; index += 1) {
      var char = text[index];
      if (char === '"') {
        if (quoted && text[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === ',' && !quoted) {
        row.push(value);
        value = '';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && text[index + 1] === '\n') index += 1;
        row.push(value);
        output.push(row);
        row = [];
        value = '';
      } else {
        value += char;
      }
    }
    if (value || row.length) {
      row.push(value);
      output.push(row);
    }
    return rowsFromArrays(output);
  }

  function rowsFromApi(payload) {
    if (!payload || payload.ok === false) {
      throw new Error(payload && payload.error ? payload.error : 'Apps Script API \u8fd4\u56de\u932f\u8aa4');
    }
    var headers = Array.isArray(payload.headers) ? payload.headers.map(String) : [];
    var rows = Array.isArray(payload.rows) ? payload.rows.map(function (sourceRow) {
      var record = {};
      headers.forEach(function (header) {
        record[header] = String(sourceRow && sourceRow[header] || '').trim();
      });
      return record;
    }) : [];
    return { headers: headers, rows: rows };
  }

  function readGvizCell(cell) {
    if (!cell) return '';
    if (cell.f !== null && cell.f !== undefined && cell.f !== '') return String(cell.f);
    if (typeof cell.v === 'boolean') return cell.v ? 'TRUE' : 'FALSE';
    return String(cell.v == null ? '' : cell.v);
  }

  function rowsFromGviz(response) {
    if (response && response.status === 'error') throw new Error('\u7121\u6cd5\u8b80\u53d6 Google Sheet');
    var headers = (response && response.table && response.table.cols || []).map(function (column, index) {
      return String(column.label || column.id || ('\u6b04\u4f4d ' + (index + 1))).trim();
    });
    var rows = (response && response.table && response.table.rows || []).map(function (sourceRow) {
      var record = {};
      headers.forEach(function (header, index) {
        record[header] = readGvizCell(sourceRow.c && sourceRow.c[index]);
      });
      return record;
    }).filter(function (row) {
      return headers.some(function (header) { return String(row[header] || '').trim(); });
    });
    return { headers: headers, rows: rows };
  }

  function jsonp(urlBuilder, callbackPrefix, parser) {
    return new Promise(function (resolve, reject) {
      var callbackName = callbackPrefix + Date.now() + '_' + Math.random().toString(36).slice(2);
      var script = document.createElement('script');
      var timer = window.setTimeout(function () {
        cleanup();
        reject(new Error('\u540c\u6b65\u903e\u6642\uff0c\u8acb\u78ba\u8a8d\u7db2\u5740\u8207\u90e8\u7f72\u72c0\u614b'));
      }, 15000);
      function cleanup() {
        window.clearTimeout(timer);
        delete window[callbackName];
        script.remove();
      }
      window[callbackName] = function (payload) {
        cleanup();
        try { resolve(parser(payload)); }
        catch (error) { reject(error); }
      };
      script.onerror = function () {
        cleanup();
        reject(new Error('\u7121\u6cd5\u9023\u7dda\u540c\u6b65\u4f86\u6e90'));
      };
      script.src = urlBuilder(callbackName);
      document.body.appendChild(script);
    });
  }

  function loadRows() {
    if (syncConfig.mode === 'public-csv') {
      if (!syncConfig.url) return Promise.reject(new Error('\u8acb\u5148\u8cbc\u4e0a\u516c\u958b CSV \u9023\u7d50'));
      return fetch(syncConfig.url).then(function (response) {
        if (!response.ok) throw new Error('\u516c\u958b CSV \u8b80\u53d6\u5931\u6557');
        return response.text();
      }).then(parseCsv);
    }
    if (syncConfig.mode === 'sheet-direct') {
      return jsonp(function (callbackName) {
        var tqx = encodeURIComponent('out:json;responseHandler:' + callbackName);
        return 'https://docs.google.com/spreadsheets/d/' + SOURCE.spreadsheetId +
          '/gviz/tq?gid=' + SOURCE.gid + '&headers=1&tqx=' + tqx;
      }, '__poisonMonitorSheet_', rowsFromGviz);
    }
    if (!syncConfig.url) {
      return Promise.reject(new Error(
        '\u8acb\u5148\u5728\u6e20\u9053\u7d71\u6574\u8868\u5132\u5b58 Apps Script API \u7db2\u5740\uff0c\u6216\u5728\u672c\u9801\u8cbc\u4e0a\u7db2\u5740'
      ));
    }
    return jsonp(function (callbackName) {
      var url = new URL(syncConfig.url, window.location.href);
      url.searchParams.set('type', 'poison-monitor');
      url.searchParams.set('callback', callbackName);
      return url.toString();
    }, '__poisonMonitorApi_', rowsFromApi);
  }

  function refresh() {
    state.loading = true;
    state.error = '';
    render();
    loadRows().then(function (result) {
      state.headers = result.headers;
      state.rows = result.rows;
      state.lastFetchedAt = Date.now();
    }).catch(function (error) {
      state.error = error && error.message ? error.message : '\u8b80\u53d6\u5831\u6bd2\u76e3\u63a7\u5931\u6557';
    }).finally(function () {
      state.loading = false;
      render();
    });
  }

  function renderFieldSettings() {
    els.settingsList.innerHTML = state.headers.map(function (header) {
      return '<label class="settings-item poison-monitor-settings-item">' +
        '<span class="settings-type">' + escapeHtml(header) + '</span>' +
        '<input type="checkbox" data-poison-column="' + escapeHtml(header) + '"' +
        (state.hiddenHeaders.has(header) ? '' : ' checked') + '></label>';
    }).join('');
  }

  els.refresh.addEventListener('click', refresh);
  els.syncSave.addEventListener('click', function () {
    syncConfig = { mode: els.syncMode.value || 'apps-script', url: String(els.syncUrl.value || '').trim() };
    saveSettings();
    refresh();
  });
  els.search.addEventListener('input', function () { state.search = els.search.value || ''; render(); });
  els.online.addEventListener('change', function () { state.online = els.online.value || ''; render(); });
  els.developerStatus.addEventListener('change', function () { state.developerStatus = els.developerStatus.value || ''; render(); });
  els.mechanism.addEventListener('change', function () { state.mechanism = els.mechanism.value || ''; render(); });
  els.poisonStatus.addEventListener('change', function () { state.poisonStatus = els.poisonStatus.value || ''; render(); });
  els.clear.addEventListener('click', function () {
    state.search = '';
    state.online = '';
    state.developerStatus = '';
    state.mechanism = '';
    state.poisonStatus = '';
    render();
  });
  els.head.addEventListener('click', function (event) {
    var button = event.target.closest('[data-poison-sort]');
    if (!button) return;
    var header = button.dataset.poisonSort;
    if (state.sortHeader === header) state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    else {
      state.sortHeader = header;
      state.sortDirection = 'asc';
    }
    render();
  });
  els.fieldSettings.addEventListener('click', function () {
    renderFieldSettings();
    els.dialog.showModal();
  });
  els.settingsList.addEventListener('change', function (event) {
    var input = event.target.closest('[data-poison-column]');
    if (!input) return;
    if (input.checked) state.hiddenHeaders.delete(input.dataset.poisonColumn);
    else state.hiddenHeaders.add(input.dataset.poisonColumn);
    saveSettings();
    render();
  });
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-view="poison-monitor"]');
    if (button && !state.rows.length && !state.loading) window.setTimeout(refresh, 0);
  });

  render();
})();
