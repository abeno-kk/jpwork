

const STORAGE_KEY = 'local-dashboard-app-v1';
const STORAGE_BACKUP_KEY = 'local-dashboard-app-v1-backup';
const STICKY_NOTES_STORAGE_KEY = 'local-dashboard-sticky-notes-v1';
const STORAGE_FALLBACK_KEYS = [
  'local-dashboard-app-v1',
  'local-dashboard-app',
  'dashboardState',
  'db_data',
  'appState',
  'dashboardData',
];

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
    id: 'packageName',
    label: '包名稱',
    index: 3,
    aliases: ['包名稱', '包名称'],
  },
  {
    id: 'version',
    label: '版本',
    index: 4,
    // 版本欄只抓「版本」，不要再把包名稱或包類型串進來，避免欄位內容黏在一起。
    aliases: ['版本'],
  },
  {
    id: 'firebase',
    label: 'firebase',
    index: 5,
    aliases: ['firebase', 'Firebase'],
  },
  {
    id: 'yesterdayNew',
    label: '昨日新增',
    index: 6,
    aliases: ['昨日新增'],
  },
  {
    id: 'yesterdayDau',
    label: '昨日DAU',
    index: 7,
    aliases: ['昨日DAU'],
  },
  {
    id: 'yesterdayRecharge',
    label: '昨日充值',
    index: 8,
    aliases: ['昨日充值'],
  },
  {
    id: 'versionChecked',
    label: '版本確認',
    index: 9,
    aliases: ['版本確認', '版本确认'],
  },
  {
    id: 'loginB',
    label: '登入B面',
    index: 10,
    aliases: ['登入B面', '登入B'],
  },
  {
    id: 'rechargeCheck',
    label: '拉充值',
    index: 11,
    aliases: ['拉充值'],
  },
  {
    id: 'gamePlay',
    label: '遊戲遊玩',
    index: 12,
    aliases: ['遊戲遊玩'],
  },
  {
    id: 'cdnTest',
    label: 'CDN測試',
    index: 13,
    aliases: ['CDN測試', 'CDN测试'],
  },
  {
    id: 'jointChannel',
    label: '聯運渠道',
    index: 14,
    aliases: ['聯運渠道', '联运渠道'],
  },
];

const CHANNEL_SUMMARY_NUMERIC_COLUMNS = new Set([
  'appid',
  'yesterdayNew',
  'yesterdayDau',
  'yesterdayRecharge',
]);

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
    columns: structuredClone(CHANNEL_SUMMARY_COLUMNS),
    rows: [],
    loading: false,
    error: '',
    lastFetchedAt: 0,
    search: '',
    channel: '',
    version: '',
    versionChecked: '',
    jointChannel: '',
    packageName: '',
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
  // 儲存目前勾選的渠道 ID，用於計算最新金額的總和（不會被持久化）
  selectedChannelIds: new Set(),
  stickyNotesOpen: false,
  stickyNotesView: 'active',
  stickyNotesSearch: '',
};

const els = {
  pageTitle: document.getElementById('page-title'),
  saveStatus: document.getElementById('save-status'),
  dataBackupExportBtn: document.getElementById('data-backup-export-btn'),
  dataBackupImportBtn: document.getElementById('data-backup-import-btn'),
  dataBackupFile: document.getElementById('data-backup-file'),
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
  // 顯示勾選加總的元素們
  channelSelectedSum: document.getElementById('channel-selected-sum'),
  channelSelectedSumPill: document.getElementById('channel-selected-sum-pill'),
  channelHiddenCount: document.getElementById('channel-hidden-count'),
  hideSelectedChannelsBtn: document.getElementById('hide-selected-channels-btn'),
  restoreHiddenChannelsBtn: document.getElementById('restore-hidden-channels-btn'),
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
  channelSummaryYesterdayNewTotal: document.getElementById('channel-summary-yesterday-new-total'),
  channelSummaryYesterdayDauTotal: document.getElementById('channel-summary-yesterday-dau-total'),
  channelSummaryYesterdayRechargeTotal: document.getElementById('channel-summary-yesterday-recharge-total'),
  channelSummarySyncStatus: document.getElementById('channel-summary-sync-status'),
  channelSummaryRefreshBtn: document.getElementById('channel-summary-refresh-btn'),
  channelSummarySyncMode: document.getElementById('channel-summary-sync-mode'),
  channelSummarySyncUrl: document.getElementById('channel-summary-sync-url'),
  channelSummarySyncSaveBtn: document.getElementById('channel-summary-sync-save-btn'),
  channelSummarySearch: document.getElementById('channel-summary-search'),
  channelSummaryChannelFilter: document.getElementById('channel-summary-channel-filter'),
  channelSummaryVersionFilter: document.getElementById('channel-summary-version-filter'),
  channelSummaryConfirmFilter: document.getElementById('channel-summary-confirm-filter'),
  channelSummaryJointChannelFilter: document.getElementById('channel-summary-joint-channel-filter'),
  channelSummaryPackageNameFilter: document.getElementById('channel-summary-package-name-filter'),
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
  updateListSyncMode: document.getElementById('update-list-sync-mode'),
  updateListSyncUrl: document.getElementById('update-list-sync-url'),
  updateListSyncSaveBtn: document.getElementById('update-list-sync-save-btn'),
  updateListCount: document.getElementById('update-list-count'),
  updateListSyncStatus: document.getElementById('update-list-sync-status'),
  updateListMessage: document.getElementById('update-list-message'),
  stickyNotesPanel: document.getElementById('sticky-notes-panel'),
  stickyNotesToggle: document.getElementById('sticky-notes-toggle'),
  stickyNotesCount: document.getElementById('sticky-notes-count'),
  stickyNotesList: document.getElementById('sticky-notes-list'),
  stickyNotesEmpty: document.getElementById('sticky-notes-empty'),
  stickyNoteAddBtn: document.getElementById('sticky-note-add-btn'),
  stickyNotesCloseBtn: document.getElementById('sticky-notes-close-btn'),
  stickyNotesActiveTab: document.getElementById('sticky-notes-active-tab'),
  stickyNotesArchiveTab: document.getElementById('sticky-notes-archive-tab'),
  stickyNotesActiveTotal: document.getElementById('sticky-notes-active-total'),
  stickyNotesArchiveTotal: document.getElementById('sticky-notes-archive-total'),
  stickyNotesSearchWrap: document.getElementById('sticky-notes-search-wrap'),
  stickyNotesSearch: document.getElementById('sticky-notes-search'),
};

function parseStoredState(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function estimateStateScore(candidate) {
  if (!candidate || typeof candidate !== 'object') return -1;
  const tasks = Array.isArray(candidate.tasks) ? candidate.tasks.length : 0;
  const channels = Array.isArray(candidate.channels) ? candidate.channels.length : 0;
  const taskColumns = Array.isArray(candidate.taskColumns) ? candidate.taskColumns.length : 0;
  const channelColumns = Array.isArray(candidate.channelColumns) ? candidate.channelColumns.length : 0;
  const dialogTemplates = Array.isArray(candidate.dialogDb?.templates) ? candidate.dialogDb.templates.length : 0;
  return tasks * 10 + channels * 10 + dialogTemplates * 10 + taskColumns + channelColumns;
}

function findBestStoredState() {
  const keys = Array.from(new Set([
    STORAGE_KEY,
    STORAGE_BACKUP_KEY,
    ...STORAGE_FALLBACK_KEYS,
    ...Object.keys(localStorage),
  ]));

  let best = null;
  let bestScore = -1;

  keys.forEach((key) => {
    const parsed = parseStoredState(localStorage.getItem(key));
    const score = estimateStateScore(parsed);
    if (score > bestScore) {
      best = parsed;
      bestScore = score;
    }
  });

  return best;
}

function restoreStickyNotesBackup(data) {
  const stickyNotesBackup = parseStoredState(localStorage.getItem(STICKY_NOTES_STORAGE_KEY));
  if (!Array.isArray(stickyNotesBackup)) return data;
  return { ...data, stickyNotes: normalizeStickyNotes(stickyNotesBackup) };
}

function loadState() {
  const primary = parseStoredState(localStorage.getItem(STORAGE_KEY));
  const primaryScore = estimateStateScore(primary);

  if (primary && primaryScore >= 0) {
    if (primaryScore === 0) {
      const recovered = findBestStoredState();
      const recoveredScore = estimateStateScore(recovered);
      if (recovered && recoveredScore > primaryScore) {
        const normalized = normalizeState(recovered);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(normalized));
        } catch (error) {}
        return restoreStickyNotesBackup(normalized);
      }
    }
    return restoreStickyNotesBackup(normalizeState(primary));
  }

  const recovered = findBestStoredState();
  if (recovered) {
    const normalized = normalizeState(recovered);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(normalized));
    } catch (error) {}
    return restoreStickyNotesBackup(normalized);
  }

  return restoreStickyNotesBackup(createDefaultState());
}

function createDefaultState() {
  return {
    tasks: [],
    channels: [],
    // 永久備註：不跟批次時間綁定，新增批次也會保留
    channelPermanentNote: '',
    // 永久批次備註：只保留上方批次備註，不自動帶入每列備註
    channelPermanentRowNotes: {},
    channelBatchNotes: {},
    channelSummarySync: {
      mode: 'apps-script',
      url: '',
    },
    updateListSync: {
      mode: 'apps-script',
      url: '',
    },
    taskColumns: structuredClone(DEFAULT_TASK_COLUMNS),
    channelColumns: structuredClone(DEFAULT_CHANNEL_COLUMNS),
    columnWidths: {},
    dropdownOptions: structuredClone(DEFAULT_DROPDOWN_OPTIONS),
    // hiddenColumns stores arrays of hidden column IDs for each table type
    hiddenColumns: { tasks: [], channels: [], channelSummary: [] },
    hiddenChannelRows: [],
    // 隱藏渠道名稱：同名渠道在新增批次後也會自動隱藏
    hiddenChannelKeys: [],
    stickyNotes: [],
    googlePlayMonitors: normalizeGooglePlayMonitors(undefined),
    googlePlayMonitorSettings: normalizeGooglePlayMonitorSettings({}),
    dialogDb: normalizeDialogDb({}),
  };
}

function normalizeDialogDb(input) {
  const source = input && typeof input === 'object' ? input : {};
  const defaults = {
    categories: ['提款', '充值', '客服', '活動', '風控', 'VIP', '補單'],
    templates: [],
    selectedCategory: '全部',
    selectedId: '',
    recentIds: [],
  };

  const categories = Array.isArray(source.categories)
    ? [...new Set(source.categories.map((item) => String(item || '').trim()).filter(Boolean))]
    : defaults.categories;

  const templates = Array.isArray(source.templates)
    ? source.templates.map((item) => ({
        id: String(item?.id || ('dlg_' + Date.now() + '_' + Math.random().toString(16).slice(2))),
        title: String(item?.title || ''),
        category: String(item?.category || '未分類'),
        tags: Array.isArray(item?.tags)
          ? item.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
          : String(item?.tags || '').split(/[,\s，]+/).map((tag) => tag.trim()).filter(Boolean),
        zh: String(item?.zh || ''),
        en: String(item?.en || ''),
        hi: String(item?.hi || ''),
        note: String(item?.note || ''),
        favorite: Boolean(item?.favorite),
        createdAt: String(item?.createdAt || ''),
        updatedAt: String(item?.updatedAt || ''),
      }))
    : [];

  return {
    categories: categories.length ? categories : defaults.categories,
    templates,
    selectedCategory: String(source.selectedCategory || '全部'),
    selectedId: String(source.selectedId || ''),
    recentIds: Array.isArray(source.recentIds) ? source.recentIds.map((id) => String(id)) : [],
  };
}


function normalizeStickyNotes(notes) {
  if (!Array.isArray(notes)) return [];
  return notes.map((note) => ({
    id: note?.id || crypto.randomUUID(), text: String(note?.text || ''),
    completed: Boolean(note?.completed),
    color: ['yellow', 'pink', 'blue'].includes(note?.color) ? note.color : 'yellow',
    createdAt: note?.createdAt || new Date().toISOString(),
    completedAt: note?.completedAt || '',
  }));
}

function normalizeGooglePlayMonitors(monitors) {
  const source = monitors === undefined
    ? [{
        url: 'https://play.google.com/store/apps/details?id=com.icefishinggame.spacequikhubcc',
        label: 'Sea Ice Fishing:Shooting',
      }]
    : monitors;
  if (!Array.isArray(source)) return [];
  return source.map((item) => ({
    id: String(item?.id || crypto.randomUUID()),
    url: String(item?.url || '').trim(),
    appId: String(item?.appId || '').trim(),
    label: String(item?.label || '').trim(),
    title: String(item?.title || '').trim(),
    installs: String(item?.installs || '').trim(),
    previousInstalls: String(item?.previousInstalls || '').trim(),
    lastCheckedAt: String(item?.lastCheckedAt || ''),
    lastChangedAt: String(item?.lastChangedAt || ''),
    status: ['idle', 'checking', 'ok', 'changed', 'error'].includes(item?.status) ? item.status : 'idle',
    error: String(item?.error || ''),
    history: Array.isArray(item?.history)
      ? item.history.slice(-100).map((entry) => ({

          at: String(entry?.at || ''),
          installs: String(entry?.installs || '').trim(),
        })).filter((entry) => entry.at && entry.installs)
      : [],
  })).filter((item) => item.url);
}

function normalizeGooglePlayMonitorSettings(settings) {
  const interval = Number(settings?.intervalMinutes);
  return {
    intervalMinutes: [0, 15, 30, 60, 180, 360].includes(interval) ? interval : 60,
  };
}

function normalizeState(input) {
  const normalizedChannels = Array.isArray(input.channels) ? input.channels.map(normalizeChannel) : [];
  return {
    tasks: Array.isArray(input.tasks) ? input.tasks.map(normalizeTask) : [],
    channels: normalizedChannels,
    channelPermanentNote: normalizeChannelPermanentNote(input),
    channelPermanentRowNotes: normalizeChannelPermanentRowNotes(input.channelPermanentRowNotes, normalizedChannels),
    channelBatchNotes: normalizeChannelBatchNotes(input.channelBatchNotes),
    channelSummarySync: normalizeChannelSummarySync(input.channelSummarySync),
    updateListSync: normalizeChannelSummarySync(input.updateListSync || input.channelSummarySync),
    taskColumns: normalizeTaskColumns(input.taskColumns),
    channelColumns: normalizeChannelColumns(input.channelColumns),
    columnWidths: input.columnWidths && typeof input.columnWidths === 'object' ? { ...input.columnWidths } : {},
    dropdownOptions: normalizeDropdownOptions(input.dropdownOptions, normalizedChannels),
    hiddenColumns: normalizeHiddenColumns(input.hiddenColumns),
    hiddenChannelRows: Array.isArray(input.hiddenChannelRows) ? [...input.hiddenChannelRows] : [],
    hiddenChannelKeys: Array.isArray(input.hiddenChannelKeys) ? [...new Set(input.hiddenChannelKeys.map((item) => String(item).trim().toLowerCase()).filter(Boolean))] : [],
    stickyNotes: normalizeStickyNotes(input.stickyNotes),
    googlePlayMonitors: normalizeGooglePlayMonitors(input.googlePlayMonitors),
    googlePlayMonitorSettings: normalizeGooglePlayMonitorSettings(input.googlePlayMonitorSettings),
    dialogDb: normalizeDialogDb(input.dialogDb),
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

function normalizeChannelPermanentNote(input) {
  if (typeof input?.channelPermanentNote === 'string') return input.channelPermanentNote;
  // 舊版資料只有批次備註時，取最新一筆非空備註升級成永久備註
  const notes = input?.channelBatchNotes;
  if (notes && typeof notes === 'object') {
    const latest = Object.entries(notes)
      .map(([key, value]) => [String(key).trim(), String(value ?? '')])
      .filter(([key, value]) => key && value.trim())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .at(-1);
    return latest ? latest[1] : '';
  }
  return '';
}

function getChannelPermanentKey(channel = {}) {
  // 以「渠道名稱」作為永久備註主鍵；名稱相同就自動沿用備註
  return String(channel.name || '').trim().toLowerCase();
}

function normalizeChannelPermanentRowNotes(notes, channels = []) {
  const result = {};
  if (notes && typeof notes === 'object') {
    Object.entries(notes).forEach(([key, value]) => {
      const k = String(key).trim().toLowerCase();
      const v = String(value ?? '');
      if (k && v.trim()) result[k] = v;
    });
  }
  // 舊資料升級：既有渠道列備註也寫入永久備註表
  channels.forEach((channel) => {
    const key = getChannelPermanentKey(channel);
    const note = String(channel.note || '');
    if (key && note.trim() && !result[key]) result[key] = note;
  });
  return result;
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

function saveState() {
  const serialized = JSON.stringify(state.data);
  try {
    localStorage.setItem(STICKY_NOTES_STORAGE_KEY, JSON.stringify(state.data.stickyNotes || []));
  } catch (error) {
    console.error('Sticky notes backup could not be saved.', error);
  }
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    // Backup is another full copy, so free it and retry before reporting quota failure.
    try {
      localStorage.removeItem(STORAGE_BACKUP_KEY);
      localStorage.removeItem(`${STORAGE_BACKUP_KEY}-ts`);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (retryError) {
      const stored = parseStoredState(localStorage.getItem(STORAGE_KEY));
      if (stored) state.data = normalizeState(stored);
      console.error('Dashboard data could not be saved.', retryError);
      els.saveStatus.textContent = '儲存失敗：瀏覽器空間不足';
      els.saveStatus.classList.add('save-error');
      window.alert('這次修改未儲存。瀏覽器的網站儲存空間可能已滿，請先匯出備份並清理不需要的資料後再試。');
      return false;
    }
  }
  try {
    localStorage.setItem(STORAGE_BACKUP_KEY, serialized);
    localStorage.setItem(`${STORAGE_BACKUP_KEY}-ts`, new Date().toISOString());
  } catch (error) {}
  els.saveStatus.classList.remove('save-error');
  els.saveStatus.textContent = `已儲存 ${new Date().toLocaleTimeString('zh-Hant', { hour: '2-digit', minute: '2-digit' })}`;
  els.saveStatus.classList.remove('flash');
  void els.saveStatus.offsetWidth;
  els.saveStatus.classList.add('flash');
  return true;
}


function exportDashboardBackup() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = URL.createObjectURL(blob);
  a.download = `dashboard-backup-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

function importDashboardBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{}'));
      state.data = normalizeState(parsed);
      saveState();
      render();
      alert('備份已匯入');
    } catch (error) {
      alert('備份檔格式錯誤');
    }
  };
  reader.readAsText(file, 'utf-8');
}

function render() {
  renderNavigation();
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
  renderStickyNotes();
  updateCaptureFit();
}

function renderStickyNotes() {
  if (!els.stickyNotesList) return;
  const allNotes = state.data.stickyNotes || [];
  const activeNotes = allNotes.filter((note) => !note.completed);
  const completedNotes = allNotes
    .filter((note) => note.completed)
    .sort((a, b) => String(b.completedAt || '').localeCompare(String(a.completedAt || '')));
  const isArchive = state.stickyNotesView === 'archive';
  const keyword = state.stickyNotesSearch.trim().toLowerCase();
  const notes = isArchive && keyword
    ? completedNotes.filter((note) => note.text.toLowerCase().includes(keyword))
    : isArchive ? completedNotes : activeNotes;
  els.stickyNotesPanel.hidden = !state.stickyNotesOpen;
  els.stickyNotesToggle.setAttribute('aria-expanded', String(state.stickyNotesOpen));
  els.stickyNotesCount.textContent = String(activeNotes.length);
  els.stickyNotesCount.hidden = activeNotes.length === 0;
  els.stickyNotesActiveTotal.textContent = String(activeNotes.length);
  els.stickyNotesArchiveTotal.textContent = String(completedNotes.length);
  els.stickyNotesActiveTab.classList.toggle('is-active', !isArchive);
  els.stickyNotesArchiveTab.classList.toggle('is-active', isArchive);
  els.stickyNotesActiveTab.setAttribute('aria-selected', String(!isArchive));
  els.stickyNotesArchiveTab.setAttribute('aria-selected', String(isArchive));
  els.stickyNotesSearchWrap.hidden = !isArchive;
  if (els.stickyNotesSearch.value !== state.stickyNotesSearch) els.stickyNotesSearch.value = state.stickyNotesSearch;
  els.stickyNotesEmpty.hidden = notes.length > 0;
  els.stickyNotesEmpty.textContent = isArchive
    ? keyword ? '找不到符合的已完成便利貼。' : '尚無已完成便利貼。'
    : '還沒有進行中的便利貼，按「新增」開始記錄。';
  els.stickyNotesList.innerHTML = '';
  notes.forEach((note) => {
    const card = document.createElement('article');
    card.className = `sticky-note-card sticky-note-${note.color}${note.completed ? ' is-completed' : ''}`;
    card.dataset.id = note.id;
    const completedAt = note.completedAt
      ? new Date(note.completedAt).toLocaleString('zh-Hant', { dateStyle: 'short', timeStyle: 'short' })
      : '';
    card.innerHTML = `${note.completed ? `<div class="sticky-note-saved" role="status">✓ 已保存${completedAt ? `・${completedAt}` : ''}</div>` : ''}<textarea class="sticky-note-text" data-action="edit-sticky-note" placeholder="輸入臨時記事…" aria-label="便利貼內容"></textarea><div class="sticky-note-actions"><label class="sticky-note-complete"><input type="checkbox" data-action="complete-sticky-note" ${note.completed ? 'checked' : ''} /> ${note.completed ? '恢復' : '完成'}</label><select data-action="color-sticky-note"><option value="yellow" ${note.color === 'yellow' ? 'selected' : ''}>黃色</option><option value="pink" ${note.color === 'pink' ? 'selected' : ''}>粉色</option><option value="blue" ${note.color === 'blue' ? 'selected' : ''}>藍色</option></select><button class="sticky-note-delete" data-action="delete-sticky-note" type="button">刪除</button></div>`;
    card.querySelector('textarea').value = note.text;
    els.stickyNotesList.appendChild(card);
  });
}
function addStickyNote() {
  const note = normalizeStickyNotes([{ text: '' }])[0];
  state.data.stickyNotes.unshift(note); state.stickyNotesOpen = true; state.stickyNotesView = 'active'; saveState(); renderStickyNotes();
  els.stickyNotesList.querySelector(`[data-id="${note.id}"] textarea`)?.focus();
}
function updateStickyNote(id, changes) {
  const note = state.data.stickyNotes.find((item) => item.id === id);
  if (note) { Object.assign(note, changes); saveState(); }
}
function deleteStickyNote(id) {
  state.data.stickyNotes = state.data.stickyNotes.filter((note) => note.id !== id); saveState(); renderStickyNotes();
}

function renderNavigation() {
  document.querySelectorAll('.nav-button').forEach((button) => {
    const isActive = button.dataset.view === state.view;
    button.classList.toggle('is-active', isActive);
  });

  const activeGroup = state.view === 'tasks' || state.view === 'task-archive'
    ? 'tasks'
    : ['channels', 'channel-history', 'channel-summary', 'poison-monitor', 'update-list', 'google-play-monitor'].includes(state.view)
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
      : state.view === 'poison-monitor'
        ? '報毒控表'
      : state.view === 'update-list'
        ? '更新列表'
      : state.view === 'google-play-monitor'
        ? 'Google Play 監控'
      : state.view === 'conversation-db'
        ? '對話資料庫'
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

function refreshChannelSummary() {
  state.channelSummary.loading = true;
  state.channelSummary.error = '';
  renderChannelSummaryView();

  return loadGoogleSheetRows()
    .then((result) => {
      state.channelSummary.columns = Array.isArray(result?.columns) && result.columns.length
        ? result.columns
        : structuredClone(CHANNEL_SUMMARY_COLUMNS);
      state.channelSummary.rows = Array.isArray(result?.rows) ? result.rows : [];
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

  const headers = (response?.table?.cols || []).map((column, index) =>
    String(column?.label || column?.id || `欄位 ${index + 1}`).trim()
  );
  const columns = buildChannelSummaryColumns(headers);
  const mappedRows = rows
    .map((row, index) => {
      const cells = Array.isArray(row?.c) ? row.c : [];
      const record = { id: `sheet_${index}` };
      columns.forEach((column) => {
        record[column.id] = readGvizCell(cells[column.index]);
      });
      return record;
    })
    .filter((row) => columns.some((column) => String(row[column.id] || '').trim()));

  return { columns, rows: mappedRows };
}
function readGvizCell(cell) {
  if (!cell) return '';
  if (cell.f !== null && cell.f !== undefined && cell.f !== '') return String(cell.f);
  if (typeof cell.v === 'boolean') return cell.v ? 'TRUE' : 'FALSE';
  return String(cell.v ?? '');
}

function parseChannelSummaryCsv(csvText) {
  const rows = parseCsvRows(csvText);
  if (!rows.length) return { columns: [], rows: [] };
  return mapChannelSummaryRowsByHeaders(rows);
}

function parseChannelSummaryApiResponse(payload) {
  if (payload?.ok === false) throw new Error(payload.error || 'Apps Script API 回傳錯誤。');
  const headers = Array.isArray(payload?.headers) ? payload.headers : [];

  if (Array.isArray(payload)) return mapChannelSummaryObjectRows(payload);
  if (Array.isArray(payload?.rows)) {
    if (Array.isArray(payload.rows[0])) {
      return mapChannelSummaryRowsByHeaders(headers.length ? [headers, ...payload.rows] : payload.rows);
    }
    return mapChannelSummaryObjectRows(payload.rows, headers);
  }
  if (Array.isArray(payload?.values)) return mapChannelSummaryRowsByHeaders(payload.values);
  throw new Error('Apps Script API 回傳格式不支援，請回傳 headers 與 rows，或 values 二維陣列。');
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
  const syncConfig = state.data.updateListSync || state.data.channelSummarySync || { mode: 'apps-script', url: '' };
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

      let requestUrl = syncConfig.url;
      // 允許使用同一支 Apps Script：不管原網址有沒有 type，都強制更新列表讀 type=updates
      try {
        const parsedUrl = new URL(syncConfig.url, window.location.href);
        parsedUrl.searchParams.set('type', 'updates');
        parsedUrl.searchParams.set('callback', callbackName);
        requestUrl = parsedUrl.toString();
      } catch (error) {
        const params = new URLSearchParams();
        params.set('type', 'updates');
        params.set('callback', callbackName);
        requestUrl = `${syncConfig.url}${separator}${params.toString()}`;
      }
      script.src = requestUrl;
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

function normalizeChannelSummaryHeaderKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s_\-–—&＆/\\()（）]+/g, '');
}

function hashChannelSummaryHeader(value) {
  let hash = 2166136261;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function findKnownChannelSummaryColumn(header) {
  const normalized = normalizeChannelSummaryHeaderKey(header);
  return CHANNEL_SUMMARY_COLUMNS.find((column) =>
    [column.id, column.label, ...(column.aliases || [])]
      .some((candidate) => normalizeChannelSummaryHeaderKey(candidate) === normalized)
  ) || null;
}

function buildChannelSummaryColumns(headers) {
  const usedIds = new Map();
  return (Array.isArray(headers) ? headers : [])
    .map((header, index) => ({ label: String(header || '').trim(), index }))
    .filter((item) => item.label)
    .map(({ label, index }) => {
      const known = findKnownChannelSummaryColumn(label);
      const baseId = known?.id || `sheet_${hashChannelSummaryHeader(normalizeChannelSummaryHeaderKey(label) || `column_${index}`)}`;
      const occurrence = (usedIds.get(baseId) || 0) + 1;
      usedIds.set(baseId, occurrence);
      return {
        id: occurrence === 1 ? baseId : `${baseId}_${occurrence}`,
        label,
        index,
        aliases: [label],
        numeric: Boolean(known && CHANNEL_SUMMARY_NUMERIC_COLUMNS.has(known.id)),
      };
    });
}

function getChannelSummaryColumns() {
  return Array.isArray(state.channelSummary.columns) && state.channelSummary.columns.length
    ? state.channelSummary.columns
    : CHANNEL_SUMMARY_COLUMNS;
}

function mapChannelSummaryRowsByHeaders(rows) {
  if (!Array.isArray(rows) || !rows.length) return { columns: [], rows: [] };
  const [headerRow, ...dataRows] = rows;
  const columns = buildChannelSummaryColumns(headerRow || []);
  const mappedRows = dataRows
    .map((row, index) => {
      const record = { id: `sheet_${index}` };
      columns.forEach((column) => {
        const value = row?.[column.index];
        record[column.id] = value !== undefined && value !== null ? String(value).trim() : '';
      });
      return record;
    })
    .filter((row) => columns.some((column) => String(row[column.id] || '').trim()));
  return { columns, rows: mappedRows };
}

function mapChannelSummaryObjectRows(rows, preferredHeaders = []) {
  if (!Array.isArray(rows)) return { columns: [], rows: [] };
  const firstRow = rows.find((row) => row && typeof row === 'object') || {};
  const headers = (Array.isArray(preferredHeaders) && preferredHeaders.length ? preferredHeaders : Object.keys(firstRow))
    .map((header) => String(header || '').trim())
    .filter((header) => header && !header.endsWith('_url'));
  const columns = buildChannelSummaryColumns(headers);
  const mappedRows = rows
    .map((row, index) => {
      const record = { id: `sheet_${index}` };
      columns.forEach((column) => {
        const header = headers[column.index];
        const value = row?.[header];
        record[column.id] = value !== undefined && value !== null ? String(value).trim() : '';
        const url = row?.[`${header}_url`];
        if (url) record[`${column.id}_url`] = String(url).trim();
      });
      return record;
    })
    .filter((row) => columns.some((column) => String(row[column.id] || '').trim()));
  return { columns, rows: mappedRows };
}
function getFilteredChannelSummaryRows() {
  const search = state.channelSummary.search.trim().toLowerCase();
  const filteredRows = state.channelSummary.rows.filter((row) => {
    if (state.channelSummary.channel && row.channel !== state.channelSummary.channel) return false;
    if (state.channelSummary.version && row.version !== state.channelSummary.version) return false;
    if (state.channelSummary.versionChecked && row.versionChecked !== state.channelSummary.versionChecked) return false;
    if (state.channelSummary.jointChannel && row.jointChannel !== state.channelSummary.jointChannel) return false;
    if (state.channelSummary.packageName && row.packageName !== state.channelSummary.packageName) return false;
    if (!search) return true;
    return getChannelSummaryColumns().some((column) => String(row[column.id] || '').toLowerCase().includes(search));
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

function isChannelSummaryNumericColumn(columnId) {
  if (CHANNEL_SUMMARY_NUMERIC_COLUMNS.has(columnId)) return true;
  const column = getChannelSummaryColumns().find((item) => item.id === columnId);
  if (column?.numeric) return true;
  const values = state.channelSummary.rows
    .map((row) => String(row[columnId] ?? '').trim())
    .filter(Boolean);
  return values.length > 0 && values.every((value) => Number.isFinite(Number(value.replace(/,/g, ''))));
}
function compareChannelSummaryRows(rowA, rowB) {
  const { sortKey, sortDirection } = state.channelSummary;
  const numeric = isChannelSummaryNumericColumn(sortKey);
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

function getRowCellUrl(row, header) {
  const explicit = String(row[`${header}_url`] || row[`${header}Url`] || '').trim();
  if (explicit) return explicit;
  const value = String(row[header] || '').trim();
  if (/^https?:\/\//i.test(value)) return value;
  return '';
}

function toNumericValue(value) {
  const cleaned = String(value ?? '').replace(/,/g, '').trim();

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function formatSummaryNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function updateChannelSummaryTotals(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const totalNew = list.reduce((sum, row) => sum + toNumericValue(row.yesterdayNew), 0);
  const totalDau = list.reduce((sum, row) => sum + toNumericValue(row.yesterdayDau), 0);
  const totalRecharge = list.reduce((sum, row) => sum + toNumericValue(row.yesterdayRecharge), 0);
  if (els.channelSummaryYesterdayNewTotal) els.channelSummaryYesterdayNewTotal.textContent = formatSummaryNumber(totalNew);
  if (els.channelSummaryYesterdayDauTotal) els.channelSummaryYesterdayDauTotal.textContent = formatSummaryNumber(totalDau);
  if (els.channelSummaryYesterdayRechargeTotal) els.channelSummaryYesterdayRechargeTotal.textContent = formatSummaryNumber(totalRecharge);
}

// 渲染更新列表的表頭
function renderUpdateListHead() {
  if (!els.updateListTableHead) return;
  const tr = document.createElement('tr');
  // 使用 state.updateList.headers 動態渲染欄位
  const headers = (Array.isArray(state.updateList.headers) ? state.updateList.headers : [])
    .filter((header) => !String(header).endsWith('_url'));
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

  if (els.updateListSyncMode) {
    els.updateListSyncMode.value = state.data.updateListSync?.mode || 'apps-script';
  }
  if (els.updateListSyncUrl) {
    els.updateListSyncUrl.value = state.data.updateListSync?.url || '';
  }

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
  const headers = (Array.isArray(state.updateList.headers) ? state.updateList.headers : [])
    .filter((header) => !String(header).endsWith('_url'));
  filteredRows.forEach((row) => {
    const tr = document.createElement('tr');
    headers.forEach((header) => {
      const td = document.createElement('td');
      const value = row[header] || '';
      const url = getRowCellUrl(row, header);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'sheet-link';
        link.textContent = String(value || '連結').trim() || '連結';
        td.appendChild(link);
      } else {
        td.textContent = value;
      }
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
  updateChannelSummaryTotals(filteredRows);

  if (state.channelSummary.loading) {
    els.channelSummarySyncStatus.textContent = '同步中';
  } else if (state.channelSummary.lastFetchedAt) {
    els.channelSummarySyncStatus.textContent = `更新 ${new Date(state.channelSummary.lastFetchedAt).toLocaleTimeString('zh-Hant', { hour: '2-digit', minute: '2-digit' })}・${getChannelSummaryColumns().length} 欄`;
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
    getChannelSummaryColumns().forEach((column) => {
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
  getChannelSummaryColumns().forEach((column) => {
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
  if (!els.channelSummaryChannelFilter || !els.channelSummaryVersionFilter || !els.channelSummaryConfirmFilter || !els.channelSummaryJointChannelFilter || !els.channelSummaryPackageNameFilter) return;

  const channels = [...new Set(state.channelSummary.rows.map((row) => row.channel).filter(Boolean))];
  const versions = [...new Set(state.channelSummary.rows.map((row) => row.version).filter(Boolean))];
  const checks = [...new Set(state.channelSummary.rows.map((row) => row.versionChecked).filter(Boolean))];
  const jointChannels = [...new Set(state.channelSummary.rows.map((row) => row.jointChannel).filter(Boolean))];
  const packageNames = [...new Set(state.channelSummary.rows.map((row) => row.packageName).filter(Boolean))];

  fillSelectOptions(els.channelSummaryChannelFilter, '全部渠道', channels, state.channelSummary.channel);
  fillSelectOptions(els.channelSummaryVersionFilter, '全部版本', versions, state.channelSummary.version);
  fillSelectOptions(els.channelSummaryConfirmFilter, '全部確認狀態', checks, state.channelSummary.versionChecked);
  fillSelectOptions(els.channelSummaryJointChannelFilter, '全部聯運渠道', jointChannels, state.channelSummary.jointChannel);
  fillSelectOptions(els.channelSummaryPackageNameFilter, '全部包名稱', packageNames, state.channelSummary.packageName);
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
  const hiddenIds = new Set(state.data.hiddenChannelRows || []);
  const hiddenKeys = getEffectiveHiddenChannelKeySet();
  const channels = currentBatchChannels.filter((channel) => {
    const key = getChannelPermanentKey(channel);
    return !hiddenIds.has(channel.id) && !(key && hiddenKeys.has(key));
  });
  const hiddenCount = getHiddenChannelCount();
  els.channelTotalCount.textContent = String(allChannels.length);
  if (els.channelHiddenCount) {
    els.channelHiddenCount.textContent = String(hiddenCount);
  }
  if (els.restoreHiddenChannelsBtn) {
    els.restoreHiddenChannelsBtn.disabled = !hiddenCount;
  }
  if (els.hideSelectedChannelsBtn) {
    els.hideSelectedChannelsBtn.disabled = !(state.selectedChannelIds && state.selectedChannelIds.size);
  }
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
    // 顯示空白訊息的欄位寬度：若非截圖模式，還需要為勾選欄與操作欄預留欄位
    row.innerHTML = `<td colspan="${visibleColumns.length + (state.captureMode ? 0 : 2)}">目前沒有渠道資料，按「新增紀錄」即可開始。</td>`;
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
    // 勾選欄：非截圖模式下加入勾選框，可計算金額加總
    if (!state.captureMode) {
      const selectTd = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'channel-select-checkbox';
      // 若此渠道已被勾選，維持勾選狀態
      if (state.selectedChannelIds && state.selectedChannelIds.has(channel.id)) {
        checkbox.checked = true;
      }
      selectTd.appendChild(checkbox);
      tr.appendChild(selectTd);
    }
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
  // 每次重繪表格後更新勾選加總
  updateSelectedChannelSum();
}

function renderChannelHead() {
  const tr = document.createElement('tr');
  const visibleColumns = getVisibleColumns('channels');
  // 第一欄：勾選列，不在截圖模式下才顯示
  if (!state.captureMode) {
    const selectTh = document.createElement('th');
    selectTh.textContent = '';
    selectTh.className = 'channel-select-header';
    applyStoredColumnWidth(selectTh, 'channel:select');
    attachResizeHandle(selectTh, 'channel:select');
    tr.appendChild(selectTh);
  }
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
  // 操作欄：非截圖模式下顯示
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
  // 每列備註只顯示該批次自己的內容；新增批次不自動帶入舊備註
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
  // 非截圖模式最前面有一欄 checkbox，因此實際欄位 index 需要往後補 1，
  // 避免把「處理結果」的色系套到「最新金額」、把「狀態」的色系套到「來源」。
  const columnOffset = state.captureMode ? 0 : 1;
  const resultCell = resultIndex >= 0 ? row.children[resultIndex + columnOffset] : null;
  const statusCell = statusIndex >= 0 ? row.children[statusIndex + columnOffset] : null;
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
    // 新增批次時不要帶入上一批每列備註
    note: '',
  }));

  state.data.channels.unshift(...duplicatedRows);
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

  // 若刪除的渠道被勾選，從集合中移除並更新加總
  if (state.selectedChannelIds) {
    state.selectedChannelIds.delete(id);
  }
  if (Array.isArray(state.data.hiddenChannelRows)) {
    state.data.hiddenChannelRows = state.data.hiddenChannelRows.filter((hiddenId) => hiddenId !== id);
  }
  updateSelectedChannelSum();
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


function getPermanentChannelRowNote(channel) {
  const key = getChannelPermanentKey(channel);
  if (!key) return channel?.note || '';
  return state.data.channelPermanentRowNotes?.[key] || channel?.note || '';
}

function savePermanentChannelRowNote(channel, value) {
  const key = getChannelPermanentKey(channel);
  if (!key) return;
  if (!state.data.channelPermanentRowNotes || typeof state.data.channelPermanentRowNotes !== 'object') {
    state.data.channelPermanentRowNotes = {};
  }
  const nextValue = String(value ?? '');
  if (nextValue.trim()) {
    state.data.channelPermanentRowNotes[key] = nextValue;
  } else {
    delete state.data.channelPermanentRowNotes[key];
  }
}

function applyPermanentChannelRowNotes() {
  // 舊版曾經把每列備註永久化；新版不再自動寫回每列，避免新增批次出現舊備註。
}

function updateChannel(id, field, value) {
  const channel = state.data.channels.find((item) => item.id === id);
  if (!channel) return;

  const oldPermanentKey = getChannelPermanentKey(channel);

  if (field in channel && field !== 'extras') {
    channel[field] = value;
  } else {
    channel.extras[field] = value;
  }

  // 每列備註跟批次資料走，不寫入永久備註，避免新增批次自動帶出舊備註

  maybeAddDropdownValueByField(field, value);
  if (field !== 'updatedAt') {
    channel.updatedAt = els.channelBatchTime.value || channel.updatedAt || toDateTimeLocalValue(new Date());
  }
  saveState();
  render();

  // 若渠道資料有更新，可能影響勾選金額總和，故重新計算
  updateSelectedChannelSum();
}

function getEffectiveHiddenChannelKeySet() {
  const hiddenIds = new Set(state.data.hiddenChannelRows || []);
  const hiddenKeys = new Set(state.data.hiddenChannelKeys || []);
  state.data.channels.forEach((channel) => {
    if (hiddenIds.has(channel.id)) {
      const key = getChannelPermanentKey(channel);
      if (key) hiddenKeys.add(key);
    }
  });
  return hiddenKeys;
}

function getHiddenChannelCount() {
  return getEffectiveHiddenChannelKeySet().size || (state.data.hiddenChannelRows || []).length;
}

// 更新勾選的渠道 ID 並重新計算最新金額加總
function updateSelectedChannel(id, selected) {
  if (!state.selectedChannelIds) {
    state.selectedChannelIds = new Set();
  }
  if (selected) {
    state.selectedChannelIds.add(id);
  } else {
    state.selectedChannelIds.delete(id);
  }
  updateSelectedChannelSum();
}

// 重新計算勾選的渠道最新金額加總並更新 UI
function updateSelectedChannelSum() {
  let sum = 0;
  if (state.selectedChannelIds && state.selectedChannelIds.size) {
    for (const cid of state.selectedChannelIds) {
      const channel = state.data.channels.find((item) => item.id === cid);
      if (channel) {
        // 將字串轉成數字，移除逗號
        const num = parseFloat(String(channel.amount || '').replace(/,/g, ''));
        if (!isNaN(num)) sum += num;
      }
    }
  }
  if (els.channelSelectedSum) {
    els.channelSelectedSum.textContent = sum ? sum.toLocaleString() : '0';
  }
  if (els.hideSelectedChannelsBtn) {
    els.hideSelectedChannelsBtn.disabled = !(state.selectedChannelIds && state.selectedChannelIds.size);
  }
  const hiddenCount = getHiddenChannelCount();
  if (els.channelHiddenCount) {
    els.channelHiddenCount.textContent = String(hiddenCount);
  }
  if (els.restoreHiddenChannelsBtn) {
    els.restoreHiddenChannelsBtn.disabled = !hiddenCount;
  }
}

// 將目前勾選的渠道列隱藏；資料仍保留，只是不顯示在表格與截圖模式中
function hideSelectedChannels() {
  if (!state.selectedChannelIds || !state.selectedChannelIds.size) return;
  if (!Array.isArray(state.data.hiddenChannelRows)) {
    state.data.hiddenChannelRows = [];
  }
  if (!Array.isArray(state.data.hiddenChannelKeys)) {
    state.data.hiddenChannelKeys = [];
  }

  const existingIds = new Set(state.data.hiddenChannelRows);
  const existingKeys = new Set(state.data.hiddenChannelKeys);
  state.selectedChannelIds.forEach((id) => {
    existingIds.add(id);
    const channel = state.data.channels.find((item) => item.id === id);
    const key = getChannelPermanentKey(channel);
    if (key) existingKeys.add(key);
  });
  state.data.hiddenChannelRows = [...existingIds];
  state.data.hiddenChannelKeys = [...existingKeys];
  state.selectedChannelIds.clear();
  saveState();
  render();
}

// 恢復所有已隱藏渠道列
function restoreHiddenChannels() {
  state.data.hiddenChannelRows = [];
  state.data.hiddenChannelKeys = [];
  if (state.selectedChannelIds) {
    state.selectedChannelIds.clear();
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
  // 永久備註：不再依照批次時間切換，新增批次後仍保留
  els.channelBatchNote.value = state.data.channelPermanentNote || '';
}

function updateChannelBatchNote(value) {
  // 永久備註：直接存在全域欄位，不跟 batchTime 綁定
  state.data.channelPermanentNote = String(value ?? '');
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
  if (column.id === 'note') return getPermanentChannelRowNote(channel);
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
  els.addFieldFromModalBtn.hidden = tableType === 'channelSummary';
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
  getChannelSummaryColumns().forEach((column) => {
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

  // 如果操作的是勾選框，更新勾選狀態並重新計算加總
  if (event.target.classList.contains('channel-select-checkbox')) {
    updateSelectedChannel(row.dataset.id, event.target.checked);
    return;
  }

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
if (els.hideSelectedChannelsBtn) {
  els.hideSelectedChannelsBtn.addEventListener('click', hideSelectedChannels);
}
if (els.restoreHiddenChannelsBtn) {
  els.restoreHiddenChannelsBtn.addEventListener('click', restoreHiddenChannels);
}
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
  state.channelSummary.columns = structuredClone(CHANNEL_SUMMARY_COLUMNS);
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
els.channelSummaryJointChannelFilter?.addEventListener('change', () => {
  state.channelSummary.jointChannel = els.channelSummaryJointChannelFilter.value || '';
  renderChannelSummaryView();
});
els.channelSummaryPackageNameFilter?.addEventListener('change', () => {
  state.channelSummary.packageName = els.channelSummaryPackageNameFilter.value || '';
  renderChannelSummaryView();
});
els.channelSummaryClearBtn?.addEventListener('click', () => {
  state.channelSummary.search = '';
  state.channelSummary.channel = '';
  state.channelSummary.version = '';
  state.channelSummary.versionChecked = '';
  state.channelSummary.jointChannel = '';
  state.channelSummary.packageName = '';
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
    state.channelSummary.sortDirection = isChannelSummaryNumericColumn(sortKey) ? 'desc' : 'asc';
  }

  renderChannelSummaryView();
});
// 更新列表：重新整理、搜尋、排序與清除條件
els.updateListRefreshBtn?.addEventListener('click', () => {
  void refreshUpdateList();
});
els.updateListSyncSaveBtn?.addEventListener('click', () => {
  state.data.updateListSync = {
    mode: els.updateListSyncMode?.value || 'apps-script',
    url: String(els.updateListSyncUrl?.value || '').trim(),
  };
  saveState();
  state.updateList.headers = [];
  state.updateList.rows = [];
  state.updateList.error = '';
  state.updateList.lastFetchedAt = 0;
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

els.dataBackupExportBtn?.addEventListener('click', exportDashboardBackup);
els.dataBackupImportBtn?.addEventListener('click', () => els.dataBackupFile?.click());
els.dataBackupFile?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  importDashboardBackup(file);
  event.target.value = '';
});

els.stickyNotesToggle?.addEventListener('click', () => { state.stickyNotesOpen = !state.stickyNotesOpen; renderStickyNotes(); });
els.stickyNotesCloseBtn?.addEventListener('click', () => { state.stickyNotesOpen = false; renderStickyNotes(); });
els.stickyNoteAddBtn?.addEventListener('click', addStickyNote);
els.stickyNotesActiveTab?.addEventListener('click', () => { state.stickyNotesView = 'active'; renderStickyNotes(); });
els.stickyNotesArchiveTab?.addEventListener('click', () => { state.stickyNotesView = 'archive'; renderStickyNotes(); });
els.stickyNotesSearch?.addEventListener('input', (event) => { state.stickyNotesSearch = event.target.value; renderStickyNotes(); });
els.stickyNotesList?.addEventListener('input', (event) => { const card = event.target.closest('[data-id]'); if (card && event.target.matches('[data-action="edit-sticky-note"]')) updateStickyNote(card.dataset.id, { text: event.target.value }); });
els.stickyNotesList?.addEventListener('change', (event) => {
  const card = event.target.closest('[data-id]'); if (!card) return;
  if (event.target.matches('[data-action="complete-sticky-note"]')) {
    updateStickyNote(card.dataset.id, {
      completed: event.target.checked,
      completedAt: event.target.checked ? new Date().toISOString() : '',
    });
    renderStickyNotes();
  }
  if (event.target.matches('[data-action="color-sticky-note"]')) { updateStickyNote(card.dataset.id, { color: event.target.value }); renderStickyNotes(); }
});
els.stickyNotesList?.addEventListener('click', (event) => { const card = event.target.closest('[data-id]'); if (card && event.target.matches('[data-action="delete-sticky-note"]') && confirm('要刪除這張便利貼嗎？')) deleteStickyNote(card.dataset.id); });

render();

function persistDialogDbRootFix() {
  try {
    if (typeof state !== 'undefined' && state.data && state.data.dialogDb) {
      localStorage.setItem('local-dashboard-app-v1', JSON.stringify(state.data));
      localStorage.setItem('local-dashboard-app-v1-backup', JSON.stringify(state.data));
      localStorage.setItem('dialogDbRootFixBackup', JSON.stringify(state.data.dialogDb));
    }
  } catch (error) {
    console.error('dialogDb persist failed', error);
  }
}

/* 對話資料庫：分類 / 多語言 / TAG / 收藏 / 最近使用 */
(function () {
  let dialogEditorDirty = false;
  function ensureDialogState() {
    state.data.dialogDb = state.data.dialogDb || {
      categories: ['提款', '充值', '客服', '活動', '風控', 'VIP', '補單'],
      templates: [],
      selectedCategory: '全部',
      selectedId: '',
      recentIds: [],
    };
  }

  function safeText(value) {
    return String(value ?? '');
  }

  function uidDialog() {
    return 'dlg_' + Date.now() + '_' + Math.random().toString(16).slice(2);
  }

  function copyDialogText(text) {
    const value = safeText(text);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value);
    } else {
      const temp = document.createElement('textarea');
      temp.value = value;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }
  }

  function completeMissingDialogLanguages() {
    ensureDialogState();
    const completions = [
      {
        matches: ['提款駁回'],
        zh: '您好～訂單 8004876971 已駁回，請您重新提交提款申請即可。其餘兩筆訂單，我們已請廠商加速處理中，還請您耐心等候～感謝您的回饋與配合 🙏',
        en: 'Hello~ Order 8004876971 has been rejected. Please resubmit your withdrawal request. For the other two orders, we have asked the service provider to expedite the processing. Please wait patiently. Thank you for your feedback and cooperation. 🙏',
        hi: 'नमस्ते~ ऑर्डर 8004876971 अस्वीकृत कर दिया गया है। कृपया निकासी अनुरोध दोबारा जमा करें। अन्य दो ऑर्डरों के लिए हमने सेवा प्रदाता से प्रक्रिया तेज करने को कहा है। कृपया धैर्यपूर्वक प्रतीक्षा करें~ आपके सहयोग और समझ के लिए धन्यवाद। 🙏',
      },
      {
        matches: ['加速存款'],
        zh: '我們已請廠商加速處理您的存款到帳流程，還請您耐心等候～感謝您的回饋與配合 🙏',
        en: 'We have asked the service provider to expedite the processing of your deposit. Please wait patiently. Thank you for your feedback and cooperation. 🙏',
        hi: 'हमने सेवा प्रदाता से आपकी जमा राशि को खाते में जमा करने की प्रक्रिया तेज करने का अनुरोध किया है। कृपया धैर्यपूर्वक प्रतीक्षा करें~ आपकी प्रतिक्रिया और सहयोग के लिए धन्यवाद। 🙏',
      },
      {
        matches: ['查詢代收', '已完成'],
        zh: '我們查詢到該筆提款已完成。若您確認尚未收到款項，請告知是哪一筆提款未到帳，並提供該時段的銀行對帳單（PDF 格式），以便我們進一步查詢。',
        en: 'We found that the withdrawal has been completed. If you confirm that the funds were not received, please let us know which withdrawal was not received and provide a bank statement (PDF format) covering the relevant time period for further investigation.',
        hi: 'हमने पाया कि निकासी पूरी हो चुकी है। यदि आपको राशि प्राप्त नहीं हुई है, तो कृपया बताएं कि कौन-सी निकासी प्राप्त नहीं हुई और संबंधित अवधि का बैंक स्टेटमेंट (PDF प्रारूप में) प्रदान करें, ताकि हम आगे जाँच कर सकें।',
      },
    ];
    let filled = 0;

    state.data.dialogDb.templates.forEach((item) => {
      const rule = completions.find((entry) =>
        entry.matches.every((keyword) => String(item.title || '').includes(keyword))
      );
      if (!rule) return;

      let itemChanged = false;
      ['zh', 'en', 'hi'].forEach((field) => {
        if (!String(item[field] || '').trim()) {
          item[field] = rule[field];
          filled += 1;
          itemChanged = true;
        }
      });
      if (itemChanged) item.updatedAt = new Date().toISOString();
    });

    if (filled) {
      saveState();
      persistDialogDbRootFix();
    }
    return filled;
  }

  function renderDialogCategoryManager() {
    ensureDialogState();
    const list = document.getElementById('dialog-category-manager-list');
    if (!list) return;
    list.replaceChildren();

    if (!state.data.dialogDb.categories.length) {
      const empty = document.createElement('div');
      empty.className = 'dialog-template-empty';
      empty.textContent = '目前沒有自訂分類';
      list.appendChild(empty);
      return;
    }

    state.data.dialogDb.categories.forEach((category) => {
      const row = document.createElement('div');
      row.className = 'dialog-category-manager-row';
      row.dataset.dialogManagerCategory = category;

      const input = document.createElement('input');
      input.type = 'text';
      input.value = category;
      input.setAttribute('aria-label', `${category} 分類名稱`);

      const saveButton = document.createElement('button');
      saveButton.className = 'secondary-button';
      saveButton.type = 'button';
      saveButton.dataset.dialogManagerAction = 'save';
      saveButton.textContent = '儲存名稱';

      const deleteButton = document.createElement('button');
      deleteButton.className = 'danger-button';
      deleteButton.type = 'button';
      deleteButton.dataset.dialogManagerAction = 'delete';
      deleteButton.textContent = '刪除分類';

      row.append(input, saveButton, deleteButton);
      list.appendChild(row);
    });
  }

  function saveManagedDialogCategory(row) {
    const oldName = row?.dataset.dialogManagerCategory || '';
    const input = row?.querySelector('input');
    const newName = input?.value.trim() || '';
    if (!oldName || !newName) {
      alert('分類名稱不能留空。');
      input?.focus();
      return;
    }
    if (oldName === newName) return;
    if (state.data.dialogDb.categories.includes(newName)) {
      alert('此分類名稱已存在。');
      input?.focus();
      return;
    }

    state.data.dialogDb.categories = state.data.dialogDb.categories.map((category) =>
      category === oldName ? newName : category
    );
    state.data.dialogDb.templates.forEach((item) => {
      if (item.category === oldName) item.category = newName;
    });
    if (state.data.dialogDb.selectedCategory === oldName) {
      state.data.dialogDb.selectedCategory = newName;
    }
    saveState();
    persistDialogDbRootFix();
    renderDialogDb();
    renderDialogCategoryManager();
  }
  function exportDialogDbOnly() {
    ensureDialogState();
    const payload = {
      type: 'dialog-db-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      dialogDb: normalizeDialogDb(state.data.dialogDb),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = URL.createObjectURL(blob);
    link.download = `dialog-db-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    setDialogEditorStatus('對話資料已匯出', 'saved');
  }

  function importDialogDbOnly(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const source = parsed?.dialogDb || parsed;
        if (!source || (!Array.isArray(source.templates) && !Array.isArray(source.categories))) {
          throw new Error('invalid-dialog-backup');
        }
        const incoming = normalizeDialogDb(source);
        const current = normalizeDialogDb(state.data.dialogDb);
        const mergedTemplates = new Map(current.templates.map((item) => [item.id, item]));
        incoming.templates.forEach((item) => mergedTemplates.set(item.id, item));
        state.data.dialogDb = normalizeDialogDb({
          ...current,
          categories: [...new Set([...current.categories, ...incoming.categories])],
          templates: [...mergedTemplates.values()],
          selectedId: incoming.templates[0]?.id || current.selectedId,
          recentIds: [...new Set([...incoming.recentIds, ...current.recentIds])].slice(0, 20),
        });
        dialogEditorDirty = false;
        saveState();
        persistDialogDbRootFix();
        renderDialogDb();
        setDialogEditorStatus(`已匯入 ${incoming.templates.length} 筆話術`, 'saved');
        alert(`對話資料匯入完成，共讀取 ${incoming.templates.length} 筆；其他頁面資料沒有變更。`);
      } catch (error) {
        alert('匯入失敗：請選擇由「匯出話術」產生的 JSON 檔案。');
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  function getDialogEls() {
    return {
      categoryList: document.getElementById('dialog-category-list'),
      templateList: document.getElementById('dialog-template-list'),
      search: document.getElementById('dialog-search'),
      title: document.getElementById('dialog-title'),
      category: document.getElementById('dialog-category-input'),
      tags: document.getElementById('dialog-tags'),
      zh: document.getElementById('dialog-zh'),
      en: document.getElementById('dialog-en'),
      hi: document.getElementById('dialog-hi'),
      note: document.getElementById('dialog-note'),
      categoryCount: document.getElementById('dialog-category-count'),
      templateCount: document.getElementById('dialog-template-count'),
      editorStatus: document.getElementById('dialog-editor-status'),
    };
  }

  
  function setDialogEditorStatus(message, tone = '') {
    const status = document.getElementById('dialog-editor-status');
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function confirmDiscardDialogChanges() {
    if (!dialogEditorDirty) return true;
    return confirm('目前有尚未儲存的修改，要放棄這些修改嗎？');
  }

  function renderDialogCategorySelect(selectedValue = '') {
    ensureDialogState();
    const select = document.getElementById('dialog-category-input');
    if (!select) return;

    const categories = [...new Set([...(state.data.dialogDb.categories || []), '未分類'])];
    const currentValue = selectedValue || select.value || '';

    select.innerHTML = categories.map((cat) => {
      const selected = cat === currentValue ? 'selected' : '';
      return `<option value="${cat}" ${selected}>${cat}</option>`;
    }).join('');

    if (currentValue && !categories.includes(currentValue)) {
      const option = document.createElement('option');
      option.value = currentValue;
      option.textContent = currentValue;
      option.selected = true;
      select.appendChild(option);
    }
  }


  function getSelectedDialogTemplate() {
    ensureDialogState();
    return state.data.dialogDb.templates.find((item) => item.id === state.data.dialogDb.selectedId) || null;
  }

  function dialogCategoryContainsTemplate(category, item) {
    if (!item) return false;
    if (category === '\u5168\u90e8') return true;
    if (category === '\u6536\u85cf') return Boolean(item.favorite);
    if (category === '\u6700\u8fd1\u4f7f\u7528') return (state.data.dialogDb.recentIds || []).includes(item.id);
    return item.category === category;
  }

  function setDialogRecent(id) {
    ensureDialogState();
    state.data.dialogDb.recentIds = [id, ...(state.data.dialogDb.recentIds || []).filter((item) => item !== id)].slice(0, 20);
    saveState();
  }

  function selectDialogTemplate(id) {
    ensureDialogState();
    if (id !== state.data.dialogDb.selectedId && !confirmDiscardDialogChanges()) return;
    dialogEditorDirty = false;
    state.data.dialogDb.selectedId = id;
    setDialogRecent(id);
    saveState();
    renderDialogDb();
  }

  function fillDialogEditor(item) {
    const els = getDialogEls();
    if (!els.title) return;

    els.title.value = item?.title || '';
    renderDialogCategorySelect(item?.category || state.data.dialogDb.selectedCategory || '未分類');
    els.category.value = item?.category || state.data.dialogDb.selectedCategory || '未分類';
    els.tags.value = (item?.tags || []).join(', ');
    els.zh.value = item?.zh || '';
    els.en.value = item?.en || '';
    els.hi.value = item?.hi || '';
    els.note.value = item?.note || '';
    dialogEditorDirty = false;
    setDialogEditorStatus(item ? '已載入，可直接編輯' : '新增模式：填寫後再儲存', item ? 'ready' : 'draft');
  }

  function saveDialogTemplate() {
    ensureDialogState();
    const els = getDialogEls();
    if (!els.title) return;

    const title = els.title.value.trim();
    const category = els.category.value.trim() || '未分類';
    const tags = els.tags.value.split(/[,\s，]+/).map((item) => item.trim()).filter(Boolean);
    const zh = els.zh.value.trim();
    const en = els.en.value.trim();
    const hi = els.hi.value.trim();
    const note = els.note.value.trim();

    if (!title && !zh && !en && !hi) {
      alert('請至少輸入標題或內容。');
      return;
    }

    let item = getSelectedDialogTemplate();
    const selectedCategory = state.data.dialogDb.selectedCategory || '\u5168\u90e8';
    if (item && !dialogCategoryContainsTemplate(selectedCategory, item)) {
      item = null;
      state.data.dialogDb.selectedId = '';
    }
    if (!item) {
      item = { id: uidDialog(), createdAt: new Date().toISOString(), favorite: false };
      state.data.dialogDb.templates.unshift(item);
      state.data.dialogDb.selectedId = item.id;
    }

    item.title = title || '未命名話術';
    item.category = category;
    item.tags = tags;
    item.zh = zh;
    item.en = en;
    item.hi = hi;
    item.note = note;
    item.updatedAt = new Date().toISOString();

    if (!state.data.dialogDb.categories.includes(category)) {
      state.data.dialogDb.categories.push(category);
    }

    dialogEditorDirty = false;
    saveState();
    persistDialogDbRootFix();
    renderDialogDb();
    setDialogEditorStatus('已儲存 ' + new Date().toLocaleTimeString('zh-Hant', { hour: '2-digit', minute: '2-digit' }), 'saved');
  }

  function deleteDialogTemplate() {
    ensureDialogState();
    const item = getSelectedDialogTemplate();
    if (!item) return alert('請先選擇話術。');
    if (!confirm('確定刪除此話術？')) return;

    state.data.dialogDb.templates = state.data.dialogDb.templates.filter((row) => row.id !== item.id);
    state.data.dialogDb.selectedId = '';
    dialogEditorDirty = false;
    saveState();
    renderDialogDb();
  }

  function toggleDialogFavorite() {
    const item = getSelectedDialogTemplate();
    if (!item) return alert('請先選擇話術。');
    item.favorite = !item.favorite;
    saveState();
    renderDialogDb();
  }

  function addDialogCategory() {
    ensureDialogState();

    const name = prompt('請輸入新分類名稱：');
    if (!name) return;
    const clean = name.trim();
    if (!clean) return;
    if (!state.data.dialogDb.categories.includes(clean)) {
      state.data.dialogDb.categories.push(clean);
      state.data.dialogDb.selectedCategory = clean;
      saveState();
      renderDialogDb();
    }
  }

  function renameDialogCategory(oldName) {
    ensureDialogState();
    if (oldName === '全部' || oldName === '收藏' || oldName === '最近使用') return;
    const name = prompt('修改分類名稱：', oldName);
    if (!name) return;
    const clean = name.trim();
    if (!clean) return;

    state.data.dialogDb.categories = state.data.dialogDb.categories.map((cat) => cat === oldName ? clean : cat);
    state.data.dialogDb.templates.forEach((item) => {
      if (item.category === oldName) item.category = clean;
    });
    if (state.data.dialogDb.selectedCategory === oldName) state.data.dialogDb.selectedCategory = clean;

    saveState();
    renderDialogDb();
  }

  function removeDialogCategory(name) {
    ensureDialogState();
    if (!confirm('刪除分類不會刪話術，分類內話術會改成「未分類」。確定？')) return;
    state.data.dialogDb.categories = state.data.dialogDb.categories.filter((cat) => cat !== name);
    state.data.dialogDb.templates.forEach((item) => {
      if (item.category === name) item.category = '未分類';
    });
    state.data.dialogDb.selectedCategory = '全部';
    saveState();
    renderDialogDb();
  }

  function addDialogTemplate() {
    ensureDialogState();
    if (!confirmDiscardDialogChanges()) return;
    const category = state.data.dialogDb.selectedCategory && !['全部', '收藏', '最近使用'].includes(state.data.dialogDb.selectedCategory)
      ? state.data.dialogDb.selectedCategory
      : '未分類';
    dialogEditorDirty = false;
    state.data.dialogDb.selectedId = '';
    fillDialogEditor({ category, title: '', tags: [], zh: '', en: '', hi: '', note: '' });
    document.getElementById('dialog-title')?.focus();
    setDialogEditorStatus('新增模式：填寫完成後按「儲存話術」', 'draft');
  }

  function selectDialogCategory(category) {
    ensureDialogState();
    if (category === state.data.dialogDb.selectedCategory) return;
    if (!confirmDiscardDialogChanges()) return;

    dialogEditorDirty = false;
    state.data.dialogDb.selectedCategory = category;
    state.data.dialogDb.selectedId = '';
    saveState();
    renderDialogDb();
  }

  function filteredDialogTemplates() {
    ensureDialogState();
    const els = getDialogEls();
    const keyword = (els.search?.value || '').trim().toLowerCase();
    const cat = state.data.dialogDb.selectedCategory || '全部';

    return state.data.dialogDb.templates.filter((item) => {
      let hitCategory = true;
      if (cat === '收藏') hitCategory = !!item.favorite;
      else if (cat === '最近使用') hitCategory = (state.data.dialogDb.recentIds || []).includes(item.id);
      else if (cat !== '全部') hitCategory = item.category === cat;

      const text = [
        item.title,
        item.category,
        (item.tags || []).join(' '),
        item.zh,
        item.en,
        item.hi,
        item.note,
      ].join(' ').toLowerCase();

      return hitCategory && (!keyword || text.includes(keyword));
    }).sort((a, b) => {
      if (cat === '最近使用') {
        return (state.data.dialogDb.recentIds || []).indexOf(a.id) - (state.data.dialogDb.recentIds || []).indexOf(b.id);
      }
      return 0;
    });
  }

  window.renderDialogDb = function renderDialogDb() {
    ensureDialogState();
    const els = getDialogEls();
    if (!els.categoryList || !els.templateList) return;

    const fixedCats = ['全部', '收藏', '最近使用'];
    const categories = [...fixedCats, ...state.data.dialogDb.categories];

    els.categoryList.innerHTML = categories.map((cat) => {
      const active = state.data.dialogDb.selectedCategory === cat ? ' is-active' : '';

      const count = cat === '全部'
        ? state.data.dialogDb.templates.length
        : cat === '收藏'
          ? state.data.dialogDb.templates.filter((item) => item.favorite).length
          : cat === '最近使用'
            ? (state.data.dialogDb.recentIds || []).length
            : state.data.dialogDb.templates.filter((item) => item.category === cat).length;

      return `
        <div class="dialog-category${active}" data-dialog-category="${cat}">
          <span class="dialog-cat-name">${cat}</span>
          <small>${count}</small>

        </div>
      `;
    }).join('');

    const rows = filteredDialogTemplates();
    els.templateList.innerHTML = rows.length ? rows.map((item) => {
      const active = state.data.dialogDb.selectedId === item.id ? ' is-active' : '';
      const tags = (item.tags || []).slice(0, 3).map((tag) => `<em>${tag}</em>`).join('');
      const preview = String(item.zh || item.en || item.hi || item.note || '').replace(/\s+/g, ' ').slice(0, 72);
      return `
        <div class="dialog-template-item${active}" data-dialog-template-id="${item.id}">
          <div class="dialog-template-title-row"><strong>${item.favorite ? '★ ' : ''}${item.title || '未命名話術'}</strong><span>${item.category || '未分類'}</span></div>
          ${preview ? `<p>${preview}${preview.length >= 72 ? '…' : ''}</p>` : ''}
          <div class="dialog-template-tags">${tags}</div>
        </div>
      `;
    }).join('') : '<div class="dialog-template-empty">沒有符合條件的話術</div>';

    els.categoryCount && (els.categoryCount.textContent = state.data.dialogDb.categories.length);
    els.templateCount && (els.templateCount.textContent = state.data.dialogDb.templates.length);

    if (!dialogEditorDirty) {
      const selectedItem = getSelectedDialogTemplate();
      if (selectedItem && !dialogCategoryContainsTemplate(state.data.dialogDb.selectedCategory || '\u5168\u90e8', selectedItem)) {
        state.data.dialogDb.selectedId = '';
        saveState();
        fillDialogEditor(null);
      } else {
        fillDialogEditor(selectedItem);
      }
    }
  };

  
function ensureDialogNavButton() {
    const nav = document.querySelector('.nav');
    const btn = document.querySelector('[data-view="conversation-db"]');
    const editToggle = document.getElementById('nav-edit-toggle');
    if (!nav || !btn) return;
    if (editToggle) nav.insertBefore(btn, editToggle);
    else nav.appendChild(btn);
}


  document.addEventListener('click', (event) => {

    const cat = event.target.closest('[data-dialog-category]');
    if (cat) {
      selectDialogCategory(cat.dataset.dialogCategory);
      return;
    }

    const item = event.target.closest('[data-dialog-template-id]');
    if (item) {
      selectDialogTemplate(item.dataset.dialogTemplateId);
      return;
    }

    const navBtn = event.target.closest('[data-view="conversation-db"]');
    if (navBtn) {
      setTimeout(renderDialogDb, 0);
    }
  });



  document.addEventListener('DOMContentLoaded', () => {
    try {
      const hasTemplates = state.data.dialogDb?.templates?.length > 0;
      if (!hasTemplates) {
        const backupKeys = ['dialogDbRootFixBackup', 'dialogDbAutoPersist', 'selfuse3_dialog_db_v1'];
        for (const key of backupKeys) {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const recovered = normalizeDialogDb(JSON.parse(raw));
          if (recovered.templates.length || recovered.categories.length) {
            state.data.dialogDb = recovered;
            saveState();
            break;
          }
        }
      }
    } catch (error) {
      console.warn('對話資料庫舊備份讀取失敗', error);
    }
    ensureDialogState();
    const filledLanguages = completeMissingDialogLanguages();
    ensureDialogNavButton();

    document.getElementById('dialog-add-category-btn')?.addEventListener('click', addDialogCategory);
    document.getElementById('dialog-add-template-btn')?.addEventListener('click', addDialogTemplate);
    document.getElementById('dialog-save-btn')?.addEventListener('click', saveDialogTemplate);
    document.getElementById('dialog-delete-btn')?.addEventListener('click', deleteDialogTemplate);
    document.getElementById('dialog-favorite-btn')?.addEventListener('click', toggleDialogFavorite);
    document.getElementById('dialog-search')?.addEventListener('input', renderDialogDb);
    document.getElementById('dialog-clear-search-btn')?.addEventListener('click', () => {
      const search = document.getElementById('dialog-search');
      if (search) search.value = '';
      renderDialogDb();
      search?.focus();
    });
    document.getElementById('dialog-export-btn')?.addEventListener('click', exportDialogDbOnly);
    document.getElementById('dialog-import-btn')?.addEventListener('click', () => document.getElementById('dialog-import-file')?.click());
    document.getElementById('dialog-import-file')?.addEventListener('change', (event) => {
      importDialogDbOnly(event.target.files?.[0]);
      event.target.value = '';
    });

    const categoryManager = document.getElementById('dialog-category-manager');
    document.getElementById('dialog-manage-categories-btn')?.addEventListener('click', () => {
      renderDialogCategoryManager();
      categoryManager?.showModal();
    });
    document.getElementById('dialog-category-manager-close')?.addEventListener('click', () => {
      categoryManager?.close();
    });
    categoryManager?.addEventListener('click', (event) => {
      if (event.target === categoryManager) categoryManager.close();
    });
    document.getElementById('dialog-category-manager-list')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-dialog-manager-action]');
      const row = button?.closest('[data-dialog-manager-category]');
      if (!button || !row) return;

      if (button.dataset.dialogManagerAction === 'save') {
        saveManagedDialogCategory(row);
      } else if (button.dataset.dialogManagerAction === 'delete') {
        removeDialogCategory(row.dataset.dialogManagerCategory);
        renderDialogCategoryManager();
      }
    });
    document.getElementById('dialog-category-manager-list')?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || !event.target.matches('input')) return;
      event.preventDefault();
      saveManagedDialogCategory(event.target.closest('[data-dialog-manager-category]'));
    });

    ['dialog-title', 'dialog-category-input', 'dialog-tags', 'dialog-zh', 'dialog-en', 'dialog-hi', 'dialog-note'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', () => {
        dialogEditorDirty = true;
        setDialogEditorStatus('尚未儲存', 'dirty');
      });
    });

    document.getElementById('dialog-copy-zh-btn')?.addEventListener('click', () => copyDialogText(document.getElementById('dialog-zh')?.value || ''));
    document.getElementById('dialog-copy-en-btn')?.addEventListener('click', () => copyDialogText(document.getElementById('dialog-en')?.value || ''));
    document.getElementById('dialog-copy-hi-btn')?.addEventListener('click', () => copyDialogText(document.getElementById('dialog-hi')?.value || ''));

    setTimeout(() => {
      ensureDialogNavButton();
      renderDialogDb();
      if (filledLanguages) {
        setDialogEditorStatus(`已補齊 ${filledLanguages} 個空白語言欄位`, 'saved');
      }
    }, 100);
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && state.view === 'conversation-db') {
      event.preventDefault();
      saveDialogTemplate();
    }
  });

  const originalRenderForDialogDb = render;
  render = function () {
    originalRenderForDialogDb();
    ensureDialogNavButton();
    renderDialogDb();
  };
})();


window.addEventListener('load', () => {
  setTimeout(() => {
    if (typeof ensureDialogNavButton === 'function') {
      ensureDialogNavButton();
    }
  }, 300);
});

