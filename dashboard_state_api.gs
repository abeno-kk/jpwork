const DASHBOARD_STATE_SHEET_NAME = 'dashboard_state';
const DASHBOARD_STATE_CHUNK_SIZE = 40000;
const DASHBOARD_STATE_SPREADSHEET_ID = '10QR13gBTy2BEicBYhONCnSx7-FshYktZNi58okSH-14';

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const callback = params.callback || '';

  try {
    const state = readDashboardState_();
    return outputDashboardState_({
      ok: true,
      updatedAt: state.updatedAt,
      data: state.data,
    }, callback);
  } catch (error) {
    return outputDashboardState_({
      ok: false,
      error: error && error.message ? error.message : String(error),
    }, callback);
  }
}

function doPost(e) {
  try {
    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(rawBody);
    if (payload.action !== 'save') {
      throw new Error('Unsupported action.');
    }
    if (!payload.data || typeof payload.data !== 'object') {
      throw new Error('Missing dashboard data.');
    }

    const updatedAt = payload.savedAt || new Date().toISOString();
    saveDashboardState_(payload.data, updatedAt);
    return outputDashboardState_({
      ok: true,
      updatedAt,
    }, '');
  } catch (error) {
    return outputDashboardState_({
      ok: false,
      error: error && error.message ? error.message : String(error),
    }, '');
  }
}

function readDashboardState_() {
  const sheet = getDashboardStateSheet_();
  const values = sheet.getDataRange().getValues();
  const map = {};

  values.slice(1).forEach(function(row) {
    const key = String(row[0] || '').trim();
    if (!key) return;
    map[key] = row[1];
  });

  const chunkCount = Number(map.chunks || 0);
  if (!chunkCount) {
    return {
      updatedAt: '',
      data: null,
    };
  }

  let json = '';
  for (let index = 0; index < chunkCount; index += 1) {
    json += String(map['chunk_' + index] || '');
  }

  return {
    updatedAt: String(map.updatedAt || ''),
    data: JSON.parse(json),
  };
}

function saveDashboardState_(data, updatedAt) {
  const sheet = getDashboardStateSheet_();
  const json = JSON.stringify(data);
  const chunks = [];

  for (let index = 0; index < json.length; index += DASHBOARD_STATE_CHUNK_SIZE) {
    chunks.push(json.slice(index, index + DASHBOARD_STATE_CHUNK_SIZE));
  }

  const rows = [
    ['key', 'value'],
    ['updatedAt', updatedAt],
    ['version', '1'],
    ['chunks', String(chunks.length)],
  ];

  chunks.forEach(function(chunk, index) {
    rows.push(['chunk_' + index, chunk]);
  });

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
}

function getDashboardStateSheet_() {
  const spreadsheet = DASHBOARD_STATE_SPREADSHEET_ID
    ? SpreadsheetApp.openById(DASHBOARD_STATE_SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('找不到 Google Sheet，請確認 DASHBOARD_STATE_SPREADSHEET_ID 是否正確。');
  }
  let sheet = spreadsheet.getSheetByName(DASHBOARD_STATE_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(DASHBOARD_STATE_SHEET_NAME);
  }
  sheet.showSheet();
  return sheet;
}

function testDashboardStateWrite() {
  const spreadsheet = DASHBOARD_STATE_SPREADSHEET_ID
    ? SpreadsheetApp.openById(DASHBOARD_STATE_SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  const visibleSheet = spreadsheet.getSheets()[0];
  visibleSheet.getRange('A1:B1').setValues([[
    'dashboard_state_test',
    new Date().toISOString(),
  ]]);
}

function outputDashboardState_(payload, callback) {
  const json = JSON.stringify(payload);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
