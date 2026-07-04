/**
 * 渠道統整表 Apps Script API
 *
 * 用途：
 * 1. 讀取私有 Google Sheet「渠道APPID總表」
 * 2. 以 JSON 形式輸出給本機 dashboard 的「渠道統整表」功能頁使用
 *
 * 部署方式：
 * 1. 到 https://script.google.com 建立新專案
 * 2. 將此檔案內容完整貼上
 * 3. 儲存後，按「部署」>「新增部署作業」
 * 4. 類型選「網頁應用程式」
 * 5. 執行身分選「我自己」
 * 6. 存取權限選「知道連結的任何人」
 * 7. 部署後，複製 Web App 網址
 * 8. 回到 dashboard 的「渠道統整表」頁面
 * 9. 同步來源改成「Apps Script API」，貼上網址，按「儲存同步來源」
 */

const SPREADSHEET_ID = '1B298mjXY1HBAz4ohtNr1pletE9xTE44uYzL0932RRFU';
const SHEET_NAME = '渠道APPID總表';

function doGet(e) {
  try {
    const callback = String(e?.parameter?.callback || '').trim();
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return output_({
        ok: false,
        error: `找不到工作表：${SHEET_NAME}`,
        rows: [],
      }, callback);
    }

    const values = sheet.getDataRange().getDisplayValues();

    if (!values.length) {
      return output_({
        ok: true,
        rows: [],
        meta: {
          spreadsheetId: SPREADSHEET_ID,
          sheetName: SHEET_NAME,
          fetchedAt: new Date().toISOString(),
          rowCount: 0,
        },
      }, callback);
    }

    const headers = values[0].map((header) => String(header || '').trim());
    const rows = values
      .slice(1)
      .filter((row) => row.some((cell) => String(cell || '').trim() !== ''))
      .map((row) => {
        const item = {};
        headers.forEach((header, index) => {
          if (!header) return;
          item[header] = String(row[index] || '').trim();
        });
        return item;
      });

    return output_({
      ok: true,
      rows,
      meta: {
        spreadsheetId: SPREADSHEET_ID,
        sheetName: SHEET_NAME,
        fetchedAt: new Date().toISOString(),
        rowCount: rows.length,
      },
    }, callback);
  } catch (error) {
    const callback = String(e?.parameter?.callback || '').trim();
    return output_({
      ok: false,
      error: error && error.message ? error.message : String(error),
      rows: [],
    }, callback);
  }
}

function output_(data, callback) {
  if (callback) {
    const payload = `${callback}(${JSON.stringify(data)})`;
    return ContentService
      .createTextOutput(payload)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
