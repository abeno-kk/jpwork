const SPREADSHEET_ID = '1B298mjXY1HBAz4ohtNr1pletE9xTE44uYzL0932RRFU';

const SHEETS = {
  channel: {
    gid: 1318283124,
    name: '渠道APPID總表-測試',
  },
  updates: {
    gid: 994439579,
    name: '更新記錄',
  },
};

const CHANNEL_MAP = {
  APPID: ['APPID', 'APP ID', 'app_id'],
  '渠道&名稱': ['包名', '渠道&名稱', '渠道名稱'],
  渠道: ['应用渠道', '應用渠道', '渠道'],
  包名稱: ['包名称', '包名稱'],
  版本: ['版本'],
  firebase: ['firebase'],
  昨日新增: ['昨日新增'],
  昨日DAU: ['昨日DAU'],
  昨日充值: ['昨日充值'],
  版本確認: ['版本确认', '版本確認'],
  登入B面: ['登入B面'],
  拉充值: ['拉充值'],
  遊戲遊玩: ['遊戲遊玩'],
  CDN測試: ['CDN測試'],
};

function doGet(e) {
  try {
    const type = String(e?.parameter?.type || 'channel').trim();
    const callback = String(e?.parameter?.callback || '').trim();
    const config = SHEETS[type];

    if (!config) {
      return output_({ ok: false, error: 'type錯誤，只能用 channel 或 updates', rows: [] }, callback);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getSheetByGid_(ss, config.gid) || ss.getSheetByName(config.name);

    if (!sheet) {
      return output_({ ok: false, error: '找不到分頁：' + config.name, rows: [] }, callback);
    }

    const range = sheet.getDataRange();
    const values = range.getDisplayValues();
    const richValues = range.getRichTextValues();

    if (!values || !values.length) {
      return output_({ ok: true, type, rows: [], meta: { sheetName: sheet.getName(), gid: sheet.getSheetId(), rowCount: 0 } }, callback);
    }

    const headers = values[0].map(v => String(v || '').trim());

    const rows = values.slice(1)
      .filter(row => row.some(cell => String(cell || '').trim() !== ''))
      .map((row, r) => {
        const raw = {};

        headers.forEach((h, c) => {
          if (!h) return;
          const text = String(row[c] || '').trim();
          const rich = richValues[r + 1][c];
          const url = getRichTextUrl_(rich);
          raw[h] = text;
          if (url) raw[h + '_url'] = url;
        });

        if (type === 'channel') {
          const item = {};
          Object.keys(CHANNEL_MAP).forEach(key => {
            item[key] = getByAlias_(raw, CHANNEL_MAP[key]);
          });
          return item;
        }

        return raw;
      });

    return output_({
      ok: true,
      type,
      rows,
      meta: {
        sheetName: sheet.getName(),
        gid: sheet.getSheetId(),
        rowCount: rows.length,
      },
    }, callback);

  } catch (err) {
    const callback = String(e?.parameter?.callback || '').trim();
    return output_({ ok: false, error: err.message || String(err), rows: [] }, callback);
  }
}

function getRichTextUrl_(rich) {
  if (!rich) return '';
  const direct = rich.getLinkUrl();
  if (direct) return direct;
  const runs = rich.getRuns ? rich.getRuns() : [];
  for (let i = 0; i < runs.length; i++) {
    const url = runs[i].getLinkUrl();
    if (url) return url;
  }
  return '';
}

function getByAlias_(obj, aliases) {
  for (const name of aliases) {
    if (obj[name] !== undefined) return obj[name];
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
