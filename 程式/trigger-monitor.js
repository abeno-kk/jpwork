const TRIGGER_MONITOR_SOURCE = {
  spreadsheetId: '1B298mjXY1HBAz4ohtNr1pletE9xTE44uYzL0932RRFU',
  gid: '1961758864',
  sheetName: '強弱轉觸發',
};

const TRIGGER_MONITOR_COLUMNS = [
  { id: 'uid', label: 'UID', aliases: ['UID'], numeric: true },
  { id: 'channel', label: '渠道', aliases: ['渠道'] },
  { id: 'version', label: '版本', aliases: ['版本'] },
  { id: 'item', label: '項目', aliases: ['項目'] },
  { id: 'yesterdayNew', label: '昨日新增', aliases: ['昨日新增'], numeric: true },
  { id: 'yesterdayDau', label: '昨日DAU', aliases: ['昨日DAU'], numeric: true },
  { id: 'yesterdayRecharge', label: '昨日充值', aliases: ['昨日充值'], numeric: true },
  { id: 'category', label: '分類', aliases: ['分類'] },
  { id: 'poison', label: '報毒', aliases: ['報毒'] },
  { id: 'daysRecharge', label: '天數/充值', aliases: ['天數/充值', '天數／充值'] },
];

const triggerMonitorState = {
  rows: [], loading: false, error: '', lastFetchedAt: 0, search: '', category: '', poison: '',
  days: '', recharge: '', version: '', item: '', sortKey: '', sortDirection: 'asc',
};

const triggerMonitorEls = {
  count: document.getElementById('trigger-monitor-count'),
  syncStatus: document.getElementById('trigger-monitor-sync-status'),
  refreshBtn: document.getElementById('trigger-monitor-refresh-btn'),
  syncMode: document.getElementById('trigger-monitor-sync-mode'),
  syncUrl: document.getElementById('trigger-monitor-sync-url'),
  syncSaveBtn: document.getElementById('trigger-monitor-sync-save-btn'),
  search: document.getElementById('trigger-monitor-search'),
  categoryFilter: document.getElementById('trigger-monitor-category-filter'),
  poisonFilter: document.getElementById('trigger-monitor-poison-filter'),
  daysFilter: document.getElementById('trigger-monitor-days-filter'),
  rechargeFilter: document.getElementById('trigger-monitor-recharge-filter'),
  versionFilter: document.getElementById('trigger-monitor-version-filter'),
  itemFilter: document.getElementById('trigger-monitor-item-filter'),
  clearBtn: document.getElementById('trigger-monitor-clear-btn'),
  message: document.getElementById('trigger-monitor-message'),
  help: document.getElementById('trigger-monitor-help'),
  tableHead: document.getElementById('trigger-monitor-table-head'),
  tableBody: document.getElementById('trigger-monitor-table-body'),
};

function getTriggerMonitorSyncConfig() {
  return state.data.triggerMonitorSync || state.data.channelSummarySync || { mode: 'apps-script', url: '' };
}

function normalizeTriggerMonitorHeader(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s_\-–—&＆/\\()（）]+/g, '');
}

function findTriggerMonitorColumnIndex(headers, column) {
  const aliases = [column.label, ...(column.aliases || [])].map(normalizeTriggerMonitorHeader);
  return headers.findIndex((header) => aliases.includes(normalizeTriggerMonitorHeader(header)));
}

function mapTriggerMonitorRowsByHeaders(headers, dataRows) {
  const indexes = TRIGGER_MONITOR_COLUMNS.map((column) => findTriggerMonitorColumnIndex(headers, column));
  return (Array.isArray(dataRows) ? dataRows : []).map((source, index) => {
    const row = { id: `trigger_${index}` };
    TRIGGER_MONITOR_COLUMNS.forEach((column, columnIndex) => {
      const sourceIndex = indexes[columnIndex];
      row[column.id] = sourceIndex >= 0 ? String(source?.[sourceIndex] ?? '').trim() : '';
    });
    return row;
  }).filter((row) => TRIGGER_MONITOR_COLUMNS.some((column) => row[column.id]));
}

function mapTriggerMonitorObjectRows(rows, preferredHeaders = []) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const first = sourceRows.find((row) => row && typeof row === 'object') || {};
  const headers = (preferredHeaders.length ? preferredHeaders : Object.keys(first)).map((header) => String(header || '').trim());
  return mapTriggerMonitorRowsByHeaders(headers, sourceRows.map((record) => headers.map((header) => record?.[header])));
}

function parseTriggerMonitorApiResponse(payload) {
  if (payload?.ok === false) throw new Error(payload.error || 'Apps Script API 回傳錯誤。');
  if (Array.isArray(payload)) {
    if (payload.length && !Array.isArray(payload[0]) && typeof payload[0] === 'object') return mapTriggerMonitorObjectRows(payload);
    return mapTriggerMonitorRowsByHeaders(payload[0] || [], payload.slice(1));
  }
  const headers = Array.isArray(payload?.headers) ? payload.headers : [];
  if (Array.isArray(payload?.rows)) {
    if (payload.rows.length && Array.isArray(payload.rows[0])) {
      return mapTriggerMonitorRowsByHeaders(headers.length ? headers : payload.rows[0], headers.length ? payload.rows : payload.rows.slice(1));
    }
    return mapTriggerMonitorObjectRows(payload.rows, headers);
  }
  if (Array.isArray(payload?.values)) return mapTriggerMonitorRowsByHeaders(payload.values[0] || [], payload.values.slice(1));
  throw new Error('Apps Script API 回傳格式不支援。');
}

function parseTriggerMonitorGvizResponse(response) {
  if (response?.status === 'error') {
    const reason = response?.errors?.[0]?.detailed_message || response?.errors?.[0]?.reason || 'Google Sheet 拒絕讀取。';
    throw new Error(`Google Sheet 無法直接同步：${reason}`);
  }
  const rows = response?.table?.rows;
  if (!Array.isArray(rows)) throw new Error('Google Sheet 目前需要登入或允許 Cookie，請改用 Apps Script API。');
  const headers = (response?.table?.cols || []).map((column, index) => String(column?.label || column?.id || `欄位 ${index + 1}`).trim());
  const values = rows.map((row) => (Array.isArray(row?.c) ? row.c : []).map((cell) => readGvizCell(cell)));
  return mapTriggerMonitorRowsByHeaders(headers, values);
}

function buildTriggerMonitorAppsScriptUrl(sourceUrl, callbackName) {
  try {
    const url = new URL(sourceUrl, window.location.href);
    url.searchParams.set('type', 'trigger-monitor');
    url.searchParams.set('callback', callbackName);
    return url.toString();
  } catch (error) {
    const separator = sourceUrl.includes('?') ? '&' : '?';
    return `${sourceUrl}${separator}type=trigger-monitor&callback=${encodeURIComponent(callbackName)}`;
  }
}

function loadTriggerMonitorRows() {
  const config = getTriggerMonitorSyncConfig();
  if (config.mode === 'public-csv') {
    if (!config.url) return Promise.reject(new Error('請先貼上公開 CSV 連結。'));
    return fetch(config.url).then((response) => {
      if (!response.ok) throw new Error('公開 CSV 連結讀取失敗。');
      return response.text();
    }).then((text) => {
      const rows = parseCsvRows(text);
      return mapTriggerMonitorRowsByHeaders(rows[0] || [], rows.slice(1));
    });
  }
  if (config.mode === 'apps-script') {
    if (!config.url) return Promise.reject(new Error('請先設定 Apps Script API 網址。'));
    return new Promise((resolve, reject) => {
      const callbackName = `__triggerMonitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      const timeout = window.setTimeout(() => { cleanup(); reject(new Error('Apps Script API 讀取逾時，請確認已重新部署最新版。')); }, 12000);
      function cleanup() { window.clearTimeout(timeout); delete window[callbackName]; script.remove(); }
      window[callbackName] = (payload) => {
        cleanup();
        try { resolve(parseTriggerMonitorApiResponse(payload)); } catch (error) { reject(error); }
      };
      script.onerror = () => { cleanup(); reject(new Error('Apps Script API 無法連線，請確認網址與部署權限。')); };
      script.src = buildTriggerMonitorAppsScriptUrl(config.url, callbackName);
      document.body.appendChild(script);
    });
  }
  return new Promise((resolve, reject) => {
    const callbackName = `__triggerMonitorGviz_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tqx = encodeURIComponent(`out:json;responseHandler:${callbackName}`);
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error('讀取 Google Sheet 逾時。')); }, 12000);
    function cleanup() { window.clearTimeout(timeout); delete window[callbackName]; script.remove(); }
    window[callbackName] = (response) => {
      cleanup();
      try { resolve(parseTriggerMonitorGvizResponse(response)); } catch (error) { reject(error); }
    };
    script.onerror = () => { cleanup(); reject(new Error('無法連線 Google Sheet，請確認權限。')); };
    script.src = `https://docs.google.com/spreadsheets/d/${TRIGGER_MONITOR_SOURCE.spreadsheetId}/gviz/tq?gid=${TRIGGER_MONITOR_SOURCE.gid}&headers=1&tqx=${tqx}`;
    document.body.appendChild(script);
  });
}

function refreshTriggerMonitor() {
  triggerMonitorState.loading = true;
  triggerMonitorState.error = '';
  renderTriggerMonitorView();
  return loadTriggerMonitorRows().then((rows) => {
    triggerMonitorState.rows = rows;
    triggerMonitorState.lastFetchedAt = Date.now();
    triggerMonitorState.error = '';
  }).catch((error) => {
    triggerMonitorState.error = error?.message || '讀取 Google Sheet 失敗。';
  }).finally(() => {
    triggerMonitorState.loading = false;
    renderTriggerMonitorView();
  });
}

function splitTriggerMonitorDaysRecharge(value) {
  const parts = String(value || '').split(/[\/／]/).map((part) => part.trim());
  return { days: parts[0] || '', recharge: parts[1] || '' };
}

function getTriggerMonitorFilteredRows() {
  const search = triggerMonitorState.search.trim().toLowerCase();
  const rows = triggerMonitorState.rows.filter((row) => {
    const split = splitTriggerMonitorDaysRecharge(row.daysRecharge);
    if (triggerMonitorState.category && row.category !== triggerMonitorState.category) return false;
    if (triggerMonitorState.poison && row.poison !== triggerMonitorState.poison) return false;
    if (triggerMonitorState.days && split.days !== triggerMonitorState.days) return false;
    if (triggerMonitorState.recharge && split.recharge !== triggerMonitorState.recharge) return false;
    if (triggerMonitorState.version && row.version !== triggerMonitorState.version) return false;
    if (triggerMonitorState.item && row.item !== triggerMonitorState.item) return false;
    if (!search) return true;
    return TRIGGER_MONITOR_COLUMNS.some((column) => String(row[column.id] || '').toLowerCase().includes(search));
  });
  if (!triggerMonitorState.sortKey) return rows;
  const column = TRIGGER_MONITOR_COLUMNS.find((item) => item.id === triggerMonitorState.sortKey);
  return [...rows].sort((a, b) => {
    let valueA = String(a[triggerMonitorState.sortKey] || '').trim();
    let valueB = String(b[triggerMonitorState.sortKey] || '').trim();
    if (column?.numeric) {
      valueA = Number(valueA.replace(/,/g, ''));
      valueB = Number(valueB.replace(/,/g, ''));
      if (!Number.isFinite(valueA)) valueA = Number.POSITIVE_INFINITY;
      if (!Number.isFinite(valueB)) valueB = Number.POSITIVE_INFINITY;
    }
    const result = typeof valueA === 'number' ? valueA - valueB : valueA.localeCompare(valueB, 'zh-Hant', { numeric: true, sensitivity: 'base' });
    return triggerMonitorState.sortDirection === 'asc' ? result : -result;
  });
}

function sortedTriggerMonitorValues(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-Hant', { numeric: true, sensitivity: 'base' }));
}

function syncTriggerMonitorFilters() {
  const rows = triggerMonitorState.rows;
  fillSelectOptions(triggerMonitorEls.categoryFilter, '全部分類', sortedTriggerMonitorValues(rows.map((row) => row.category)), triggerMonitorState.category);
  fillSelectOptions(triggerMonitorEls.poisonFilter, '全部報毒', sortedTriggerMonitorValues(rows.map((row) => row.poison)), triggerMonitorState.poison);
  fillSelectOptions(triggerMonitorEls.daysFilter, '全部天數', sortedTriggerMonitorValues(rows.map((row) => splitTriggerMonitorDaysRecharge(row.daysRecharge).days)), triggerMonitorState.days);
  fillSelectOptions(triggerMonitorEls.rechargeFilter, '全部充值', sortedTriggerMonitorValues(rows.map((row) => splitTriggerMonitorDaysRecharge(row.daysRecharge).recharge)), triggerMonitorState.recharge);
  fillSelectOptions(triggerMonitorEls.versionFilter, '全部版本', sortedTriggerMonitorValues(rows.map((row) => row.version)), triggerMonitorState.version);
  fillSelectOptions(triggerMonitorEls.itemFilter, '全部項目', sortedTriggerMonitorValues(rows.map((row) => row.item)), triggerMonitorState.item);
  triggerMonitorEls.search.value = triggerMonitorState.search;
}

function renderTriggerMonitorHead() {
  const tr = document.createElement('tr');
  TRIGGER_MONITOR_COLUMNS.forEach((column) => {
    const th = document.createElement('th');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `sort-button${triggerMonitorState.sortKey === column.id ? ' is-active' : ''}`;
    button.dataset.sortKey = column.id;
    const indicator = triggerMonitorState.sortKey === column.id ? (triggerMonitorState.sortDirection === 'asc' ? '↑' : '↓') : '↕';
    button.innerHTML = `<span>${escapeHtml(column.label)}</span><span class="sort-indicator">${indicator}</span>`;
    th.appendChild(button);
    tr.appendChild(th);
  });
  triggerMonitorEls.tableHead.innerHTML = '';
  triggerMonitorEls.tableHead.appendChild(tr);
}

function renderTriggerMonitorView() {
  if (!triggerMonitorEls.tableHead || !triggerMonitorEls.tableBody) return;
  const config = getTriggerMonitorSyncConfig();
  triggerMonitorEls.syncMode.value = config.mode || 'apps-script';
  triggerMonitorEls.syncUrl.value = config.url || '';
  syncTriggerMonitorFilters();
  renderTriggerMonitorHead();
  const rows = getTriggerMonitorFilteredRows();
  triggerMonitorEls.count.textContent = String(rows.length);
  triggerMonitorEls.syncStatus.textContent = triggerMonitorState.loading ? '同步中' : triggerMonitorState.lastFetchedAt ? `更新 ${new Date(triggerMonitorState.lastFetchedAt).toLocaleTimeString('zh-Hant', { hour: '2-digit', minute: '2-digit' })}` : '尚未同步';
  if (triggerMonitorState.error) {
    triggerMonitorEls.message.hidden = false;
    triggerMonitorEls.message.className = 'channel-summary-message is-error';
    triggerMonitorEls.message.textContent = triggerMonitorState.error;
  } else if (!triggerMonitorState.loading && !rows.length) {
    triggerMonitorEls.message.hidden = false;
    triggerMonitorEls.message.className = 'channel-summary-message';
    triggerMonitorEls.message.textContent = triggerMonitorState.rows.length ? '目前沒有符合條件的資料。' : '目前尚未抓到資料，請按「重新整理」。';
  } else {
    triggerMonitorEls.message.hidden = true;
    triggerMonitorEls.message.textContent = '';
  }
  triggerMonitorEls.help.hidden = !triggerMonitorState.error && triggerMonitorState.rows.length > 0;
  triggerMonitorEls.tableBody.innerHTML = '';
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    TRIGGER_MONITOR_COLUMNS.forEach((column) => {
      const td = document.createElement('td');
      td.textContent = row[column.id] || '';
      tr.appendChild(td);
    });
    triggerMonitorEls.tableBody.appendChild(tr);
  });
}

function clearTriggerMonitorFilters() {
  triggerMonitorState.search = '';
  triggerMonitorState.category = '';
  triggerMonitorState.poison = '';
  triggerMonitorState.days = '';
  triggerMonitorState.recharge = '';
  triggerMonitorState.version = '';
  triggerMonitorState.item = '';
  renderTriggerMonitorView();
}

triggerMonitorEls.refreshBtn?.addEventListener('click', () => void refreshTriggerMonitor());
triggerMonitorEls.syncSaveBtn?.addEventListener('click', () => {
  state.data.triggerMonitorSync = normalizeChannelSummarySync({ mode: triggerMonitorEls.syncMode.value || 'apps-script', url: triggerMonitorEls.syncUrl.value || '' });
  saveState();
  triggerMonitorState.rows = [];
  triggerMonitorState.error = '';
  triggerMonitorState.lastFetchedAt = 0;
  void refreshTriggerMonitor();
});
triggerMonitorEls.search?.addEventListener('input', () => { triggerMonitorState.search = triggerMonitorEls.search.value || ''; renderTriggerMonitorView(); });
triggerMonitorEls.categoryFilter?.addEventListener('change', () => { triggerMonitorState.category = triggerMonitorEls.categoryFilter.value || ''; renderTriggerMonitorView(); });
triggerMonitorEls.poisonFilter?.addEventListener('change', () => { triggerMonitorState.poison = triggerMonitorEls.poisonFilter.value || ''; renderTriggerMonitorView(); });
triggerMonitorEls.daysFilter?.addEventListener('change', () => { triggerMonitorState.days = triggerMonitorEls.daysFilter.value || ''; renderTriggerMonitorView(); });
triggerMonitorEls.rechargeFilter?.addEventListener('change', () => { triggerMonitorState.recharge = triggerMonitorEls.rechargeFilter.value || ''; renderTriggerMonitorView(); });
triggerMonitorEls.versionFilter?.addEventListener('change', () => { triggerMonitorState.version = triggerMonitorEls.versionFilter.value || ''; renderTriggerMonitorView(); });
triggerMonitorEls.itemFilter?.addEventListener('change', () => { triggerMonitorState.item = triggerMonitorEls.itemFilter.value || ''; renderTriggerMonitorView(); });
triggerMonitorEls.clearBtn?.addEventListener('click', clearTriggerMonitorFilters);
triggerMonitorEls.tableHead?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-sort-key]');
  if (!button) return;
  const sortKey = button.dataset.sortKey;
  if (triggerMonitorState.sortKey === sortKey) triggerMonitorState.sortDirection = triggerMonitorState.sortDirection === 'asc' ? 'desc' : 'asc';
  else {
    triggerMonitorState.sortKey = sortKey;
    triggerMonitorState.sortDirection = TRIGGER_MONITOR_COLUMNS.find((item) => item.id === sortKey)?.numeric ? 'desc' : 'asc';
  }
  renderTriggerMonitorView();
});
document.querySelector('[data-view="trigger-monitor"]')?.addEventListener('click', renderTriggerMonitorView);
renderTriggerMonitorView();