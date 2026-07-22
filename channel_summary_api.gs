const SPREADSHEET_ID = '1B298mjXY1HBAz4ohtNr1pletE9xTE44uYzL0932RRFU';

const SHEETS = {
  channel: {
    gid: 1318283124,
    name: '渠道APPID總表-測試',
  },
  'poison-monitor': {
    gid: 1177376120,
    name: '報毒監控',
  },
  updates: {
    gid: 994439579,
    name: '更新記錄',
  },
};

function doGet(e) {
  const callback = String(e?.parameter?.callback || '').trim();
  try {
    const type = String(e?.parameter?.type || 'channel').trim();
    const config = SHEETS[type];

    if (!config) {
      return output_({ ok: false, error: 'Unsupported data type: ' + type, headers: [], rows: [] }, callback);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getSheetByGid_(ss, config.gid) || ss.getSheetByName(config.name);

    if (!sheet) {
      return output_({ ok: false, error: '找不到分頁：' + config.name, headers: [], rows: [] }, callback);
    }

    const range = sheet.getDataRange();
    const values = range.getDisplayValues();
    const richValues = range.getRichTextValues();

    if (!values || !values.length) {
      return output_({
        ok: true,
        schemaVersion: 2,
        type,
        headers: [],
        rows: [],
        meta: { sheetName: sheet.getName(), gid: sheet.getSheetId(), rowCount: 0, columnCount: 0 },
      }, callback);
    }

    const headers = values[0].map(value => String(value || '').trim());
    const visibleHeaders = headers.filter(Boolean);
    const rows = values.slice(1)
      .filter(row => row.some(cell => String(cell || '').trim() !== ''))
      .map((row, rowIndex) => {
        const record = {};
        headers.forEach((header, columnIndex) => {
          if (!header) return;
          const text = String(row[columnIndex] || '').trim();
          const rich = richValues[rowIndex + 1]?.[columnIndex];
          const url = getRichTextUrl_(rich);
          record[header] = text;
          if (url) record[header + '_url'] = url;
        });
        return record;
      });

    return output_({
      ok: true,
      schemaVersion: 2,
      type,
      headers: visibleHeaders,
      rows,
      meta: {
        sheetName: sheet.getName(),
        gid: sheet.getSheetId(),
        rowCount: rows.length,
        columnCount: visibleHeaders.length,
      },
    }, callback);
  } catch (err) {
    return output_({ ok: false, error: err.message || String(err), headers: [], rows: [] }, callback);
  }
}

function getRichTextUrl_(rich) {
  if (!rich) return '';
  const direct = rich.getLinkUrl();
  if (direct) return direct;
  const runs = rich.getRuns ? rich.getRuns() : [];
  for (let index = 0; index < runs.length; index += 1) {
    const url = runs[index].getLinkUrl();
    if (url) return url;
  }
  return '';
}

function getSheetByGid_(ss, gid) {
  return ss.getSheets().find(sheet => sheet.getSheetId() === gid) || null;
}

function output_(data, callback) {
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(data) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}