const STORAGE_KEY = 'local-dashboard-app-v1';
const DEFAULT_CHANNEL_COLUMNS = [
  { id: 'source', label: '來源', type: 'source' },
  { id: 'name', label: '渠道名稱', type: 'text' },
  { id: 'amount', label: '最新金額', type: 'text' },
  { id: 'result', label: '處理結果', type: 'result' },
  { id: 'status', label: '狀態', type: 'status' },
  { id: 'note', label: '備註', type: 'text' },
  { id: 'updatedAt', label: '時間', type: 'datetime' },
];
const DEFAULT_TASK_COLUMNS = [
  { id: 'name', label: '項目', type: 'text' },
  { id: 'guideUrl1', label: '操作說明 1', type: 'guide' },
  { id: 'guideUrl2', label: '操作說明 2', type: 'guide' },
  { id: 'type', label: '類型', type: 'taskType' },
  { id: 'note', label: '備註', type: 'text' },
  { id: 'history_0', label: '今日是否完成', type: 'history', offset: 0 },
  { id: 'history_1', label: '昨日是否完成', type: 'history', offset: -1 },
  { id: 'history_2', label: '前日是否完成', type: 'history', offset: -2 },
];
const DEFAULT_DROPDOWN_OPTIONS = {
  source: ['回U渠道檢查表', '回U渠道-R'],
  taskType: ['每日', '週六', '機動性'],
  result: ['已回U', '不回U', '詢問中', '目前暫無法回U'],
  status: ['啟用', '關閉'],
};
const CHANNEL_SUMMARY_SOURCE = {
  spreadsheetId: '1B298mjXY1HBAz4ohtNr1pletE9xTE44uYzL0932RRFU',
  gid: '946256325',
  title: '渠道APPID總表',
};

/**
 * 定義更新列表資料來源。這一頁會對應 Google Sheet「更新記錄」分頁，
 * 與渠道統整表來源相同的試算表 ID，但使用表名而非 gid 以便於後續維護。
 * 如需調整分頁名稱，可以修改 sheetName。
 */
const UPDATE_RECORD_SOURCE = {
  spreadsheetId: CHANNEL_SUMMARY_SOURCE.spreadsheetId,
  // 使用 sheetName 指定工作表名稱；若使用 gid，請改為 gid: 'xxx'
  sheetName: '更新記錄',
  title: '更新記錄',
};
/**
 * 定義渠道統整表欄位。
 *
 * 為了適應 Google Sheet 欄位名稱可能存在中英空格或別稱的情況，
 * 每個欄位除了預設的 label 之外，可定義一組 aliases 供程式比對。
 * 第一個匹配到的別名會被當作該欄位的來源。
 *
 * 某些欄位（如版本）會從多個別名組合值，加入 `joinAliases: true` 代表要將所有別名資料串起來。
 */
const CHANNEL_SUMMARY_COLUMNS = [
  {
    id: 'appid',
    label: 'APPID',
    index: 0,
    // 部分 Google Sheet 可能使用 APP ID 或 APPId 等寫法
    aliases: ['APP ID', 'APPID', 'AppID'],
  },
  {
    id: 'channelName',
    label: '渠道&名稱',
    index: 1,
    // 包名或包名稱通常對應渠道名稱
    aliases: ['渠道&名稱', '包名'],
  },
  {
    id: 'channel',
    label: '渠道',
    index: 2,
    // 此欄位對應包的渠道名稱。由於不同試算表可能使用簡繁中文或不同稱呼，
    // 這裡列出所有可能的別名，例如「應用渠道」（繁體）、"应用渠道"（簡體）、
    // 「渠道名稱」等，以便正確匹配。
    aliases: ['渠道', '應用渠道', '应用渠道', '渠道名稱'],
  },
  {
    id: 'version',
    label: '版本',
    index: 3,
    // 版本可能由包類型2與 W2A包組合而來
    // 加入包名稱作為版本的一部分，並允許串接多個來源
    aliases: ['版本', '包類型2', 'W2A包', '包名稱'],
    joinAliases: true,
  },
  {
    id: 'yesterdayNew',
    label: '昨日新增',
    index: 4,
    aliases: ['昨日新增'],
  },
  {
    id: 'yesterdayDau',
    label: '昨日DAU',
    index: 5,
    aliases: ['昨日DAU', '昨日DAU'],
  },
  {
    id: 'yesterdayRecharge',
    label: '昨日充值',
    index: 6,
    aliases: ['昨日充值'],
  },
  {
    id: 'versionChecked',
    label: '版本確認',
    index: 7,
    aliases: ['版本確認'],
  },
  {
    id: 'loginB',
    label: '登入B面',
    index: 8,
    aliases: ['登入B面', '登入B'],
  },
  {
    id: 'rechargeCheck',
    label: '拉充值',
    index: 9,
    aliases: ['拉充值'],
  },
  {
    id: 'gamePlay',
    label: '遊戲遊玩',
    index: 10,
    aliases: ['遊戲遊玩'],
  },
];

const CHANNEL_SUMMARY_NUMERIC_COLUMNS = new Set([
  'appid',
  'yesterdayNew',
  'yesterdayDau',
  'yesterdayRecharge',
]);
const DEFAULT_CLOUD_SYNC = {
  enabled: false,
  url: '',
  lastPulledAt: 0,
  lastPushedAt: 0,
  lastRemoteUpdatedAt: '',
};

let cloudSyncPushTimer = 0;

const state = {
  view: 'tasks',
  data: loadState(),
  lastDeleted: null,
  taskAnchorDate: new Date(),
  fieldSettingsTarget: 'tasks',
  draggedColumn: null,
  draggedRow: null,
  captureMode: false,
  previousView: 'tasks',
  capturePage: 0,
  historyBatchTime: '',
  historyRangeStart: '',
  historyRangeEnd: '',
  editingGuide: null,
  taskArchiveSearch: '',
  taskArchiveType: '',
  navGroups: {
    tasks: true,
    channels: true,
  },
  channelSummary: {
    rows: [],
    loading: false,
    error: '',
    lastFetchedAt: 0,
    search: '',
    channel: '',
    version: '',
    versionChecked: '',
    sortKey: '',
    sortDirection: 'asc',
  },

  // 更新列表狀態：與渠道統整表相同資料來源，單獨用於更新列表頁面
  updateList: {
    rows: [],
    // 動態標題陣列，用於渲染更新列表表頭
    headers: [],
    loading: false,
    error: '',
    lastFetchedAt: 0,
    search: '',
    sortKey: '',
    sortDirection: 'asc',
  },
  cloudSync: {
    busy: false,
    error: '',
    message: '',
  },
};

const els = {
  pageTitle: document.getElementById('page-title'),
  saveStatus: document.getElementById('save-status'),
  taskTableHead: document.getElementById('task-table-head'),
  taskBody: document.getElementById('task-table-body'),
  taskArchiveTableHead: document.getElementById('task-archive-table-head'),
  taskArchiveBody: document.getElementById('task-archive-table-body'),
  taskArchiveCount: document.getElementById('task-archive-count'),
  taskArchiveSearch: document.getElementById('task-archive-search'),
  taskArchiveTypeFilter: document.getElementById('task-archive-type-filter'),
  taskArchiveClearBtn: document.getElementById('task-archive-clear-btn'),
  channelBody: document.getElementById('channel-table-body'),
  taskAnchorDate: document.getElementById('task-anchor-date'),
  taskPrevRangeBtn: document.getElementById('task-prev-range-btn'),
  taskTodayBtn: document.getElementById('task-today-btn'),
  taskNextRangeBtn: document.getElementById('task-next-range-btn'),
  importInput: document.getElementById('import-input'),
  undoBanner: document.getElementById('undo-banner'),
  undoTitle: document.getElementById('undo-title'),
  undoText: document.getElementById('undo-text'),
  taskTotalCount: document.getElementById('task-total-count'),
  taskOpenCount: document.getElementById('task-open-count'),
  channelTotalCount: document.getElementById('channel-total-count'),
  channelCaptureBtn: document.getElementById('channel-capture-btn'),
  taskFieldSettingsBtn: document.getElementById('task-field-settings-btn'),
  channelFieldSettingsBtn: document.getElementById('channel-field-settings-btn'),
  duplicateChannelBatchBtn: document.getElementById('duplicate-channel-batch-btn'),
  channelTableHead: document.getElementById('channel-table-head'),
  channelHistoryTableHead: document.getElementById('channel-history-table-head'),
  channelHistoryBody: document.getElementById('channel-history-table-body'),
  channelHistoryBatchSelect: document.getElementById('channel-history-batch-select'),
  channelHistoryStart: document.getElementById('channel-history-start'),
  channelHistoryEnd: document.getElementById('channel-history-end'),
  channelHistoryClearBtn: document.getElementById('channel-history-clear-btn'),
  deleteHistoryBatchBtn: document.getElementById('delete-history-batch-btn'),
  channelSummaryCount: document.getElementById('channel-summary-count'),
  channelSummarySyncStatus: document.getElementById('channel-summary-sync-status'),
  channelSummaryRefreshBtn: document.getElementById('channel-summary-refresh-btn'),
  channelSummarySyncMode: document.getElementById('channel-summary-sync-mode'),
  channelSummarySyncUrl: document.getElementById('channel-summary-sync-url'),
  channelSummarySyncSaveBtn: document.getElementById('channel-summary-sync-save-btn'),
  channelSummarySearch: document.getElementById('channel-summary-search'),
  channelSummaryChannelFilter: document.getElementById('channel-summary-channel-filter'),
  channelSummaryVersionFilter: document.getElementById('channel-summary-version-filter'),
  channelSummaryConfirmFilter: document.getElementById('channel-summary-confirm-filter'),
  channelSummaryClearBtn: document.getElementById('channel-summary-clear-btn'),
  channelSummaryMessage: document.getElementById('channel-summary-message'),
  channelSummaryHelp: document.getElementById('channel-summary-help'),
  channelSummaryTableHead: document.getElementById('channel-summary-table-head'),
  channelSummaryTableBody: document.getElementById('channel-summary-table-body'),
  channelSummaryFieldSettingsBtn: document.getElementById('channel-summary-field-settings-btn'),
  channelSourceList: document.getElementById('channel-source-list'),
  channelBatchNote: document.getElementById('channel-batch-note'),
  channelBatchTime: document.getElementById('channel-batch-time'),
  channelBatchTimeDisplay: document.getElementById('channel-batch-time-display'),
  applyBatchTimeBtn: document.getElementById('apply-batch-time-btn'),
  channelCapturePagination: document.getElementById('channel-capture-pagination'),
  capturePrevPageBtn: document.getElementById('capture-prev-page-btn'),
  captureNextPageBtn: document.getElementById('capture-next-page-btn'),
  capturePageIndicator: document.getElementById('capture-page-indicator'),
  fieldSettingsModal: document.getElementById('field-settings-modal'),
  fieldSettingsTitle: document.getElementById('field-settings-title'),
  fieldSettingsList: document.getElementById('field-settings-list'),
  addFieldFromModalBtn: document.getElementById('add-field-from-modal-btn'),
  closeFieldSettingsBtn: document.getElementById('close-field-settings-btn'),
  captureExitBtn: document.getElementById('capture-exit-btn'),
  taskTypeList: document.getElementById('task-type-list'),
  channelResultList: document.getElementById('channel-result-list'),
  channelStatusList: document.getElementById('channel-status-list'),

  // 更新列表元素
  updateListTableHead: document.getElementById('update-list-table-head'),
  updateListTableBody: document.getElementById('update-list-table-body'),
  updateListRefreshBtn: document.getElementById('update-list-refresh-btn'),
  updateListSearch: document.getElementById('update-list-search'),
  updateListClearBtn: document.getElementById('update-list-clear-btn'),
  updateListCount: document.getElementById('update-list-count'),
  updateListSyncStatus: document.getElementById('update-list-sync-status'),
  updateListMessage: document.getElementById('update-list-message'),
  cloudSyncUrl: document.getElementById('cloud-sync-url'),
  cloudSyncEnabled: document.getElementById('cloud-sync-enabled'),
  cloudSyncStatus: document.getElementById('cloud-sync-status'),
  cloudSyncSaveBtn: document.getElementById('cloud-sync-save-btn'),
  cloudSyncPullBtn: document.getElementById('cloud-sync-pull-btn'),
  cloudSyncPushBtn: document.getElementById('cloud-sync-push-btn'),
};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createDefaultState();

  try {
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (error) {
    return createDefaultState();
  }
}

function createDefaultState() {
  return {
    tasks: [],
    channels: [],
    channelBatchNotes: {},
    channelSummarySync: {
      mode: 'apps-script',
      url: '',
    },
    taskColumns: structuredClone(DEFAULT_TASK_COLUMNS),
    channelColumns: structuredClone(DEFAULT_CHANNEL_COLUMNS),
    columnWidths: {},
    dropdownOptions: structuredClone(DEFAULT_DROPDOWN_OPTIONS),
    // hiddenColumns stores arrays of hidden column IDs for each table type
    hiddenColumns: { tasks: [], channels: [], channelSummary: [] },
    cloudSync: structuredClone(DEFAULT_CLOUD_SYNC),
  };
}

function normalizeState(input) {
  const normalizedChannels = Array.isArray(input.channels) ? input.channels.map(normalizeChannel) : [];
  return {
    tasks: Array.isArray(input.tasks) ? input.tasks.map(normalizeTask) : [],
    channels: normalizedChannels,
    channelBatchNotes: normalizeChannelBatchNotes(input.channelBatchNotes),
    channelSummarySync: normalizeChannelSummarySync(input.channelSummarySync),
    taskColumns: normalizeTaskColumns(input.taskColumns),
    channelColumns: normalizeChannelColumns(input.channelColumns),
    columnWidths: input.columnWidths && typeof input.columnWidths === 'object' ? { ...input.columnWidths } : {},
    dropdownOptions: normalizeDropdownOptions(input.dropdownOptions, normalizedChannels),
    hiddenColumns: normalizeHiddenColumns(input.hiddenColumns),
    cloudSync: normalizeCloudSync(input.cloudSync),
  };
}

function normalizeCloudSync(config) {
  return {
    enabled: Boolean(config?.enabled),
    url: String(config?.url || '').trim(),
    lastPulledAt: Number(config?.lastPulledAt || 0),
    lastPushedAt: Number(config?.lastPushedAt || 0),
    lastRemoteUpdatedAt: String(config?.lastRemoteUpdatedAt || ''),
  };
}

function normalizeChannelSummarySync(config) {
  const mode = ['sheet-direct', 'public-csv', 'apps-script'].includes(config?.mode)
    ? config.mode
    : 'apps-script';
  return {
    mode,
    url: String(config?.url || '').trim(),
  };
}

function normalizeHiddenColumns(hiddenColumns) {
  return {
    tasks: Array.isArray(hiddenColumns?.tasks) ? [...hiddenColumns.tasks] : [],
    channels: Array.isArray(hiddenColumns?.channels) ? [...hiddenColumns.channels] : [],
    // default empty array for channel summary hidden columns
    channelSummary: Array.isArray(hiddenColumns?.channelSummary)
      ? [...hiddenColumns.channelSummary]
      : [],
  };
}

function normalizeChannelBatchNotes(notes) {
  if (!notes || typeof notes !== 'object') return {};
  return Object.fromEntries(
    Object.entries(notes)
      .map(([key, value]) => [String(key).trim(), String(value ?? '')])
      .filter(([key]) => Boolean(key))
  );
}

function normalizeDropdownOptions(options, channels = []) {
  const next = structuredClone(DEFAULT_DROPDOWN_OPTIONS);
  if (options && typeof options === 'object') {
    Object.keys(next).forEach((key) => {
      if (Array.isArray(options[key]) && options[key].length) {
        next[key] = options[key].map((item) => String(item).trim()).filter(Boolean);
      }
    });
  }
  channels
    .map((channel) => String(channel.source || '').trim())
    .filter(Boolean)
    .forEach((source) => {
      if (!next.source.includes(source)) next.source.push(source);
    });
  return next;
}

function normalizeTask(task = {}) {
  const history = {};
  if (task.history && typeof task.history === 'object') {
    Object.keys(task.history).forEach((key) => {
      history[key] = Boolean(task.history[key]);
    });
  } else {
    const today = new Date();
    const keys = [0, 1, 2].map((offset) => getDateKey(addDays(today, -offset)));
    if (task.todayDone !== undefined) history[keys[0]] = Boolean(task.todayDone);
    if (task.yesterdayDone !== undefined) history[keys[1]] = Boolean(task.yesterdayDone);
    if (task.beforeYesterdayDone !== undefined) history[keys[2]] = Boolean(task.beforeYesterdayDone);
  }

  return {
    id: task.id || crypto.randomUUID(),
    name: task.name || '',
    guideUrl1: task.guideUrl1 || '',
    guideUrl2: task.guideUrl2 || '',
    type: task.type || '每日',
    note: task.note || '',
    archivedAt: task.archivedAt || '',
    history,
    extras: task.extras && typeof task.extras === 'object' ? { ...task.extras } : {},
  };
}

function normalizeTaskColumns(columns) {
  if (!Array.isArray(columns) || !columns.length) {
    return structuredClone(DEFAULT_TASK_COLUMNS);
  }
  const normalized = columns.map((column) => ({
    id: column.id || `task_custom_${crypto.randomUUID()}`,
    label: column.label || column.id || '未命名欄位',
    type: column.type || 'text',
    offset: typeof column.offset === 'number' ? column.offset : undefined,
  }));
  const existingIds = new Set(normalized.map((column) => column.id));
  DEFAULT_TASK_COLUMNS.forEach((column) => {
    if (!existingIds.has(column.id)) normalized.push({ ...column });
  });
  return normalized;
}

function normalizeChannel(channel = {}) {
  const extras = channel.extras && typeof channel.extras === 'object' ? { ...channel.extras } : {};
  return {
    id: channel.id || crypto.randomUUID(),
    source: channel.source || '回U渠道-R',
    name: channel.name || '',
    amount: channel.amount || '',
    result: channel.result || '已回U',
    status: channel.status || '',
    note: channel.note || '',
    updatedAt: channel.updatedAt || toDateTimeLocalValue(new Date()),
    extras,
  };
}

function normalizeChannelColumns(columns) {
  if (!Array.isArray(columns) || !columns.length) {
    return structuredClone(DEFAULT_CHANNEL_COLUMNS);
  }

  const normalized = columns
    .map((column) => ({
      id: column.id || `custom_${crypto.randomUUID()}`,
      label: column.label || column.id || '未命名欄位',
      type: column.type || 'text',
    }));

  const existingIds = new Set(normalized.map((column) => column.id));
  DEFAULT_CHANNEL_COLUMNS.forEach((column) => {
    if (!existingIds.has(column.id)) {
      normalized.push({ ...column });
    }
  });
  return normalized;
}

function saveState(options = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  els.saveStatus.textContent = `已儲存 ${new Date().toLocaleTimeString('zh-Hant', { hour: '2-digit', minute: '2-digit' })}`;
  els.saveStatus.classList.remove('flash');
  void els.saveStatus.offsetWidth;
  els.saveStatus.classList.add('flash');
  if (!options.skipCloudSync) {
    scheduleCloudSyncPush();
  }
}

function render() {
  renderNavigation();
  maybeRefreshChannelSummary();
  maybeRefreshUpdateList();
  syncTaskAnchorInput();
  syncChannelBatchTime();
  syncChannelBatchNote();
  syncChannelHistoryBatchSelect();
  syncChannelHistoryRangeInputs();
  renderCaptureMode();
  renderUndoBanner();
  renderTaskHeaderDates();
  renderTaskSummary();
  renderTaskTable();
  renderTaskArchiveTable();
  renderChannelTable();
  renderChannelSummaryView();
  renderUpdateListView();
  renderChannelHistoryTable();
  renderSuggestionLists();
  renderCloudSyncControls();
  updateCaptureFit();
}

function getCloudSyncConfig() {
  state.data.cloudSync = normalizeCloudSync(state.data.cloudSync);
  return state.data.cloudSync;
}

function renderCloudSyncControls() {
  if (!els.cloudSyncStatus) return;
  const config = getCloudSyncConfig();

  if (els.cloudSyncUrl && document.activeElement !== els.cloudSyncUrl) {
    els.cloudSyncUrl.value = config.url;
  }
  if (els.cloudSyncEnabled && document.activeElement !== els.cloudSyncEnabled) {
    els.cloudSyncEnabled.checked = config.enabled;
  }

  els.cloudSyncStatus.classList.toggle('is-error', Boolean(state.cloudSync.error));
  if (state.cloudSync.busy) {
    els.cloudSyncStatus.textContent = '雲端同步中';
  } else if (state.cloudSync.error) {
    els.cloudSyncStatus.textContent = state.cloudSync.error;
  } else if (state.cloudSync.message) {
    els.cloudSyncStatus.textContent = state.cloudSync.message;
  } else if (!config.enabled) {
    els.cloudSyncStatus.textContent = '未啟用';
  } else if (!config.url) {
    els.cloudSyncStatus.textContent = '尚未設定網址';
  } else if (config.lastPushedAt) {
    els.cloudSyncStatus.textContent = `已同步 ${new Date(config.lastPushedAt).toLocaleTimeString('zh-Hant', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    els.cloudSyncStatus.textContent = '可同步';
  }
}

function setCloudSyncMessage(message, isError = false) {
  state.cloudSync.message = isError ? '' : message;
  state.cloudSync.error = isError ? message : '';
  renderCloudSyncControls();
}

function scheduleCloudSyncPush() {
  const config = getCloudSyncConfig();
  if (!config.enabled || !config.url) return;
  window.clearTimeout(cloudSyncPushTimer);
  setCloudSyncMessage('等待雲端同步');
  cloudSyncPushTimer = window.setTimeout(() => {
    void pushCloudState();
  }, 900);
}

function buildCloudSyncPayload() {
  const data = structuredClone(state.data);
  data.cloudSync = {
    ...normalizeCloudSync(data.cloudSync),
    url: '',
  };
  return {
    action: 'save',
    version: 1,
    savedAt: new Date().toISOString(),
    data,
  };
}

async function pushCloudState() {
  const config = getCloudSyncConfig();
  if (!config.url) {
    setCloudSyncMessage('請先貼上 Apps Script 網址', true);
    return;
  }

  state.cloudSync.busy = true;
  setCloudSyncMessage('雲端同步中');

  try {
    await fetch(config.url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(buildCloudSyncPayload()),
    });
    state.data.cloudSync = {
      ...config,
      lastPushedAt: Date.now(),
    };
    saveState({ skipCloudSync: true });
    setCloudSyncMessage('已送出雲端保存');
  } catch (error) {
    setCloudSyncMessage('雲端保存失敗，已保留本機資料', true);
  } finally {
    state.cloudSync.busy = false;
    renderCloudSyncControls();
  }
}

function loadCloudStateJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `__dashboardCloudSync_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const separator = url.includes('?') ? '&' : '?';
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('雲端讀取逾時，請確認 Apps Script 已部署為 Web App。'));
    }, 12000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('無法連線雲端同步 API，請確認網址是 /exec 結尾。'));
    };

    script.src = `${url}${separator}action=load&callback=${encodeURIComponent(callbackName)}`;
    document.body.appendChild(script);
  });
}

async function pullCloudState() {
  const config = getCloudSyncConfig();
  if (!config.url) {
    setCloudSyncMessage('請先貼上 Apps Script 網址', true);
    return;
  }

  state.cloudSync.busy = true;
  setCloudSyncMessage('下載雲端資料中');

  try {
    const payload = await loadCloudStateJsonp(config.url);
    if (payload?.ok === false) {
      throw new Error(payload.error || '雲端同步 API 回傳錯誤。');
    }
    const remoteData = payload?.data || payload?.state;
    if (!remoteData || typeof remoteData !== 'object') {
      throw new Error('雲端尚未有資料，請先在主要電腦按「上傳本機資料」。');
    }
    const nextData = normalizeState(remoteData);
    nextData.cloudSync = {
      ...config,
      enabled: true,
      lastPulledAt: Date.now(),
      lastRemoteUpdatedAt: String(payload.updatedAt || ''),
    };
    state.data = nextData;
    saveState({ skipCloudSync: true });
    state.cloudSync.busy = false;
    setCloudSyncMessage('已下載雲端資料');
    render();
  } catch (error) {
    state.cloudSync.busy = false;
    setCloudSyncMessage(error?.message || '下載雲端資料失敗', true);
  }
}

function saveCloudSyncSettings() {
  const previous = getCloudSyncConfig();
  state.data.cloudSync = normalizeCloudSync({
    ...previous,
    enabled: Boolean(els.cloudSyncEnabled?.checked),
    url: String(els.cloudSyncUrl?.value || '').trim(),
  });
  saveState({ skipCloudSync: true });
  setCloudSyncMessage(state.data.cloudSync.enabled ? '同步設定已儲存' : '雲端同步未啟用');
}

function renderNavigation() {
  document.querySelectorAll('.nav-button').forEach((button) => {
    const isActive = button.dataset.view === state.view;
    button.classList.toggle('is-active', isActive);
  });

  const activeGroup = state.view === 'tasks' || state.view === 'task-archive'
    ? 'tasks'
    : state.view === 'channels' || state.view === 'channel-history'
      ? 'channels'
      : '';

  if (activeGroup) {
    state.navGroups[activeGroup] = true;
  }

  document.querySelectorAll('[data-nav-group]').forEach((button) => {
    const group = button.dataset.navGroup;
    const isOpen = Boolean(state.navGroups[group]);
    button.classList.toggle('is-open', isOpen);
  });

  document.querySelectorAll('[data-nav-submenu]').forEach((panel) => {
    const group = panel.dataset.navSubmenu;
    panel.classList.toggle('is-open', Boolean(state.navGroups[group]));
  });

  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('is-active', view.id === `${state.view}-view`);
  });

  els.pageTitle.textContent =
    state.view === 'tasks'
      ? '任務儀表版'
      : state.view === 'task-archive'
        ? '任務封存'
      : state.view === 'channel-summary'
        ? '渠道統整表'
      : state.view === 'channels'
        ? '渠道儀表版'
      : state.view === 'tools'
        ? '資料工具'
      : state.view === 'orders'
        ? '發單解析'
      : state.view === 'update-list'
        ? '更新列表'
        : '歷史批次';
  els.channelCaptureBtn.textContent = state.captureMode ? '截圖中' : '截圖模式';
}

function renderCaptureMode() {
  document.body.classList.toggle('capture-mode', state.captureMode);
  els.captureExitBtn.hidden = !state.captureMode;
  els.channelBatchTimeDisplay.hidden = !state.captureMode;
  if (els.channelCapturePagination) {
    els.channelCapturePagination.hidden = true;
  }
  if (state.captureMode) {
    els.fieldSettingsModal.close?.();
    window.scrollTo(0, 0);
  }
}

function maybeRefreshChannelSummary(force = false) {
  if (state.view !== 'channel-summary') return;
  const staleMs = 60 * 1000;
  if (!force && state.channelSummary.loading) return;
  if (!force && state.channelSummary.rows.length && Date.now() - state.channelSummary.lastFetchedAt < staleMs) return;
  void refreshChannelSummary();
}

// 更新列表：在切換到更新列表頁或隔一段時間後自動重新整理
function maybeRefreshUpdateList(force = false) {
  if (state.view !== 'update-list') return;
  const staleMs = 60 * 1000;
  if (!force && state.updateList.loading) return;
  if (!force && state.updateList.rows.length && Date.now() - state.updateList.lastFetchedAt < staleMs) return;
  void refreshUpdateList();
}

function refreshChannelSummary() {
  state.channelSummary.loading = true;
  state.channelSummary.error = '';
  renderChannelSummaryView();

  return loadGoogleSheetRows()
    .then((rows) => {
      state.channelSummary.rows = rows;
      state.channelSummary.lastFetchedAt = Date.now();
      state.channelSummary.error = '';
    })
    .catch((error) => {
      state.channelSummary.error = error?.message || '讀取 Google Sheet 失敗。';
    })
    .finally(() => {
      state.channelSummary.loading = false;
      renderChannelSummaryView();
    });
}

function loadGoogleSheetRows() {
  const syncConfig = state.data.channelSummarySync || { mode: 'apps-script', url: '' };

  if (syncConfig.mode === 'public-csv') {
    if (!syncConfig.url) {
      return Promise.reject(new Error('請先貼上公開 CSV 連結，再按「儲存同步來源」。'));
    }
    return fetch(syncConfig.url)
      .then((response) => {
        if (!response.ok) throw new Error('公開 CSV 連結讀取失敗，請確認這個網址已發佈且可公開查看。');
        return response.text();
      })
      .then(parseChannelSummaryCsv);
  }

  if (syncConfig.mode === 'apps-script') {
    if (!syncConfig.url) {
      return Promise.reject(new Error('請先部署專案內的 channel_summary_api.gs，然後把 Apps Script Web App 網址貼到這裡，再按「儲存同步來源」。'));
    }
    return new Promise((resolve, reject) => {
      const callbackName = `__channelSummaryAppsScript_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const separator = syncConfig.url.includes('?') ? '&' : '?';
      const script = document.createElement('script');
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('Apps Script API 讀取逾時，請確認已重新部署且網址正確。'));
      }, 12000);

      function cleanup() {
        window.clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
      }

      window[callbackName] = (payload) => {
        cleanup();
        try {
          const rows = parseChannelSummaryApiResponse(payload);
          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        cleanup();
        reject(new Error('Apps Script API 無法連線，請確認已部署為網頁應用程式，並使用最新 exec 網址。'));
      };

      script.src = `${syncConfig.url}${separator}callback=${encodeURIComponent(callbackName)}`;
      document.body.appendChild(script);
    });
  }

  return new Promise((resolve, reject) => {
    const callbackName = `__channelSummaryCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tqx = encodeURIComponent(`out:json;responseHandler:${callbackName}`);
    const script = document.createElement('script');
    const url = `https://docs.google.com/spreadsheets/d/${CHANNEL_SUMMARY_SOURCE.spreadsheetId}/gviz/tq?gid=${CHANNEL_SUMMARY_SOURCE.gid}&headers=1&tqx=${tqx}`;
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('讀取逾時，請確認 Google Sheet 可在此瀏覽器中開啟。'));
    }, 12000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (response) => {
      cleanup();
      try {
        const rows = parseChannelSummaryResponse(response);
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('無法連線 Google Sheet，請確認你已登入並有權限查看這張表。'));
    };
    script.src = url;
    document.body.appendChild(script);
  });
}

function parseChannelSummaryResponse(response) {
  if (response?.status === 'error') {
    const reason = response?.errors?.[0]?.detailed_message || response?.errors?.[0]?.reason || 'Google Sheet 目前拒絕這個讀取請求。';
    throw new Error(`Google Sheet 無法直接同步：${reason}`);
  }
  const rows = response?.table?.rows;
  if (!Array.isArray(rows)) {
    throw new Error('Google Sheet 目前需要登入或允許 Cookie，前端頁面無法直接同步這張表。若要即時同步，請改用公開 CSV 連結或 Apps Script API。');
  }

  return rows
    .map((row, index) => {
      const cells = Array.isArray(row?.c) ? row.c : [];
      const record = { id: `sheet_${index}` };
      CHANNEL_SUMMARY_COLUMNS.forEach((column) => {
        record[column.id] = readGvizCell(cells[column.index]);
      });
      return record;
    })
    .filter((row) => Object.values(row).some((value) => String(value || '').trim()));
}

function readGvizCell(cell) {
  if (!cell) return '';
  if (cell.f !== null && cell.f !== undefined && cell.f !== '') return String(cell.f);
  if (typeof cell.v === 'boolean') return cell.v ? 'TRUE' : 'FALSE';
  return String(cell.v ?? '');
}

function parseChannelSummaryCsv(csvText) {
  const rows = parseCsvRows(csvText);
  if (!rows.length) return [];
  return mapChannelSummaryRowsByHeaders(rows);
}

function parseChannelSummaryApiResponse(payload) {
  if (Array.isArray(payload)) return mapChannelSummaryObjectRows(payload);
  if (Array.isArray(payload?.rows)) {
    if (Array.isArray(payload.rows[0])) return mapChannelSummaryRowsByHeaders(payload.rows);
    return mapChannelSummaryObjectRows(payload.rows);
  }
  if (Array.isArray(payload?.values)) return mapChannelSummaryRowsByHeaders(payload.values);
  throw new Error('Apps Script API 回傳格式不支援，請回傳 rows 陣列或 values 二維陣列。');
}

/**
 * 將原始二維陣列轉換為更新列表資料。
 * 第一列為表頭，後續列為資料列。每個資料列會產生一個物件，其鍵為表頭文字，值為對應儲存格的內容。
 *
 * @param {string[][]} rows - 二維陣列，第一列為標題
 * @returns {object[]} 轉換後的物件陣列
 */
function mapUpdateListRowsByHeaders(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const [headerRow, ...dataRows] = rows;
  const headers = (headerRow || []).map((h) => String(h || '').trim());
  return dataRows
    .map((row) => {
      const record = {};
      headers.forEach((header, idx) => {
        if (!header) return;
        const value = row[idx];
        record[header] = value !== undefined && value !== null ? String(value).trim() : '';
      });
      return record;
    })
    .filter((row) => Object.values(row).some((v) => String(v || '').trim()));
}

/**
 * 將 Apps Script API 回傳的 rows 或 values 物件轉換為更新列表資料。此函式假設回傳的每個物件鍵為表頭名稱。
 *
 * @param {object[]} rows - 物件陣列，鍵為欄位名稱
 * @returns {object[]} 轉換後的物件陣列
 */
function mapUpdateListObjectRows(rows) {
  if (!Array.isArray(rows) || !rows.length) return [];
  return rows
    .map((item) => {
      const record = {};
      Object.keys(item || {}).forEach((key) => {
        record[String(key).trim()] = String(item[key] ?? '').trim();
      });
      return record;
    })
    .filter((row) => Object.values(row).some((v) => String(v || '').trim()));
}

/**
 * 解析更新列表的 CSV 文字。使用標題列決定欄位名稱。
 *
 * @param {string} csvText - CSV 格式內容
 * @returns {object[]} 解析後的資料
 */
function parseUpdateListCsv(csvText) {
  const rows = parseCsvRows(csvText);
  if (!rows.length) return [];
  return mapUpdateListRowsByHeaders(rows);
}

/**
 * 解析 Apps Script API 回傳的資料。支援 rows（二維陣列）或 values（二維陣列）或物件陣列。
 *
 * @param {any} payload - API 回傳值
 * @returns {object[]} 解析後的資料
 */
function parseUpdateListApiResponse(payload) {
  if (Array.isArray(payload)) {
    // 物件陣列
    if (payload.length && typeof payload[0] === 'object' && !Array.isArray(payload[0])) {
      return mapUpdateListObjectRows(payload);
    }
    // 二維陣列
    return mapUpdateListRowsByHeaders(payload);
  }
  if (Array.isArray(payload?.rows)) {
    if (Array.isArray(payload.rows[0])) return mapUpdateListRowsByHeaders(payload.rows);
    return mapUpdateListObjectRows(payload.rows);
  }
  if (Array.isArray(payload?.values)) {
    return mapUpdateListRowsByHeaders(payload.values);
  }
  throw new Error('Apps Script API 回傳格式不支援，請回傳 rows 陣列或 values 二維陣列。');
}

/**
 * 解析 Google Visualization API 回傳的更新列表資料。
 *
 * @param {object} response - gviz 回傳物件
 * @returns {object[]} 解析後的資料
 */
function parseUpdateListResponse(response) {
  if (response?.status === 'error') {
    const reason = response?.errors?.[0]?.detailed_message || response?.errors?.[0]?.reason || 'Google Sheet 目前拒絕這個讀取請求。';
    throw new Error(`Google Sheet 無法直接同步：${reason}`);
  }
  const rows = response?.table?.rows;
  if (!Array.isArray(rows)) {
    throw new Error('Google Sheet 目前需要登入或允許 Cookie，前端頁面無法直接同步這張表。若要即時同步，請改用公開 CSV 連結或 Apps Script API。');
  }
  // 解析 gviz 格式：將 cell 物件轉為值陣列
  const list = rows.map((row) => {
    const cells = Array.isArray(row?.c) ? row.c : [];
    return cells.map((cell) => readGvizCell(cell));
  });
  return mapUpdateListRowsByHeaders(list);
}

/**
 * 讀取更新列表資料。依據當前同步設定，支援直接讀取 Google Sheet、讀取公開 CSV 或呼叫 Apps Script API。
 *
 * @returns {Promise<{headers: string[], rows: object[]}>} 返回標題與資料陣列
 */
function loadUpdateListRows() {
  const syncConfig = state.data.channelSummarySync || { mode: 'apps-script', url: '' };
  // 直接讀取公開 CSV
  if (syncConfig.mode === 'public-csv') {
    if (!syncConfig.url) {
      return Promise.reject(new Error('請先貼上公開 CSV 連結，再按「儲存同步來源」。'));
    }
    return fetch(syncConfig.url)
      .then((response) => {
        if (!response.ok) throw new Error('公開 CSV 連結讀取失敗，請確認這個網址已發佈且可公開查看。');
        return response.text();
      })
      .then((csvText) => {
        const records = parseUpdateListCsv(csvText);
        const headers = records.length ? Object.keys(records[0]) : [];
        return { headers, rows: records };
      });
  }

  // 使用 Apps Script API
  if (syncConfig.mode === 'apps-script') {
    if (!syncConfig.url) {
      return Promise.reject(new Error('請先部署專案內的 channel_summary_api.gs，然後把 Apps Script Web App 網址貼到這裡，再按「儲存同步來源」。'));
    }
    return new Promise((resolve, reject) => {
      const callbackName = `__updateListAppsScript_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const separator = syncConfig.url.includes('?') ? '&' : '?';
      const script = document.createElement('script');
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('Apps Script API 讀取逾時，請確認已重新部署且網址正確。'));
      }, 12000);

      function cleanup() {
        window.clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
      }

      window[callbackName] = (payload) => {
        cleanup();
        try {
          const records = parseUpdateListApiResponse(payload);
          const headers = records.length ? Object.keys(records[0]) : [];
          resolve({ headers, rows: records });
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        cleanup();
        reject(new Error('Apps Script API 無法連線，請確認已部署為網頁應用程式，並使用最新 exec 網址。'));
      };

      script.src = `${syncConfig.url}${separator}callback=${encodeURIComponent(callbackName)}`;
      document.body.appendChild(script);
    });
  }

  // 預設：直接從 Google Sheet 讀取
  return new Promise((resolve, reject) => {
    const callbackName = `__updateListCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tqx = encodeURIComponent(`out:json;responseHandler:${callbackName}`);
    let url = `https://docs.google.com/spreadsheets/d/${UPDATE_RECORD_SOURCE.spreadsheetId}/gviz/tq?headers=1&tqx=${tqx}`;
    // 如果指定了 sheetName，使用 sheet 參數；否則使用 gid
    if (UPDATE_RECORD_SOURCE.sheetName) {
      url += `&sheet=${encodeURIComponent(UPDATE_RECORD_SOURCE.sheetName)}`;
    } else if (UPDATE_RECORD_SOURCE.gid) {
      url += `&gid=${UPDATE_RECORD_SOURCE.gid}`;
    }
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('讀取逾時，請確認 Google Sheet 可在此瀏覽器中開啟。'));
    }, 12000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (response) => {
      cleanup();
      try {
        const records = parseUpdateListResponse(response);
        const headers = records.length ? Object.keys(records[0]) : [];
        resolve({ headers, rows: records });
      } catch (error) {
        reject(error);
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('無法連線 Google Sheet，請確認你已登入並有權限查看這張表。'));
    };
    script.src = url;
    document.body.appendChild(script);
  });
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
      row = [];
      value = '';
      continue;
    }
    value += char;
  }

  if (value !== '' || row.length) {
    row.push(value);
    if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
  }
  return rows;
}

function mapChannelSummaryRowsByHeaders(rows) {
  const [headerRow, ...dataRows] = rows;
  // 建立表頭名稱至欄位索引的對照
  const headerMap = new Map((headerRow || []).map((header, index) => [String(header || '').trim(), index]));
  return dataRows
    .map((row, index) => {
      const record = { id: `sheet_${index}` };
      CHANNEL_SUMMARY_COLUMNS.forEach((column) => {
        let values = [];
        // 優先以正式 label 對應
        const primaryIndex = headerMap.get(column.label);
        if (primaryIndex !== undefined) {
          const v = row[primaryIndex];
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            values.push(String(v).trim());
          }
        }
        // 若 primary 未匹配到或值為空，則依照 aliases 比對
        if ((!values.length || column.joinAliases) && Array.isArray(column.aliases)) {
          column.aliases.forEach((alias) => {
            const idx = headerMap.get(alias);
            if (idx !== undefined) {
              const v = row[idx];
              if (v !== undefined && v !== null && String(v).trim() !== '') {
                values.push(String(v).trim());
              }
            }
          });
        }
        // 將取得的值依需求組合：若有 joinAliases 則串接全部，否則取第一個值
        let result = '';
        if (values.length > 0) {
          if (column.joinAliases) {
            result = values.join('');
          } else {
            result = values[0];
          }
        }
        record[column.id] = result;
      });
      return record;
    })
    .filter((row) => Object.values(row).some((value) => String(value || '').trim()));
}

function mapChannelSummaryObjectRows(rows) {
  return rows
    .map((row, index) => {
      const record = { id: `sheet_${index}` };
      CHANNEL_SUMMARY_COLUMNS.forEach((column) => {
        const values = [];
        // 優先以 id 或 label 對應
        const primaryVal = row?.[column.id] ?? row?.[column.label];
        if (primaryVal !== undefined && primaryVal !== null && String(primaryVal).trim() !== '') {
          values.push(String(primaryVal).trim());
        }
        // 若需要合併或 primary 未匹配到/為空，則檢查 aliases
        if ((!values.length || column.joinAliases) && Array.isArray(column.aliases)) {
          column.aliases.forEach((alias) => {
            const v = row?.[alias];
            if (v !== undefined && v !== null && String(v).trim() !== '') {
              values.push(String(v).trim());
            }
          });
        }
        let result = '';
        if (values.length > 0) {
          if (column.joinAliases) {
            result = values.join('');
          } else {
            result = values[0];
          }
        }
        record[column.id] = result;
      });
      return record;
    })
    .filter((row) => Object.values(row).some((value) => String(value || '').trim()));
}

function getFilteredChannelSummaryRows() {
  const search = state.channelSummary.search.trim().toLowerCase();
  const filteredRows = state.channelSummary.rows.filter((row) => {
    if (state.channelSummary.channel && row.channel !== state.channelSummary.channel) return false;
    if (state.channelSummary.version && row.version !== state.channelSummary.version) return false;
    if (state.channelSummary.versionChecked && row.versionChecked !== state.channelSummary.versionChecked) return false;
    if (!search) return true;
    return CHANNEL_SUMMARY_COLUMNS.some((column) => String(row[column.id] || '').toLowerCase().includes(search));
  });

  if (!state.channelSummary.sortKey) {
    return filteredRows;
  }

  return [...filteredRows].sort((rowA, rowB) => compareChannelSummaryRows(rowA, rowB));
}

function parseChannelSummarySortValue(value, numeric) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (!numeric) return text.toLowerCase();

  const number = Number(text.replace(/,/g, ''));
  return Number.isFinite(number) ? number : null;
}

function compareChannelSummaryRows(rowA, rowB) {
  const { sortKey, sortDirection } = state.channelSummary;
  const numeric = CHANNEL_SUMMARY_NUMERIC_COLUMNS.has(sortKey);
  const valueA = parseChannelSummarySortValue(rowA[sortKey], numeric);
  const valueB = parseChannelSummarySortValue(rowB[sortKey], numeric);

  if (valueA == null && valueB == null) return 0;
  if (valueA == null) return 1;
  if (valueB == null) return -1;

  if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
  if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
  return 0;
}

// 取得更新列表的篩選結果
function getFilteredUpdateListRows() {
  const search = state.updateList.search.trim().toLowerCase();
  const filteredRows = state.updateList.rows.filter((row) => {
    if (!search) return true;
    // 在所有欄位中尋找包含搜尋字串的值
    return Object.values(row).some((val) => String(val || '').toLowerCase().includes(search));
  });
  if (!state.updateList.sortKey) {
    return filteredRows;
  }
  return [...filteredRows].sort((rowA, rowB) => compareUpdateListRows(rowA, rowB));
}

// 比較更新列表排序值
function compareUpdateListRows(rowA, rowB) {
  const { sortKey, sortDirection } = state.updateList;
  const aRaw = rowA?.[sortKey] ?? '';
  const bRaw = rowB?.[sortKey] ?? '';
  const aStr = String(aRaw).trim();
  const bStr = String(bRaw).trim();

  // 嘗試將值轉為數字（去除逗號），用於數字排序
  const numA = parseFloat(aStr.replace(/,/g, ''));
  const numB = parseFloat(bStr.replace(/,/g, ''));
  const aIsNum = !isNaN(numA);
  const bIsNum = !isNaN(numB);

  let cmp = 0;
  if (aIsNum && bIsNum) {
    if (numA < numB) cmp = -1;
    else if (numA > numB) cmp = 1;
    else cmp = 0;
  } else {
    const aLower = aStr.toLowerCase();
    const bLower = bStr.toLowerCase();
    if (aLower < bLower) cmp = -1;
    else if (aLower > bLower) cmp = 1;
    else cmp = 0;
  }
  return sortDirection === 'asc' ? cmp : -cmp;
}

// 渲染更新列表的表頭
function renderUpdateListHead() {
  if (!els.updateListTableHead) return;
  const tr = document.createElement('tr');
  // 使用 state.updateList.headers 動態渲染欄位
  const headers = Array.isArray(state.updateList.headers) ? state.updateList.headers : [];
  headers.forEach((header) => {
    // 不考慮 channelSummary 隱藏欄位設定，以免漏顯更新記錄欄位
    const th = document.createElement('th');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sort-button';
    button.dataset.sortKey = header;
    if (state.updateList.sortKey === header) {
      button.classList.add('is-active');
    }
    const indicator = state.updateList.sortKey === header
      ? (state.updateList.sortDirection === 'asc' ? '↑' : '↓')
      : '↕';
    button.innerHTML = `
      <span>${escapeHtml(header)}</span>
      <span class="sort-indicator">${indicator}</span>
    `;
    th.appendChild(button);
    tr.appendChild(th);
  });
  els.updateListTableHead.innerHTML = '';
  els.updateListTableHead.appendChild(tr);
}

// 渲染更新列表頁面
function renderUpdateListView() {
  if (!els.updateListTableHead || !els.updateListTableBody) return;

  renderUpdateListHead();

  // 更新同步狀態文字
  if (state.updateList.loading) {
    els.updateListSyncStatus.textContent = '同步中';
  } else if (state.updateList.lastFetchedAt) {
    els.updateListSyncStatus.textContent = `更新 ${new Date(state.updateList.lastFetchedAt).toLocaleTimeString('zh-Hant', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    els.updateListSyncStatus.textContent = '尚未同步';
  }

  const filteredRows = getFilteredUpdateListRows();
  els.updateListCount.textContent = String(filteredRows.length);

  // 顯示錯誤或空白訊息
  if (state.updateList.error) {
    els.updateListMessage.hidden = false;
    els.updateListMessage.className = 'channel-summary-message is-error';
    els.updateListMessage.textContent = state.updateList.error;
  } else if (!state.updateList.loading && !filteredRows.length) {
    els.updateListMessage.hidden = false;
    els.updateListMessage.className = 'channel-summary-message';
    els.updateListMessage.textContent = state.updateList.rows.length ? '目前沒有符合條件的資料。' : '目前尚未抓到資料，請按「重新整理」或確認同步設定。';
  } else {
    els.updateListMessage.hidden = true;
    els.updateListMessage.textContent = '';
    els.updateListMessage.className = 'channel-summary-message';
  }

  els.updateListTableBody.innerHTML = '';
  const headers = Array.isArray(state.updateList.headers) ? state.updateList.headers : [];
  filteredRows.forEach((row) => {
    const tr = document.createElement('tr');
    headers.forEach((header) => {
      const td = document.createElement('td');
      td.textContent = row[header] || '';
      tr.appendChild(td);
    });
    els.updateListTableBody.appendChild(tr);
  });
}

// 重新整理更新列表（從 Google Sheet 讀取）
function refreshUpdateList() {
  state.updateList.loading = true;
  state.updateList.error = '';
  renderUpdateListView();
  return loadUpdateListRows()
    .then(({ headers, rows }) => {
      // 儲存標題與資料
      state.updateList.headers = headers;
      state.updateList.rows = rows;
      state.updateList.lastFetchedAt = Date.now();
      state.updateList.error = '';
    })
    .catch((error) => {
      state.updateList.error = error?.message || '讀取 Google Sheet 失敗。';
    })
    .finally(() => {
      state.updateList.loading = false;
      renderUpdateListView();
    });
}

function renderChannelSummaryView() {
  if (!els.channelSummaryTableHead || !els.channelSummaryTableBody) return;

  renderChannelSummaryHead();
  syncChannelSummaryFilters();
  if (els.channelSummarySyncMode) {
    els.channelSummarySyncMode.value = state.data.channelSummarySync?.mode || 'sheet-direct';
  }
  if (els.channelSummarySyncUrl) {
    els.channelSummarySyncUrl.value = state.data.channelSummarySync?.url || '';
  }

  const message = els.channelSummaryMessage;
  const filteredRows = getFilteredChannelSummaryRows();
  els.channelSummaryCount.textContent = String(filteredRows.length);

  if (state.channelSummary.loading) {
    els.channelSummarySyncStatus.textContent = '同步中';
  } else if (state.channelSummary.lastFetchedAt) {
    els.channelSummarySyncStatus.textContent = `更新 ${new Date(state.channelSummary.lastFetchedAt).toLocaleTimeString('zh-Hant', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    els.channelSummarySyncStatus.textContent = '尚未同步';
  }

  if (state.channelSummary.error) {
    message.hidden = false;
    message.className = 'channel-summary-message is-error';
    message.textContent = state.channelSummary.error;
  } else if (!state.channelSummary.loading && !filteredRows.length) {
    message.hidden = false;
    message.className = 'channel-summary-message';
    message.textContent = state.channelSummary.rows.length ? '目前沒有符合條件的資料。' : '目前尚未抓到資料，請按「重新整理」或確認 Google Sheet 權限。';
  } else {
    message.hidden = true;
    message.textContent = '';
    message.className = 'channel-summary-message';
  }

  if (els.channelSummaryHelp) {
    els.channelSummaryHelp.hidden = !state.channelSummary.error && !!state.channelSummary.rows.length;
  }

  els.channelSummaryTableBody.innerHTML = '';
  filteredRows.forEach((row) => {
    const tr = document.createElement('tr');
    CHANNEL_SUMMARY_COLUMNS.forEach((column) => {
      // Skip columns hidden by user settings
      if (isColumnHidden('channelSummary', column.id)) return;
      const td = document.createElement('td');
      td.textContent = row[column.id] || '';
      tr.appendChild(td);
    });
    els.channelSummaryTableBody.appendChild(tr);
  });
}

function renderChannelSummaryHead() {
  const tr = document.createElement('tr');
  CHANNEL_SUMMARY_COLUMNS.forEach((column) => {
    // Skip hidden columns in header
    if (isColumnHidden('channelSummary', column.id)) return;
    const th = document.createElement('th');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sort-button';
    button.dataset.sortKey = column.id;

    if (state.channelSummary.sortKey === column.id) {
      button.classList.add('is-active');
    }

    const indicator = state.channelSummary.sortKey === column.id
      ? (state.channelSummary.sortDirection === 'asc' ? '↑' : '↓')
      : '↕';

    button.innerHTML = `
      <span>${escapeHtml(column.label)}</span>
      <span class="sort-indicator">${indicator}</span>
    `;

    th.appendChild(button);
    tr.appendChild(th);
  });
  els.channelSummaryTableHead.innerHTML = '';
  els.channelSummaryTableHead.appendChild(tr);
}

function syncChannelSummaryFilters() {
  if (!els.channelSummaryChannelFilter || !els.channelSummaryVersionFilter || !els.channelSummaryConfirmFilter) return;

  const channels = [...new Set(state.channelSummary.rows.map((row) => row.channel).filter(Boolean))];
  const versions = [...new Set(state.channelSummary.rows.map((row) => row.version).filter(Boolean))];
  const checks = [...new Set(state.channelSummary.rows.map((row) => row.versionChecked).filter(Boolean))];

  fillSelectOptions(els.channelSummaryChannelFilter, '全部渠道', channels, state.channelSummary.channel);
  fillSelectOptions(els.channelSummaryVersionFilter, '全部版本', versions, state.channelSummary.version);
  fillSelectOptions(els.channelSummaryConfirmFilter, '全部確認狀態', checks, state.channelSummary.versionChecked);
  els.channelSummarySearch.value = state.channelSummary.search;
}

function fillSelectOptions(select, placeholder, values, currentValue) {
  const nextHtml = [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`),
  ].join('');
  select.innerHTML = nextHtml;
  select.value = currentValue || '';
}

function renderTaskHeaderDates() {
  renderTaskHead();
}

function syncTaskAnchorInput() {
  els.taskAnchorDate.value = getDateKey(state.taskAnchorDate);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('zh-Hant', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getVisibleTaskDates() {
  const anchor = new Date(state.taskAnchorDate);
  return [0, -1, -2].map((offset) => addDays(anchor, offset));
}

function isTodayDate(date) {
  return getDateKey(date) === getDateKey(new Date());
}

function toDateTimeLocalValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function renderTaskSummary() {
  const tasks = state.data.tasks.filter((task) => !task.archivedAt);
  const currentKey = getDateKey(state.taskAnchorDate);
  els.taskTotalCount.textContent = String(tasks.length);
  els.taskOpenCount.textContent = String(tasks.filter((task) => !task.history[currentKey]).length);
}

function renderTaskTable() {
  els.taskBody.innerHTML = '';
  renderTaskHead();
  const visibleColumns = getVisibleColumns('tasks');
  const activeTasks = state.data.tasks.filter((task) => !task.archivedAt);

  if (!activeTasks.length) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="${visibleColumns.length + 2}">目前沒有任務，按「新增任務」即可開始。</td>`;
    els.taskBody.appendChild(row);
    return;
  }

  activeTasks.forEach((task, index) => {
    const tr = document.createElement('tr');
    tr.dataset.id = task.id;
    tr.dataset.rowId = task.id;
    tr.dataset.tableType = 'tasks';
    tr.className = 'draggable-row';
    tr.draggable = true;
    attachRowDragEvents(tr);
    const indexTd = document.createElement('td');
    indexTd.className = 'row-index';
    indexTd.textContent = String(index + 1);
    tr.appendChild(indexTd);
    visibleColumns.forEach((column) => {
      const td = document.createElement('td');
      td.appendChild(buildTaskCell(column, task));
      tr.appendChild(td);
    });
    const actionTd = document.createElement('td');
    actionTd.innerHTML = '<div class="row-action-group"><button data-action="archive-task" class="tiny-button" type="button">封存</button><button data-action="delete-task" class="icon-button">刪除</button></div>';
    tr.appendChild(actionTd);
    applyTaskStatusBackground(tr, task);
    applyTaskTypeBadge(tr, task);
    els.taskBody.appendChild(tr);
  });
}

function renderTaskHead() {
  const tr = document.createElement('tr');
  const visibleColumns = getVisibleColumns('tasks');
  const indexTh = document.createElement('th');
  indexTh.className = 'row-index-header';
  indexTh.textContent = '#';
  applyStoredColumnWidth(indexTh, 'task:index');
  attachResizeHandle(indexTh, 'task:index');
  tr.appendChild(indexTh);
  visibleColumns.forEach((column) => {
    const th = document.createElement('th');
    th.draggable = true;
    th.dataset.columnId = column.id;
    th.dataset.tableType = 'tasks';
    th.className = 'draggable-header';
    th.innerHTML = `<div class="drag-head"><span>${escapeHtml(getTaskColumnDisplayLabel(column))}</span></div>`;
    applyStoredColumnWidth(th, `task:${column.id}`);
    attachColumnDragEvents(th);
    attachResizeHandle(th, `task:${column.id}`);
    tr.appendChild(th);
  });
  const actionTh = document.createElement('th');
  actionTh.textContent = '操作';
  applyStoredColumnWidth(actionTh, 'task:action');
  attachResizeHandle(actionTh, 'task:action');
  tr.appendChild(actionTh);
  els.taskTableHead.innerHTML = '';
  els.taskTableHead.appendChild(tr);
}

function getTaskColumnDisplayLabel(column) {
  if (column.type !== 'history') return column.label;
  const date = addDays(state.taskAnchorDate, column.offset || 0);
  return formatDate(date);
}

function buildTaskCell(column, task) {
  if (column.type === 'guide') {
    const wrapper = document.createElement('div');
    wrapper.className = 'guide-inline-cell';
    const value = String(task[column.id] || task.extras?.[column.id] || '').trim();
    const isEditing = state.editingGuide?.id === task.id && state.editingGuide?.field === column.id;

    if (isEditing) {
      const input = document.createElement('input');
      input.type = 'url';
      input.value = value;
      input.placeholder = '貼上連結';
      input.className = 'guide-inline-input';
      input.dataset.action = 'guide-inline-input';
      input.dataset.field = column.id;
      input.dataset.id = task.id;
      wrapper.appendChild(input);
      return wrapper;
    }

    if (value) {
      const link = document.createElement('a');
      link.href = value;
      link.target = '_blank';
      link.rel = 'noreferrer noopener';
      link.className = 'sheet-link guide-inline-link';
      link.textContent = '連結';
      link.title = '開啟連結';
      wrapper.appendChild(link);

      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'guide-inline-edit';
      editButton.dataset.action = 'start-guide-edit';
      editButton.dataset.field = column.id;
      editButton.dataset.id = task.id;
      editButton.textContent = '編輯';
      editButton.title = '修改連結';
      wrapper.appendChild(editButton);
    } else {
      const placeholder = document.createElement('button');
      placeholder.type = 'button';
      placeholder.className = 'guide-inline-placeholder';
      placeholder.dataset.action = 'start-guide-edit';
      placeholder.dataset.field = column.id;
      placeholder.dataset.id = task.id;
      placeholder.textContent = '新增連結';
      wrapper.appendChild(placeholder);
    }
    return wrapper;
  }

  if (column.type === 'taskType') {
    const select = document.createElement('select');
    select.dataset.field = column.id;
    state.data.dropdownOptions.taskType.forEach((optionValue) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    });
    const currentValue = readTaskField(task, column.id);
    if (currentValue && !state.data.dropdownOptions.taskType.includes(currentValue)) {
      const option = document.createElement('option');
      option.value = currentValue;
      option.textContent = currentValue;
      select.appendChild(option);
    }
    select.value = currentValue;
    return select;
  }

  if (column.type === 'history') {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'history-checkbox';
    checkbox.dataset.field = column.id;
    const dateKey = getDateKey(addDays(state.taskAnchorDate, column.offset || 0));
    checkbox.dataset.dateKey = dateKey;
    checkbox.checked = Boolean(task.history[dateKey]);
    return checkbox;
  }

  const input = document.createElement('input');
  input.type = 'text';
  input.dataset.field = column.id;
  input.value = readTaskField(task, column.id);
  input.placeholder = column.label;
  return input;
}

function readTaskField(task, field) {
  if (field in task && !['history', 'extras'].includes(field)) return task[field];
  return task.extras?.[field] || '';
}

function applyTaskStatusBackground(row, task) {
  const visibleColumns = getVisibleColumns('tasks');
  visibleColumns.forEach((column, index) => {
    if (column.type !== 'history') return;
    const cell = row.children[index + 1];
    const dateKey = getDateKey(addDays(state.taskAnchorDate, column.offset || 0));
    const done = Boolean(task.history[dateKey]);
    cell.style.background = done ? '#dff0d8' : '#f6d6d6';
    cell.title = done ? '完成' : '未完成';
  });
}

function getTaskTypeBadgeClass(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  if (normalized.includes('機動')) return 'badge-purple';
  if (normalized.includes('週六') || normalized.includes('周六')) return 'badge-yellow';
  return 'badge-red';
}

function applyTaskTypeBadge(row, task) {
  const visibleColumns = getVisibleColumns('tasks');
  const taskTypeIndex = visibleColumns.findIndex((column) => column.type === 'taskType');
  if (taskTypeIndex === -1) return;

  const cell = row.children[taskTypeIndex + 1];
  const select = cell?.querySelector('select[data-field="type"]');
  const badgeClasses = ['badge-yellow', 'badge-gray', 'badge-purple', 'badge-green', 'badge-red'];
  cell?.classList.remove(...badgeClasses);
  select?.classList.remove(...badgeClasses);
  const nextClass = getTaskTypeBadgeClass(task.type);
  if (!nextClass) return;
  cell?.classList.add(nextClass);
  select?.classList.add(nextClass);
}

function getFilteredArchivedTasks() {
  const search = String(state.taskArchiveSearch || '').trim().toLowerCase();
  const type = String(state.taskArchiveType || '').trim();
  return state.data.tasks.filter((task) => {
    if (!task.archivedAt) return false;
    if (type && task.type !== type) return false;
    if (!search) return true;
    const haystack = [task.name, task.note, task.type]
      .map((item) => String(item || '').toLowerCase())
      .join(' ');
    return haystack.includes(search);
  });
}

function renderTaskArchiveHead() {
  if (!els.taskArchiveTableHead) return;
  const tr = document.createElement('tr');
  const visibleColumns = getVisibleColumns('tasks').filter((column) => column.type !== 'history');
  const indexTh = document.createElement('th');
  indexTh.className = 'row-index-header';
  indexTh.textContent = '#';
  tr.appendChild(indexTh);
  visibleColumns.forEach((column) => {
    const th = document.createElement('th');
    th.innerHTML = `<div class="drag-head"><span>${escapeHtml(column.label)}</span></div>`;
    tr.appendChild(th);
  });
  const archivedTh = document.createElement('th');
  archivedTh.textContent = '封存時間';
  tr.appendChild(archivedTh);
  const actionTh = document.createElement('th');
  actionTh.textContent = '操作';
  tr.appendChild(actionTh);
  els.taskArchiveTableHead.innerHTML = '';
  els.taskArchiveTableHead.appendChild(tr);
}

function renderTaskArchiveTable() {
  if (!els.taskArchiveBody) return;
  els.taskArchiveBody.innerHTML = '';
  renderTaskArchiveHead();

  const archivedTasks = getFilteredArchivedTasks();
  const visibleColumns = getVisibleColumns('tasks').filter((column) => column.type !== 'history');
  if (els.taskArchiveCount) {
    els.taskArchiveCount.textContent = String(state.data.tasks.filter((task) => task.archivedAt).length);
  }

  if (els.taskArchiveSearch) {
    els.taskArchiveSearch.value = state.taskArchiveSearch || '';
  }

  if (els.taskArchiveTypeFilter) {
    const options = [''].concat(state.data.dropdownOptions.taskType || []);
    els.taskArchiveTypeFilter.innerHTML = options
      .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value || '全部類型')}</option>`)
      .join('');
    els.taskArchiveTypeFilter.value = state.taskArchiveType || '';
  }

  if (!archivedTasks.length) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="${visibleColumns.length + 3}">目前沒有符合條件的封存任務。</td>`;
    els.taskArchiveBody.appendChild(row);
    return;
  }

  archivedTasks.forEach((task, index) => {
    const tr = document.createElement('tr');
    tr.dataset.id = task.id;
    const indexTd = document.createElement('td');
    indexTd.className = 'row-index';
    indexTd.textContent = String(index + 1);
    tr.appendChild(indexTd);

    visibleColumns.forEach((column) => {
      const td = document.createElement('td');
      if (column.type === 'guide') {
        const url = readTaskField(task, column.id);
        if (url) {
          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.className = 'sheet-link';
          link.textContent = '連結';
          td.appendChild(link);
        } else {
          td.textContent = '—';
        }
      } else {
        td.textContent = readTaskField(task, column.id) || '—';
      }
      tr.appendChild(td);
    });

    const archivedTd = document.createElement('td');
    archivedTd.textContent = formatCompactDateTime(task.archivedAt);
    tr.appendChild(archivedTd);

    const actionTd = document.createElement('td');
    actionTd.innerHTML = '<div class="row-action-group"><button data-action="restore-task" class="tiny-button" type="button">復原</button><button data-action="purge-task" class="icon-button" type="button">刪除</button></div>';
    tr.appendChild(actionTd);
    applyTaskTypeBadge(tr, task);
    els.taskArchiveBody.appendChild(tr);
  });
}

function startGuideInlineEdit(id, field) {
  state.editingGuide = { id, field };
  render();
  window.requestAnimationFrame(() => {
    const input = els.taskBody.querySelector(`.guide-inline-input[data-id="${id}"][data-field="${field}"]`);
    if (!input) return;
    input.focus();
    input.select();
  });
}

function commitGuideInlineEdit(id, field, value, shouldRender = true) {
  state.editingGuide = null;
  updateTask(id, field, String(value || '').trim());
  if (shouldRender) render();
}

function cancelGuideInlineEdit() {
  if (!state.editingGuide) return;
  state.editingGuide = null;
  render();
}

function renderChannelTable() {
  els.channelBody.innerHTML = '';
  const visibleColumns = getVisibleColumns('channels');
  const allChannels = [...state.data.channels];
  const currentBatchTime = String(els.channelBatchTime.value || '').trim();
  const currentBatchChannels = currentBatchTime
    ? allChannels.filter((channel) => String(channel.updatedAt || '').trim() === currentBatchTime)
    : allChannels;
  const channels = currentBatchChannels;
  els.channelTotalCount.textContent = String(allChannels.length);
  if (els.capturePageIndicator) {
    els.capturePageIndicator.textContent = '';
  }
  if (els.capturePrevPageBtn) {
    els.capturePrevPageBtn.disabled = true;
  }
  if (els.captureNextPageBtn) {
    els.captureNextPageBtn.disabled = true;
  }

  if (!channels.length) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="${visibleColumns.length + (state.captureMode ? 0 : 1)}">目前沒有渠道資料，按「新增紀錄」即可開始。</td>`;
    els.channelBody.appendChild(row);
    renderChannelHead();
    return;
  }

  renderChannelHead();
  channels.forEach((channel) => {
    const tr = document.createElement('tr');
    tr.dataset.id = channel.id;
    tr.dataset.rowId = channel.id;
    tr.dataset.tableType = 'channels';
    tr.className = 'draggable-row';
    tr.draggable = true;
    attachRowDragEvents(tr);
    visibleColumns.forEach((column) => {
      const td = document.createElement('td');
      td.appendChild(buildChannelCell(column, channel));
      tr.appendChild(td);
    });
    if (!state.captureMode) {
      const actionTd = document.createElement('td');
      actionTd.innerHTML = '<button data-action="delete-channel" class="icon-button icon-button-danger">刪除</button>';
      tr.appendChild(actionTd);
    }

    applyChannelBadges(tr, channel);
    els.channelBody.appendChild(tr);
  });
}

function renderChannelHead() {
  const tr = document.createElement('tr');
  const visibleColumns = getVisibleColumns('channels');
  visibleColumns.forEach((column) => {
    const th = document.createElement('th');
    th.draggable = true;
    th.dataset.columnId = column.id;
    th.dataset.tableType = 'channels';
    th.className = 'draggable-header';
    th.innerHTML = `<div class="drag-head"><span>${escapeHtml(column.label)}</span></div>`;
    applyStoredColumnWidth(th, `channel:${column.id}`);
    attachColumnDragEvents(th);
    attachResizeHandle(th, `channel:${column.id}`);
    tr.appendChild(th);
  });
  if (!state.captureMode) {
    const actionTh = document.createElement('th');
    actionTh.textContent = '操作';
    applyStoredColumnWidth(actionTh, 'channel:action');
    attachResizeHandle(actionTh, 'channel:action');
    tr.appendChild(actionTh);
  }
  els.channelTableHead.innerHTML = '';
  els.channelTableHead.appendChild(tr);
}

function renderChannelHistoryTable() {
  els.channelHistoryBody.innerHTML = '';
  const visibleColumns = getVisibleColumns('channels');
  renderChannelHistoryHead();

  const batchTimes = getFilteredHistoryBatchTimes();
  if (!batchTimes.length) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="${visibleColumns.length + 1}">目前沒有符合條件的歷史批次。</td>`;
    els.channelHistoryBody.appendChild(row);
    return;
  }

  batchTimes.forEach((batchTime) => {
    const batchRow = document.createElement('tr');
    batchRow.className = 'batch-divider-row';
    const batchCell = document.createElement('td');
    batchCell.colSpan = visibleColumns.length + 1;
    batchCell.textContent = `批次 ${formatBatchDisplay(batchTime)}`;
    batchRow.appendChild(batchCell);
    els.channelHistoryBody.appendChild(batchRow);

    const channels = state.data.channels.filter((channel) => String(channel.updatedAt || '').trim() === batchTime);
    channels.forEach((channel) => {
      const tr = document.createElement('tr');
      tr.dataset.id = channel.id;
      visibleColumns.forEach((column) => {
        const td = document.createElement('td');
        td.appendChild(buildChannelCell(column, channel));
        tr.appendChild(td);
      });
      const actionTd = document.createElement('td');
      actionTd.innerHTML = '<button data-action="delete-channel" class="icon-button icon-button-danger">刪除</button>';
      tr.appendChild(actionTd);
      applyChannelBadges(tr, channel);
      els.channelHistoryBody.appendChild(tr);
    });
  });
}

function renderChannelHistoryHead() {
  const tr = document.createElement('tr');
  const visibleColumns = getVisibleColumns('channels');
  visibleColumns.forEach((column) => {
    const th = document.createElement('th');
    th.innerHTML = `<div class="drag-head"><span>${escapeHtml(column.label)}</span></div>`;
    tr.appendChild(th);
  });
  const actionTh = document.createElement('th');
  actionTh.textContent = '操作';
  tr.appendChild(actionTh);
  els.channelHistoryTableHead.innerHTML = '';
  els.channelHistoryTableHead.appendChild(tr);
}

function applyStoredColumnWidth(th, key) {
  const width = state.data.columnWidths?.[key];
  if (!width) return;
  th.style.width = `${width}px`;
  th.style.minWidth = `${width}px`;
}

function attachResizeHandle(th, key) {
  const handle = document.createElement('div');
  handle.className = 'column-resizer';
  handle.dataset.widthKey = key;
  handle.addEventListener('mousedown', startColumnResize);
  th.appendChild(handle);
}

function startColumnResize(event) {
  event.preventDefault();
  event.stopPropagation();
  const handle = event.currentTarget;
  const th = handle.parentElement;
  const key = handle.dataset.widthKey;
  const startX = event.clientX;
  const startWidth = th.getBoundingClientRect().width;

  function onMouseMove(moveEvent) {
    const nextWidth = Math.max(72, Math.round(startWidth + (moveEvent.clientX - startX)));
    th.style.width = `${nextWidth}px`;
    th.style.minWidth = `${nextWidth}px`;
  }

  function onMouseUp(upEvent) {
    const finalWidth = Math.max(72, Math.round(startWidth + (upEvent.clientX - startX)));
    state.data.columnWidths[key] = finalWidth;
    saveState();
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    render();
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function attachColumnDragEvents(th) {
  th.addEventListener('dragstart', onColumnDragStart);
  th.addEventListener('dragover', onColumnDragOver);
  th.addEventListener('drop', onColumnDrop);
  th.addEventListener('dragend', onColumnDragEnd);
}

function attachRowDragEvents(row) {
  row.addEventListener('dragstart', onRowDragStart);
  row.addEventListener('dragover', onRowDragOver);
  row.addEventListener('drop', onRowDrop);
  row.addEventListener('dragend', onRowDragEnd);
}

function onColumnDragStart(event) {
  state.draggedColumn = {
    columnId: event.currentTarget.dataset.columnId,
    tableType: event.currentTarget.dataset.tableType,
  };
  event.currentTarget.classList.add('is-dragging');
}

function onColumnDragOver(event) {
  if (!state.draggedColumn) return;
  if (state.draggedColumn.tableType !== event.currentTarget.dataset.tableType) return;
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function onColumnDrop(event) {
  event.preventDefault();
  const target = event.currentTarget;
  target.classList.remove('drag-over');
  if (!state.draggedColumn) return;
  if (state.draggedColumn.tableType !== target.dataset.tableType) return;
  const sourceId = state.draggedColumn.columnId;
  const targetId = target.dataset.columnId;
  if (sourceId === targetId) return;
  reorderColumns(state.draggedColumn.tableType, sourceId, targetId);
}

function onColumnDragEnd(event) {
  state.draggedColumn = null;
  document.querySelectorAll('.draggable-header').forEach((node) => {
    node.classList.remove('is-dragging', 'drag-over');
  });
}

function onRowDragStart(event) {
  const interactive = event.target.closest('input, select, button, a, textarea');
  if (interactive) {
    event.preventDefault();
    return;
  }
  state.draggedRow = {
    rowId: event.currentTarget.dataset.rowId,
    tableType: event.currentTarget.dataset.tableType,
  };
  event.currentTarget.classList.add('is-dragging');
}

function onRowDragOver(event) {
  if (!state.draggedRow) return;
  if (state.draggedRow.tableType !== event.currentTarget.dataset.tableType) return;
  event.preventDefault();
  event.currentTarget.classList.add('drag-over-row');
}

function onRowDrop(event) {
  event.preventDefault();
  const target = event.currentTarget;
  target.classList.remove('drag-over-row');
  if (!state.draggedRow) return;
  if (state.draggedRow.tableType !== target.dataset.tableType) return;
  const sourceId = state.draggedRow.rowId;
  const targetId = target.dataset.rowId;
  if (sourceId === targetId) return;
  reorderRows(state.draggedRow.tableType, sourceId, targetId);
}

function onRowDragEnd() {
  state.draggedRow = null;
  document.querySelectorAll('.draggable-row').forEach((node) => {
    node.classList.remove('is-dragging', 'drag-over-row');
  });
}

function reorderColumns(tableType, sourceId, targetId) {
  const key = tableType === 'tasks' ? 'taskColumns' : 'channelColumns';
  const columns = state.data[key];
  const sourceIndex = columns.findIndex((column) => column.id === sourceId);
  const targetIndex = columns.findIndex((column) => column.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) return;
  const [column] = columns.splice(sourceIndex, 1);
  columns.splice(targetIndex, 0, column);
  saveState();
  render();
}

function reorderRows(tableType, sourceId, targetId) {
  const key = tableType === 'tasks' ? 'tasks' : 'channels';
  const rows = state.data[key];
  const sourceIndex = rows.findIndex((item) => item.id === sourceId);
  const targetIndex = rows.findIndex((item) => item.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) return;
  const [row] = rows.splice(sourceIndex, 1);
  rows.splice(targetIndex, 0, row);
  saveState();
  render();
}

function isColumnHidden(tableType, columnId) {
  return state.data.hiddenColumns?.[tableType]?.includes(columnId);
}

function getVisibleColumns(tableType) {
  const key = tableType === 'tasks' ? 'taskColumns' : 'channelColumns';
  return state.data[key].filter((column) => !isColumnHidden(tableType, column.id));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildChannelCell(column, channel) {
  if (column.type === 'datetime') {
    const span = document.createElement('span');
    span.className = 'datetime-text';
    span.textContent = formatCompactDateTime(channel.updatedAt);
    return span;
  }

  if (column.type === 'source') {
    const select = document.createElement('select');
    select.dataset.field = column.id;
    state.data.dropdownOptions.source.forEach((optionValue) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    });
    if (channel.source && !state.data.dropdownOptions.source.includes(channel.source)) {
      const option = document.createElement('option');
      option.value = channel.source;
      option.textContent = channel.source;
      select.appendChild(option);
    }
    select.value = channel.source;
    return select;
  }

  if (column.type === 'result') {
    const select = document.createElement('select');
    select.dataset.field = column.id;
    state.data.dropdownOptions.result.forEach((optionValue) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    });
    if (channel.result && !state.data.dropdownOptions.result.includes(channel.result)) {
      const option = document.createElement('option');
      option.value = channel.result;
      option.textContent = channel.result;
      select.appendChild(option);
    }
    select.value = channel.result;
    return select;
  }

  if (column.type === 'status') {
    const select = document.createElement('select');
    select.dataset.field = column.id;
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-';
    select.appendChild(emptyOption);
    state.data.dropdownOptions.status.forEach((optionValue) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    });
    if (channel.status && !state.data.dropdownOptions.status.includes(channel.status)) {
      const option = document.createElement('option');
      option.value = channel.status;
      option.textContent = channel.status;
      select.appendChild(option);
    }
    select.value = channel.status;
    return select;
  }

  const input = document.createElement('input');
  input.type = 'text';
  input.dataset.field = column.id;
  input.value = readChannelField(channel, column.id);
  input.placeholder = column.label;
  return input;
}

function formatCompactDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '';
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function readChannelField(channel, field) {
  if (field in channel && field !== 'extras') return channel[field];
  return channel.extras?.[field] || '';
}

function applyChannelBadges(row, channel) {
  const visibleColumns = getVisibleColumns('channels');
  const resultIndex = visibleColumns.findIndex((column) => column.id === 'result');
  const statusIndex = visibleColumns.findIndex((column) => column.id === 'status');
  const resultCell = resultIndex >= 0 ? row.children[resultIndex] : null;
  const statusCell = statusIndex >= 0 ? row.children[statusIndex] : null;
  const resultSelect = resultCell?.querySelector('select[data-field="result"]') || null;
  const statusSelect = statusCell?.querySelector('select[data-field="status"]') || null;

  const badgeClasses = ['badge-yellow', 'badge-gray', 'badge-purple', 'badge-green', 'badge-red'];
  if (resultCell) resultCell.classList.remove(...badgeClasses);
  if (statusCell) statusCell.classList.remove(...badgeClasses);
  if (resultSelect) resultSelect.classList.remove(...badgeClasses);
  if (statusSelect) statusSelect.classList.remove(...badgeClasses);

  const resultMap = {
    '已回U': 'badge-yellow',
    '不回U': 'badge-gray',
    '詢問中': 'badge-purple',
    '目前暫無法回U': 'badge-red',
  };

  const statusMap = {
    '啟用': 'badge-green',
    '關閉': 'badge-gray',
  };

  const resultValue = String(channel.result || '').trim();
  const statusValue = String(channel.status || '').trim();
  const resultClass = resultMap[resultValue] || '';
  const statusClass = statusMap[statusValue] || '';

  if (resultCell && resultClass) resultCell.classList.add(resultClass);
  if (statusCell && statusClass) statusCell.classList.add(statusClass);
  if (resultSelect && resultClass) resultSelect.classList.add(resultClass);
  if (statusSelect && statusClass) statusSelect.classList.add(statusClass);
}

function addTask() {
  state.data.tasks.push(normalizeTask({}));
  saveState();
  render();
}

function addChannel() {
  const batchTime = els.channelBatchTime.value || toDateTimeLocalValue(new Date());
  state.data.channels.push(normalizeChannel({ updatedAt: batchTime }));
  saveState();
  render();
}

function getChannelBatchSourceRows() {
  const currentBatchTime = String(els.channelBatchTime.value || '').trim();
  let rows = currentBatchTime
    ? state.data.channels.filter((channel) => String(channel.updatedAt || '').trim() === currentBatchTime)
    : [];

  if (!rows.length) {
    const latestTime = [...state.data.channels]
      .map((channel) => String(channel.updatedAt || '').trim())
      .filter(Boolean)
      .sort()
      .at(-1);
    if (latestTime) {
      rows = state.data.channels.filter((channel) => String(channel.updatedAt || '').trim() === latestTime);
    }
  }

  return rows;
}

function duplicateChannelBatch() {
  const sourceRows = getChannelBatchSourceRows();
  if (!sourceRows.length) {
    window.alert('目前找不到可複製的批次資料。');
    return;
  }

  const nextBatchTime = toDateTimeLocalValue(new Date());
  const duplicatedRows = sourceRows.map((channel) => normalizeChannel({
    ...structuredClone(channel),
    id: crypto.randomUUID(),
    updatedAt: nextBatchTime,
    amount: '',
    note: '',
  }));

  state.data.channels.unshift(...duplicatedRows);
  state.data.channelBatchNotes[nextBatchTime] = '';
  els.channelBatchTime.value = nextBatchTime;
  state.historyBatchTime = sourceRows[0]?.updatedAt || '';
  saveState();
  render();
}

function deleteTask(id) {
  const task = state.data.tasks.find((item) => item.id === id);
  if (!task) return;

  state.lastDeleted = {
    type: 'task',
    item: structuredClone(task),
    index: state.data.tasks.findIndex((item) => item.id === id),
  };
  state.data.tasks = state.data.tasks.filter((item) => item.id !== id);
  saveState();
  render();
}

function archiveTask(id) {
  const task = state.data.tasks.find((item) => item.id === id);
  if (!task) return;
  task.archivedAt = toDateTimeLocalValue(new Date());
  saveState();
  render();
}

function restoreTask(id) {
  const task = state.data.tasks.find((item) => item.id === id);
  if (!task) return;
  task.archivedAt = '';
  saveState();
  render();
}

function purgeTask(id) {
  const task = state.data.tasks.find((item) => item.id === id);
  if (!task) return;
  const ok = window.confirm(`要永久刪除封存任務「${task.name || '未命名任務'}」嗎？`);
  if (!ok) return;
  deleteTask(id);
}

function deleteChannel(id) {
  const channel = state.data.channels.find((item) => item.id === id);
  if (!channel) return;

  state.lastDeleted = {
    type: 'channel',
    item: structuredClone(channel),
    index: state.data.channels.findIndex((item) => item.id === id),
  };
  state.data.channels = state.data.channels.filter((item) => item.id !== id);
  saveState();
  render();
}

function renderUndoBanner() {
  if (!state.lastDeleted) {
    els.undoBanner.hidden = true;
    return;
  }

  const label = state.lastDeleted.type === 'task' ? '任務' : '渠道';
  const name = state.lastDeleted.item.name || '未命名資料';
  els.undoTitle.textContent = `已刪除${label}`;
  els.undoText.textContent = `「${name}」已移出列表，你可以立即復原。`;
  els.undoBanner.hidden = false;
}

function clearUndoBanner() {
  state.lastDeleted = null;
  renderUndoBanner();
}

function undoDelete() {
  if (!state.lastDeleted) return;

  const { type, item, index } = state.lastDeleted;
  if (type === 'task') {
    const insertIndex = Math.max(0, Math.min(index, state.data.tasks.length));
    state.data.tasks.splice(insertIndex, 0, normalizeTask(item));
  } else {
    const insertIndex = Math.max(0, Math.min(index, state.data.channels.length));
    state.data.channels.splice(insertIndex, 0, normalizeChannel(item));
  }

  state.lastDeleted = null;
  saveState();
  render();
}

function updateTask(id, field, value) {
  const task = state.data.tasks.find((item) => item.id === id);
  if (!task) return;

  if (field in task && !['history', 'extras'].includes(field)) {
    task[field] = value;
  } else {
    task.extras[field] = value;
  }
  maybeAddDropdownValueByField(field, value);
  saveState();
  render();
}

function updateTaskHistory(id, dateKey, value) {
  const task = state.data.tasks.find((item) => item.id === id);
  if (!task) return;
  task.history[dateKey] = Boolean(value);
  saveState();
  render();
}

function updateChannel(id, field, value) {
  const channel = state.data.channels.find((item) => item.id === id);
  if (!channel) return;

  if (field in channel && field !== 'extras') {
    channel[field] = value;
  } else {
    channel.extras[field] = value;
  }
  maybeAddDropdownValueByField(field, value);
  if (field !== 'updatedAt') {
    channel.updatedAt = els.channelBatchTime.value || channel.updatedAt || toDateTimeLocalValue(new Date());
  }
  saveState();
  render();
}

function maybeAddDropdownValueByField(field, value) {
  const next = String(value || '').trim();
  if (!next) return;

  const dropdownKey =
    field === 'source' ? 'source'
    : field === 'type' ? 'taskType'
    : field === 'result' ? 'result'
    : field === 'status' ? 'status'
    : '';

  if (!dropdownKey) return;
  if (state.data.dropdownOptions[dropdownKey].includes(next)) return;
  state.data.dropdownOptions[dropdownKey].push(next);
}

function syncChannelBatchTime() {
  const currentValue = String(els.channelBatchTime.value || '').trim();
  if (currentValue) {
    els.channelBatchTimeDisplay.textContent = `本次處理時間 ${formatBatchDisplay(currentValue)}`;
    return;
  }

  const latest = [...state.data.channels]
    .map((channel) => channel.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  const value = latest || toDateTimeLocalValue(new Date());
  els.channelBatchTime.value = value;
  els.channelBatchTimeDisplay.textContent = `本次處理時間 ${formatBatchDisplay(value)}`;
}

function syncChannelBatchNote() {
  if (!els.channelBatchNote) return;
  const batchTime = String(els.channelBatchTime.value || '').trim();
  els.channelBatchNote.value = batchTime ? (state.data.channelBatchNotes?.[batchTime] || '') : '';
}

function updateChannelBatchNote(value) {
  const batchTime = String(els.channelBatchTime.value || '').trim();
  if (!batchTime) return;
  if (!state.data.channelBatchNotes || typeof state.data.channelBatchNotes !== 'object') {
    state.data.channelBatchNotes = {};
  }
  const nextValue = String(value ?? '');
  if (nextValue.trim()) {
    state.data.channelBatchNotes[batchTime] = nextValue;
  } else {
    delete state.data.channelBatchNotes[batchTime];
  }
  saveState();
}

function getSortedBatchTimes() {
  return [...new Set(
    state.data.channels
      .map((channel) => String(channel.updatedAt || '').trim())
      .filter(Boolean)
  )].sort().reverse();
}

function getFilteredHistoryBatchTimes() {
  const currentBatchTime = String(els.channelBatchTime.value || '').trim();
  let batchTimes = getSortedBatchTimes().filter((time) => time !== currentBatchTime);

  const start = state.historyRangeStart ? new Date(state.historyRangeStart).getTime() : null;
  const end = state.historyRangeEnd ? new Date(state.historyRangeEnd).getTime() : null;

  batchTimes = batchTimes.filter((time) => {
    const ts = new Date(time).getTime();
    if (Number.isNaN(ts)) return false;
    if (start !== null && ts < start) return false;
    if (end !== null && ts > end) return false;
    return true;
  });

  return batchTimes;
}

function syncChannelHistoryBatchSelect() {
  const historyBatchTimes = getFilteredHistoryBatchTimes();

  if (!historyBatchTimes.length) {
    state.historyBatchTime = '';
    els.channelHistoryBatchSelect.innerHTML = '<option value="">沒有舊批次</option>';
    els.channelHistoryBatchSelect.value = '';
    return;
  }

  if (!state.historyBatchTime || !historyBatchTimes.includes(state.historyBatchTime)) {
    state.historyBatchTime = historyBatchTimes[0];
  }

  els.channelHistoryBatchSelect.innerHTML = historyBatchTimes
    .map((time) => `<option value="${escapeHtml(time)}">${escapeHtml(formatBatchDisplay(time))}</option>`)
    .join('');
  els.channelHistoryBatchSelect.value = state.historyBatchTime;
}

function syncChannelHistoryRangeInputs() {
  els.channelHistoryStart.value = state.historyRangeStart || '';
  els.channelHistoryEnd.value = state.historyRangeEnd || '';
}

function deleteHistoryBatch() {
  const batchTime = String(state.historyBatchTime || '').trim();
  if (!batchTime) {
    window.alert('目前沒有可刪除的舊批次。');
    return;
  }

  const targetRows = state.data.channels.filter((channel) => String(channel.updatedAt || '').trim() === batchTime);
  if (!targetRows.length) {
    window.alert('找不到這個批次的資料。');
    return;
  }

  const ok = window.confirm(`要刪除整個批次「${formatBatchDisplay(batchTime)}」嗎？共 ${targetRows.length} 筆資料，刪除後可按上方「復原」救回最後一次刪除的單筆資料，但無法整批復原。`);
  if (!ok) return;

  state.data.channels = state.data.channels.filter((channel) => String(channel.updatedAt || '').trim() !== batchTime);
  if (state.data.channelBatchNotes) {
    delete state.data.channelBatchNotes[batchTime];
  }
  state.historyBatchTime = '';
  saveState();
  render();
}

function formatBatchDisplay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '';
  return new Intl.DateTimeFormat('zh-Hant', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function toggleCaptureMode() {
  if (!state.captureMode) {
    state.previousView = state.view;
    state.view = 'channels';
    state.captureMode = true;
    state.capturePage = 0;
  } else {
    state.captureMode = false;
    state.view = state.previousView || 'tasks';
  }
  render();
}

function updateCaptureFit() {
  const panel = document.querySelector('#channels-view .panel');
  if (!panel) return;

  if (!state.captureMode) {
    panel.style.removeProperty('--capture-scale');
    panel.style.removeProperty('--capture-width');
    return;
  }

  requestAnimationFrame(() => {
    panel.style.setProperty('--capture-scale', '1');
    panel.style.setProperty('--capture-width', '100%');

    const viewportWidth = Math.max(320, window.innerWidth - 20);
    const viewportHeight = Math.max(320, window.innerHeight - 20);
    const rect = panel.getBoundingClientRect();
    const scaleX = viewportWidth / Math.max(1, rect.width);
    const scaleY = viewportHeight / Math.max(1, rect.height);
    const scale = Math.min(1, scaleX, scaleY);

    panel.style.setProperty('--capture-scale', String(scale));
    panel.style.setProperty('--capture-width', `${100 / scale}%`);
  });
}

function applyBatchTimeToAllChannels() {
  if (!els.channelBatchTime.value) return;
  state.data.channels = state.data.channels.map((channel) => ({
    ...channel,
    updatedAt: els.channelBatchTime.value,
  }));
  saveState();
  render();
}

function populateDatalist(element, values, includeBlank = false) {
  element.innerHTML = '';
  const list = includeBlank ? ['', ...values] : values;
  list.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    element.appendChild(option);
  });
}

function renderSuggestionLists() {
  const uniqueSources = [...new Set([
    ...state.data.dropdownOptions.source,
    ...state.data.channels.map((channel) => channel.source).filter(Boolean),
  ])].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
  populateDatalist(els.channelSourceList, uniqueSources);
  populateDatalist(els.taskTypeList, state.data.dropdownOptions.taskType);
  populateDatalist(els.channelResultList, state.data.dropdownOptions.result);
  populateDatalist(els.channelStatusList, state.data.dropdownOptions.status, true);
}

function getChannelDisplayValue(column, channel) {
  if (column.type === 'datetime') return formatCompactDateTime(channel.updatedAt);
  if (column.id === 'source') return channel.source || '';
  if (column.id === 'name') return channel.name || '';
  if (column.id === 'amount') return channel.amount || '';
  if (column.id === 'result') return channel.result || '';
  if (column.id === 'status') return channel.status || '-';
  if (column.id === 'note') return channel.note || '';
  return readChannelField(channel, column.id) || '';
}

function escapeHtmlForCopy(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function createChannelShareImageBlob() {
  const visibleColumns = getVisibleColumns('channels');
  const channels = [...state.data.channels];
  const batchTimeText = els.channelBatchTime.value ? formatCompactDateTime(els.channelBatchTime.value) : '';
  const colWidths = visibleColumns.map((column) => {
    const stored = state.data.columnWidths?.[`channel:${column.id}`];
    return Math.max(120, stored || 160);
  });

  const totalWidth = Math.max(920, colWidths.reduce((sum, width) => sum + width, 0));
  const headerHeight = 52;
  const rowHeight = 52;
  const titleHeight = 56;
  const padding = 20;
  const totalHeight = padding * 2 + titleHeight + headerHeight + Math.max(1, channels.length) * rowHeight;

  const headerHtml = visibleColumns
    .map((column, index) => `
      <th style="
        width:${colWidths[index]}px;
        min-width:${colWidths[index]}px;
        max-width:${colWidths[index]}px;
        padding:12px 14px;
        border:1px solid #d7ccbe;
        background:#f3f3f3;
        text-align:left;
        font-size:14px;
        font-weight:700;
        white-space:nowrap;
      ">${escapeHtmlForCopy(column.label)}</th>
    `)
    .join('');

  const bodyHtml = (channels.length ? channels : [{}]).map((channel, rowIndex) => {
    const cells = visibleColumns
      .map((column, index) => {
        const rawValue = channels.length ? getChannelDisplayValue(column, channel) : '';
        const value = escapeHtmlForCopy(rawValue || '');
        let background = '#ffffff';
        if (rowIndex % 2 === 1) background = '#fcfcfc';
        if (column.id === 'result') {
          if (rawValue === '已回U') background = '#fff1c9';
          if (rawValue === '詢問中') background = '#eadcf8';
          if (rawValue === '目前暫無法回U') background = '#f2d1d1';
          if (rawValue === '不回U') background = '#ece7df';
        }
        if (column.id === 'status') {
          if (rawValue === '啟用') background = '#d9ebd2';
          if (rawValue === '關閉') background = '#ece7df';
        }
        return `
          <td style="
            width:${colWidths[index]}px;
            min-width:${colWidths[index]}px;
            max-width:${colWidths[index]}px;
            height:${rowHeight}px;
            padding:12px 14px;
            border:1px solid #d7ccbe;
            background:${background};
            font-size:14px;
            vertical-align:middle;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          ">${value || '&nbsp;'}</td>
        `;
      })
      .join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const html = `
    <div xmlns="http://www.w3.org/1999/xhtml" style="
      width:${totalWidth}px;
      padding:${padding}px;
      box-sizing:border-box;
      font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif;
      color:#222;
      background:#fffdf8;
    ">
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        margin-bottom:14px;
      ">
        <div style="font-size:28px;font-weight:800;">回U整合清單</div>
        <div style="
          padding:10px 14px;
          border:1px solid #d7ccbe;
          border-radius:14px;
          background:#fff;
          font-size:14px;
          line-height:1.5;
        ">
          <div style="color:#6a6257;">本次處理時間</div>
          <div style="font-weight:700;">${escapeHtmlForCopy(batchTimeText)}</div>
        </div>
      </div>
      <table style="
        width:${totalWidth - padding * 2}px;
        border-collapse:collapse;
        table-layout:fixed;
        background:#fff;
      ">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>
  `;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">
      <foreignObject width="100%" height="100%">
        ${html}
      </foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  const image = await loadImageFromUrl(svgUrl);
  const canvas = document.createElement('canvas');
  canvas.width = totalWidth * 2;
  canvas.height = totalHeight * 2;
  const context = canvas.getContext('2d');
  context.scale(2, 2);
  context.fillStyle = '#fffdf8';
  context.fillRect(0, 0, totalWidth, totalHeight);
  context.drawImage(image, 0, 0, totalWidth, totalHeight);
  URL.revokeObjectURL(svgUrl);

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('image-export-failed'));
    }, 'image/png');
  });
}

async function copyChannelShare() {
  try {
    const imageBlob = await createChannelShareImageBlob();
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        const item = new ClipboardItem({ 'image/png': imageBlob });
        await navigator.clipboard.write([item]);
        els.saveStatus.textContent = '已複製圖片';
        return;
      } catch (clipboardError) {
        console.warn('Image clipboard write failed, fallback to download.', clipboardError);
      }
    }

    downloadBlob(imageBlob, `channel-share-${Date.now()}.png`);
    els.saveStatus.textContent = '已下載圖片';
  } catch (error) {
    console.error(error);
    window.alert('這個瀏覽器目前不支援直接把圖片貼到剪貼簿，我已改成下載 PNG。你可以直接把下載的圖片拖到 Telegram。');
  }
}

function addField(tableType) {
  const label = window.prompt('請輸入新欄位名稱');
  if (!label || !label.trim()) return;
  const key = tableType === 'tasks' ? 'taskColumns' : 'channelColumns';
  const prefix = tableType === 'tasks' ? 'task_custom_' : 'custom_';
  state.data[key].push({
    id: `${prefix}${crypto.randomUUID()}`,
    label: label.trim(),
    type: 'text',
  });
  saveState();
  render();
}

function openFieldSettings(tableType) {
  state.fieldSettingsTarget = tableType;
  if (tableType === 'channelSummary') {
    // Channel summary columns have their own settings (only visibility)
    els.fieldSettingsTitle.textContent = '統整表欄位設定';
    renderChannelSummaryFieldSettingsList();
  } else {
    els.fieldSettingsTitle.textContent = tableType === 'tasks' ? '任務欄位設定' : '渠道欄位設定';
    renderFieldSettingsList();
  }
  els.fieldSettingsModal.showModal();
}

function renderFieldSettingsList() {
  const key = state.fieldSettingsTarget === 'tasks' ? 'taskColumns' : 'channelColumns';
  const columns = state.data[key];
  els.fieldSettingsList.innerHTML = '';
  columns.forEach((column) => {
    const row = document.createElement('div');
    row.className = 'settings-item';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = column.label;
    input.dataset.columnId = column.id;
    input.dataset.tableType = state.fieldSettingsTarget;
    input.className = 'settings-input';
    row.innerHTML = `<span class="settings-type">${column.type === 'history' ? '日期欄' : '欄位'}</span>`;
    row.appendChild(input);
    const toggle = document.createElement('label');
    toggle.className = 'settings-toggle';
    toggle.innerHTML = `
      <input
        type="checkbox"
        data-toggle-column-id="${column.id}"
        data-table-type="${state.fieldSettingsTarget}"
        ${isColumnHidden(state.fieldSettingsTarget, column.id) ? '' : 'checked'}
      />
      <span>顯示</span>
    `;
    row.appendChild(toggle);
    const deleteColumnButton = document.createElement('button');
    deleteColumnButton.type = 'button';
    deleteColumnButton.className = 'tiny-button';
    deleteColumnButton.dataset.action = 'delete-column';
    deleteColumnButton.dataset.columnId = column.id;
    deleteColumnButton.dataset.tableType = state.fieldSettingsTarget;
    deleteColumnButton.textContent = '刪除欄位';
    row.appendChild(deleteColumnButton);
    const dropdownKey = getDropdownKeyByColumnType(column.type);
    if (dropdownKey) {
      const optionsWrap = document.createElement('div');
      optionsWrap.className = 'settings-options-wrap';
      optionsWrap.dataset.dropdownKey = dropdownKey;

      state.data.dropdownOptions[dropdownKey].forEach((optionValue, optionIndex) => {
        const optionRow = document.createElement('div');
        optionRow.className = 'settings-option-row';
        optionRow.innerHTML = `
          <input
            type="text"
            value="${escapeHtml(optionValue)}"
            data-dropdown-key="${dropdownKey}"
            data-option-index="${optionIndex}"
            data-option-value="${escapeHtml(optionValue)}"
            class="settings-input"
          />
          <button type="button" data-action="save-dropdown-option" data-dropdown-key="${dropdownKey}" data-option-index="${optionIndex}" class="tiny-button">儲存</button>
          <button type="button" data-action="remove-dropdown-option" data-dropdown-key="${dropdownKey}" data-option-index="${optionIndex}" class="tiny-button">刪除</button>
        `;
        optionsWrap.appendChild(optionRow);
      });

      const addRow = document.createElement('div');
      addRow.className = 'settings-option-add';
      addRow.innerHTML = `
        <button type="button" data-action="add-dropdown-option" data-dropdown-key="${dropdownKey}" class="secondary-button compact-mini-button">新增選項</button>
      `;
      optionsWrap.appendChild(addRow);
      row.appendChild(optionsWrap);
    }
    els.fieldSettingsList.appendChild(row);
  });
}

// Render field settings list for channel summary view. Only provides visibility toggles.
function renderChannelSummaryFieldSettingsList() {
  if (!els.fieldSettingsList) return;
  els.fieldSettingsList.innerHTML = '';
  CHANNEL_SUMMARY_COLUMNS.forEach((column) => {
    const row = document.createElement('div');
    row.className = 'settings-item';
    // Label: show column label without input (cannot rename)
    const labelSpan = document.createElement('span');
    labelSpan.className = 'settings-type';
    labelSpan.textContent = '欄位';
    row.appendChild(labelSpan);
    const nameSpan = document.createElement('span');
    nameSpan.className = 'settings-label';
    nameSpan.textContent = column.label;
    row.appendChild(nameSpan);
    // Toggle to show/hide column
    const toggle = document.createElement('label');
    toggle.className = 'settings-toggle';
    toggle.innerHTML = `
      <input
        type="checkbox"
        data-toggle-column-id="${column.id}"
        data-table-type="channelSummary"
        ${isColumnHidden('channelSummary', column.id) ? '' : 'checked'}
      />
      <span>顯示</span>
    `;
    row.appendChild(toggle);
    els.fieldSettingsList.appendChild(row);
  });
}

function getDropdownKeyByColumnType(type) {
  if (type === 'source') return 'source';
  if (type === 'taskType') return 'taskType';
  if (type === 'result') return 'result';
  if (type === 'status') return 'status';
  return '';
}

function closeFieldSettings() {
  els.fieldSettingsModal.close();
}

function updateColumnLabel(tableType, columnId, value) {
  const key = tableType === 'tasks' ? 'taskColumns' : 'channelColumns';
  const column = state.data[key].find((item) => item.id === columnId);
  if (!column) return;
  column.label = value.trim() || column.label;
  saveState();
  render();
}

function deleteColumn(tableType, columnId) {
  const key = tableType === 'tasks' ? 'taskColumns' : 'channelColumns';
  const column = state.data[key].find((item) => item.id === columnId);
  if (!column) return;

  const ok = window.confirm(`要刪除欄位「${column.label}」嗎？`);
  if (!ok) return;

  state.data[key] = state.data[key].filter((item) => item.id !== columnId);
  state.data.hiddenColumns[tableType] = state.data.hiddenColumns[tableType].filter((id) => id !== columnId);
  delete state.data.columnWidths[`${tableType === 'tasks' ? 'task' : 'channel'}:${columnId}`];
  saveState();
  render();
  renderFieldSettingsList();
}

function toggleColumnVisibility(tableType, columnId, visible) {
  const hidden = state.data.hiddenColumns[tableType];
  const exists = hidden.includes(columnId);
  if (!visible && !exists) {
    hidden.push(columnId);
  } else if (visible && exists) {
    state.data.hiddenColumns[tableType] = hidden.filter((id) => id !== columnId);
  }
  saveState();
  render();
}

function updateDropdownOption(dropdownKey, optionIndex, value, previousValue) {
  const next = String(value).trim();
  if (!next) return;

  const current = previousValue ?? state.data.dropdownOptions[dropdownKey][optionIndex];
  const duplicateIndex = state.data.dropdownOptions[dropdownKey].findIndex((item, index) => item === next && index !== optionIndex);

  if (duplicateIndex !== -1) {
    state.data.dropdownOptions[dropdownKey].splice(optionIndex, 1);
  } else {
    state.data.dropdownOptions[dropdownKey][optionIndex] = next;
  }

  if (current && current !== next) {
    renameDropdownValueInRecords(dropdownKey, current, next);
  }

  saveState();
  render();
  renderFieldSettingsList();
}

function commitFieldSettingsInput(target) {
  const toggleInput = target.closest('input[data-toggle-column-id]');
  if (toggleInput) {
    toggleColumnVisibility(toggleInput.dataset.tableType, toggleInput.dataset.toggleColumnId, toggleInput.checked);
    return true;
  }

  const labelInput = target.closest('input[data-column-id]');
  if (labelInput) {
    updateColumnLabel(labelInput.dataset.tableType, labelInput.dataset.columnId, labelInput.value);
    return true;
  }

  const optionsInput = target.closest('input[data-dropdown-key][data-option-index]');
  if (optionsInput) {
    return false;
  }

  return false;
}

function renameDropdownValueInRecords(dropdownKey, previousValue, nextValue) {
  if (dropdownKey === 'source') {
    state.data.channels.forEach((channel) => {
      if (channel.source === previousValue) channel.source = nextValue;
    });
    return;
  }

  if (dropdownKey === 'result') {
    state.data.channels.forEach((channel) => {
      if (channel.result === previousValue) channel.result = nextValue;
    });
    return;
  }

  if (dropdownKey === 'status') {
    state.data.channels.forEach((channel) => {
      if (channel.status === previousValue) channel.status = nextValue;
    });
    return;
  }

  if (dropdownKey === 'taskType') {
    state.data.tasks.forEach((task) => {
      if (task.type === previousValue) task.type = nextValue;
    });
  }
}

function clearDropdownValueFromRecords(dropdownKey, valueToRemove) {
  if (dropdownKey === 'source') {
    state.data.channels.forEach((channel) => {
      if (channel.source === valueToRemove) channel.source = '';
    });
    return;
  }

  if (dropdownKey === 'result') {
    state.data.channels.forEach((channel) => {
      if (channel.result === valueToRemove) channel.result = '';
    });
    return;
  }

  if (dropdownKey === 'status') {
    state.data.channels.forEach((channel) => {
      if (channel.status === valueToRemove) channel.status = '';
    });
    return;
  }

  if (dropdownKey === 'taskType') {
    state.data.tasks.forEach((task) => {
      if (task.type === valueToRemove) task.type = '';
    });
  }
}

function addDropdownOption(dropdownKey) {
  const base = '新選項';
  let next = base;
  let count = 2;
  while (state.data.dropdownOptions[dropdownKey].includes(next)) {
    next = `${base}${count}`;
    count += 1;
  }
  state.data.dropdownOptions[dropdownKey].push(next);
  saveState();
  render();
  renderFieldSettingsList();
}

function removeDropdownOption(dropdownKey, optionIndex) {
  if (state.data.dropdownOptions[dropdownKey].length <= 1) return;
  const removedValue = state.data.dropdownOptions[dropdownKey][optionIndex];
  const ok = window.confirm(`要刪除選項「${removedValue}」嗎？使用這個值的資料也會一起清空。`);
  if (!ok) return;
  state.data.dropdownOptions[dropdownKey].splice(optionIndex, 1);
  clearDropdownValueFromRecords(dropdownKey, removedValue);
  saveState();
  render();
  renderFieldSettingsList();
}

function seedDemoData() {
  state.data = {
    tasks: [
      normalizeTask({ name: '禁止提現訂單審核', guideUrl1: 'https://example.com/check-1', guideUrl2: 'https://example.com/review-1', type: '週六', note: '日二次', todayDone: false, yesterdayDone: false, beforeYesterdayDone: false }),
      normalizeTask({ name: '禁止原生', guideUrl1: 'https://example.com/native-stop', type: '每日', note: '周一到周三', todayDone: true, yesterdayDone: true, beforeYesterdayDone: true }),
      normalizeTask({ name: '渠道回U', guideUrl1: 'https://example.com/channel-u', guideUrl2: 'https://example.com/channel-u-guide', type: '每日', note: '目前只針對 MGPAY / BfPay', todayDone: true, yesterdayDone: true, beforeYesterdayDone: true }),
      normalizeTask({ name: '支付渠道-rockgame調整', guideUrl1: 'https://example.com/rockgame', type: '機動性', note: '機動性要隨時看', todayDone: true, yesterdayDone: false, beforeYesterdayDone: true }),
    ],
    channels: [
      normalizeChannel({ source: '回U渠道檢查表', updatedAt: '2026-04-15T10:40', name: 'MGPAY', amount: '2171373.68', result: '已回U', note: '上午批次' }),
      normalizeChannel({ source: '回U渠道檢查表', updatedAt: '2026-04-15T18:50', name: 'MGPAY', amount: '71373.68', result: '不回U', note: '晚間批次' }),
      normalizeChannel({ source: '回U渠道檢查表', updatedAt: '2026-04-15T18:50', name: 'MOSSENPAY', amount: '', result: '詢問中', note: '11 結算' }),
      normalizeChannel({ source: '回U渠道-R', updatedAt: '2026-04-15T18:50', name: '128(Eazy2pay-native)', amount: '233150.24', result: '不回U', status: '啟用' }),
      normalizeChannel({ source: '回U渠道-R', updatedAt: '2026-04-15T18:50', name: '129(Kcash-native)', amount: '517030.5', result: '不回U', status: '關閉' }),
      normalizeChannel({ source: '回U渠道-R', updatedAt: '2026-04-15T18:50', name: '138(Hotzpay-native)', amount: '', result: '目前暫無法回U', status: '' }),
    ],
    taskColumns: structuredClone(DEFAULT_TASK_COLUMNS),
    channelColumns: structuredClone(DEFAULT_CHANNEL_COLUMNS),
    columnWidths: {},
    dropdownOptions: structuredClone(DEFAULT_DROPDOWN_OPTIONS),
    hiddenColumns: { tasks: [], channels: [] },
  };

  saveState();
  render();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dashboard-data-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      state.data = normalizeState(parsed);
      saveState();
      render();
    } catch (error) {
      window.alert('匯入失敗，請確認 JSON 格式正確。');
    }
  };
  reader.readAsText(file, 'utf-8');
}

function resetData() {
  const ok = window.confirm('要清除目前所有本機資料嗎？此動作無法復原。');
  if (!ok) return;

  state.data = createDefaultState();
  saveState();
  render();
}

document.querySelectorAll('.nav-button').forEach((button) => {
  button.addEventListener('click', () => {
    state.view = button.dataset.view;
    render();
  });
});

document.querySelectorAll('[data-nav-group]').forEach((button) => {
  button.addEventListener('click', () => {
    const group = button.dataset.navGroup;
    state.navGroups[group] = !state.navGroups[group];
    renderNavigation();
  });
});

document.getElementById('add-task-btn').addEventListener('click', addTask);
document.getElementById('add-channel-btn').addEventListener('click', addChannel);
document.getElementById('seed-demo-btn').addEventListener('click', seedDemoData);
document.getElementById('export-btn').addEventListener('click', exportJson);
document.getElementById('reset-btn').addEventListener('click', resetData);
els.importInput.addEventListener('change', (event) => importJson(event.target.files[0]));
els.cloudSyncSaveBtn?.addEventListener('click', saveCloudSyncSettings);
els.cloudSyncPullBtn?.addEventListener('click', () => {
  saveCloudSyncSettings();
  void pullCloudState();
});
els.cloudSyncPushBtn?.addEventListener('click', () => {
  saveCloudSyncSettings();
  void pushCloudState();
});

els.taskBody.addEventListener('change', (event) => {
  const row = event.target.closest('tr');
  if (!row) return;

  const id = row.dataset.id;
  const field = event.target.dataset.field;
  if (!field) return;

  const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
  if (event.target.type === 'checkbox') {
    updateTaskHistory(id, event.target.dataset.dateKey, value);
  } else {
    updateTask(id, field, value);
  }
});

els.taskBody.addEventListener('click', (event) => {
  const guideEdit = event.target.closest('[data-action="start-guide-edit"]');
  if (guideEdit) {
    const row = guideEdit.closest('tr');
    if (!row) return;
    startGuideInlineEdit(row.dataset.id, guideEdit.dataset.field);
    return;
  }

  const archiveButton = event.target.closest('[data-action="archive-task"]');
  if (archiveButton) {
    const row = archiveButton.closest('tr');
    if (!row) return;
    archiveTask(row.dataset.id);
    return;
  }

  const button = event.target.closest('[data-action="delete-task"]');
  if (!button) return;
  const row = button.closest('tr');
  if (!row) return;
  const name = row.querySelector('[data-field="name"]')?.value || '這筆任務';
  const ok = window.confirm(`要刪除「${name}」嗎？刪除後仍可按上方「復原」救回。`);
  if (!ok) return;
  deleteTask(row.dataset.id);
});

els.taskArchiveBody?.addEventListener('click', (event) => {
  const restoreButton = event.target.closest('[data-action="restore-task"]');
  if (restoreButton) {
    const row = restoreButton.closest('tr');
    if (!row) return;
    restoreTask(row.dataset.id);
    return;
  }

  const purgeButton = event.target.closest('[data-action="purge-task"]');
  if (purgeButton) {
    const row = purgeButton.closest('tr');
    if (!row) return;
    purgeTask(row.dataset.id);
  }
});

els.taskBody.addEventListener('focusout', (event) => {
  const input = event.target.closest('.guide-inline-input');
  if (!input) return;
  const nextTarget = event.relatedTarget;
  if (nextTarget && nextTarget.closest('.guide-inline-cell') === input.closest('.guide-inline-cell')) return;
  commitGuideInlineEdit(input.dataset.id, input.dataset.field, input.value, false);
});

els.taskBody.addEventListener('keydown', (event) => {
  const input = event.target.closest('.guide-inline-input');
  if (!input) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    commitGuideInlineEdit(input.dataset.id, input.dataset.field, input.value);
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    cancelGuideInlineEdit();
  }
});

els.channelBody.addEventListener('change', (event) => {
  const row = event.target.closest('tr');
  if (!row) return;

  const id = row.dataset.id;
  const field = event.target.dataset.field;
  if (!field) return;

  updateChannel(id, field, event.target.value);
});

els.channelBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="delete-channel"]');
  if (!button) return;
  const row = button.closest('tr');
  if (!row) return;
  const name = row.querySelector('[data-field="name"]')?.value || '這筆渠道';
  const ok = window.confirm(`要刪除「${name}」嗎？刪除後仍可按上方「復原」救回。`);
  if (!ok) return;
  deleteChannel(row.dataset.id);
});

els.channelHistoryBody.addEventListener('change', (event) => {
  const row = event.target.closest('tr');
  if (!row) return;

  const id = row.dataset.id;
  const field = event.target.dataset.field;
  if (!field) return;

  updateChannel(id, field, event.target.value);
});

els.channelHistoryBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="delete-channel"]');
  if (!button) return;
  const row = button.closest('tr');
  if (!row) return;
  const name = row.querySelector('[data-field="name"]')?.value || '這筆渠道';
  const ok = window.confirm(`要刪除「${name}」嗎？刪除後仍可按上方「復原」救回。`);
  if (!ok) return;
  deleteChannel(row.dataset.id);
});

document.getElementById('undo-btn').addEventListener('click', undoDelete);
document.getElementById('dismiss-undo-btn').addEventListener('click', clearUndoBanner);
els.taskFieldSettingsBtn.addEventListener('click', () => openFieldSettings('tasks'));
els.channelFieldSettingsBtn.addEventListener('click', () => openFieldSettings('channels'));
// Field settings button for channel summary view
els.channelSummaryFieldSettingsBtn?.addEventListener('click', () => openFieldSettings('channelSummary'));
els.channelCaptureBtn.addEventListener('click', toggleCaptureMode);
els.duplicateChannelBatchBtn.addEventListener('click', duplicateChannelBatch);
els.captureExitBtn.addEventListener('click', toggleCaptureMode);
els.addFieldFromModalBtn.addEventListener('click', () => addField(state.fieldSettingsTarget));
els.closeFieldSettingsBtn.addEventListener('click', closeFieldSettings);
els.fieldSettingsList.addEventListener('change', (event) => {
  commitFieldSettingsInput(event.target);
});

els.fieldSettingsList.addEventListener('focusout', (event) => {
  commitFieldSettingsInput(event.target);
});

els.fieldSettingsList.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-action="add-dropdown-option"]');
  if (addButton) {
    addDropdownOption(addButton.dataset.dropdownKey);
    return;
  }

  const saveButton = event.target.closest('[data-action="save-dropdown-option"]');
  if (saveButton) {
    const optionRow = saveButton.closest('.settings-option-row');
    const input = optionRow?.querySelector('input[data-dropdown-key][data-option-index]');
    if (!input) return;
    updateDropdownOption(
      saveButton.dataset.dropdownKey,
      Number(saveButton.dataset.optionIndex),
      input.value,
      input.dataset.optionValue
    );
    return;
  }

  const removeButton = event.target.closest('[data-action="remove-dropdown-option"]');
  if (removeButton) {
    removeDropdownOption(removeButton.dataset.dropdownKey, Number(removeButton.dataset.optionIndex));
    return;
  }

  const deleteColumnButton = event.target.closest('[data-action="delete-column"]');
  if (deleteColumnButton) {
    deleteColumn(deleteColumnButton.dataset.tableType, deleteColumnButton.dataset.columnId);
  }
});
els.taskPrevRangeBtn.addEventListener('click', () => {
  state.taskAnchorDate = addDays(state.taskAnchorDate, -3);
  render();
});
els.taskNextRangeBtn.addEventListener('click', () => {
  state.taskAnchorDate = addDays(state.taskAnchorDate, 3);
  render();
});
els.taskTodayBtn.addEventListener('click', () => {
  state.taskAnchorDate = new Date();
  render();
});
els.taskAnchorDate.addEventListener('change', () => {
  if (!els.taskAnchorDate.value) return;
  state.taskAnchorDate = parseDateKey(els.taskAnchorDate.value);
  render();
});
els.taskArchiveSearch?.addEventListener('input', () => {
  state.taskArchiveSearch = els.taskArchiveSearch.value || '';
  renderTaskArchiveTable();
});
els.taskArchiveTypeFilter?.addEventListener('change', () => {
  state.taskArchiveType = els.taskArchiveTypeFilter.value || '';
  renderTaskArchiveTable();
});
els.taskArchiveClearBtn?.addEventListener('click', () => {
  state.taskArchiveSearch = '';
  state.taskArchiveType = '';
  renderTaskArchiveTable();
});
els.channelBatchTime.addEventListener('change', () => {
  els.channelBatchTimeDisplay.textContent = `本次處理時間 ${formatBatchDisplay(els.channelBatchTime.value || '')}`;
  syncChannelBatchNote();
  render();
});
els.channelBatchNote?.addEventListener('input', () => {
  updateChannelBatchNote(els.channelBatchNote.value || '');
});
els.applyBatchTimeBtn.addEventListener('click', applyBatchTimeToAllChannels);
els.channelHistoryBatchSelect.addEventListener('change', () => {
  state.historyBatchTime = els.channelHistoryBatchSelect.value || '';
  renderChannelHistoryTable();
});
els.channelHistoryStart.addEventListener('change', () => {
  state.historyRangeStart = els.channelHistoryStart.value || '';
  render();
});
els.channelHistoryEnd.addEventListener('change', () => {
  state.historyRangeEnd = els.channelHistoryEnd.value || '';
  render();
});
els.channelHistoryClearBtn.addEventListener('click', () => {
  state.historyRangeStart = '';
  state.historyRangeEnd = '';
  render();
});
els.channelSummaryRefreshBtn?.addEventListener('click', () => {
  void refreshChannelSummary();
});
els.channelSummarySyncSaveBtn?.addEventListener('click', () => {
  state.data.channelSummarySync = {
    mode: els.channelSummarySyncMode?.value || 'sheet-direct',
    url: String(els.channelSummarySyncUrl?.value || '').trim(),
  };
  saveState();
  state.channelSummary.rows = [];
  state.channelSummary.error = '';
  state.channelSummary.lastFetchedAt = 0;
  void refreshChannelSummary();
});
els.channelSummarySearch?.addEventListener('input', () => {
  state.channelSummary.search = els.channelSummarySearch.value || '';
  renderChannelSummaryView();
});
els.channelSummaryChannelFilter?.addEventListener('change', () => {
  state.channelSummary.channel = els.channelSummaryChannelFilter.value || '';
  renderChannelSummaryView();
});
els.channelSummaryVersionFilter?.addEventListener('change', () => {
  state.channelSummary.version = els.channelSummaryVersionFilter.value || '';
  renderChannelSummaryView();
});
els.channelSummaryConfirmFilter?.addEventListener('change', () => {
  state.channelSummary.versionChecked = els.channelSummaryConfirmFilter.value || '';
  renderChannelSummaryView();
});
els.channelSummaryClearBtn?.addEventListener('click', () => {
  state.channelSummary.search = '';
  state.channelSummary.channel = '';
  state.channelSummary.version = '';
  state.channelSummary.versionChecked = '';
  renderChannelSummaryView();
});
els.channelSummaryTableHead?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-sort-key]');
  if (!button) return;

  const sortKey = button.dataset.sortKey;
  if (!sortKey) return;

  if (state.channelSummary.sortKey === sortKey) {
    state.channelSummary.sortDirection = state.channelSummary.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    state.channelSummary.sortKey = sortKey;
    state.channelSummary.sortDirection = CHANNEL_SUMMARY_NUMERIC_COLUMNS.has(sortKey) ? 'desc' : 'asc';
  }

  renderChannelSummaryView();
});
// 更新列表：重新整理、搜尋、排序與清除條件
els.updateListRefreshBtn?.addEventListener('click', () => {
  void refreshUpdateList();
});
els.updateListSearch?.addEventListener('input', () => {
  state.updateList.search = els.updateListSearch.value || '';
  renderUpdateListView();
});
els.updateListClearBtn?.addEventListener('click', () => {
  state.updateList.search = '';
  if (els.updateListSearch) els.updateListSearch.value = '';
  renderUpdateListView();
});
els.updateListTableHead?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-sort-key]');
  if (!button) return;
  const sortKey = button.dataset.sortKey;
  if (!sortKey) return;
  if (state.updateList.sortKey === sortKey) {
    state.updateList.sortDirection = state.updateList.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    state.updateList.sortKey = sortKey;
    // 預設為升冪排序；使用者可再點擊一次切換
    state.updateList.sortDirection = 'asc';
  }
  renderUpdateListView();
});
els.deleteHistoryBatchBtn.addEventListener('click', deleteHistoryBatch);
els.capturePrevPageBtn?.addEventListener('click', () => {
  state.capturePage = Math.max(0, state.capturePage - 1);
  render();
});
els.captureNextPageBtn?.addEventListener('click', () => {
  state.capturePage += 1;
  render();
});
window.addEventListener('resize', () => {
  if (state.captureMode) updateCaptureFit();
});
window.setInterval(() => {
  if (state.view === 'channel-summary') {
    void refreshChannelSummary();
  }
  if (state.view === 'update-list') {
    void refreshUpdateList();
  }
}, 60000);

render();
if (getCloudSyncConfig().enabled && getCloudSyncConfig().url) {
  void pullCloudState();
}
