# 總儀表版

這是一個以 HTML / CSS / JavaScript 製作的本地儀表版專案，主要用來管理：

- 任務儀表版
- 任務封存
- 渠道儀表版
- 歷史批次
- 渠道統整表（同步 Google Sheet）
- 資料工具

## 特色

- 可直接在頁面上編輯任務與渠道資料
- 支援本機儲存
- 支援批次管理與歷史查詢
- 支援截圖模式
- 支援 Google Apps Script API 同步私有 Google Sheet
- 支援表格搜尋、篩選與排序

## 專案檔案

- `index.html`：主頁面
- `app.js`：主要互動邏輯
- `styles.css`：畫面樣式
- `tools.html`：資料工具頁
- `channel_summary_api.gs`：Google Apps Script API 範例

## 本機開啟方式

建議使用本機伺服器開啟，不要直接用 `file://`。

```bash
python3 -m http.server 5500
```

然後打開：

```text
http://127.0.0.1:5500/index.html
```

## GitHub 使用建議

這個專案可以直接放到 GitHub，但請注意：

- `channel_summary_api.gs` 只是 Apps Script 範例檔
- 真正部署用的 Apps Script Web App 網址不要直接硬寫在公開說明中
- 如果未來要多人同步，不建議只靠 `localStorage`

## Google Sheet 私有同步

如果要同步私有 Google Sheet：

1. 把 `channel_summary_api.gs` 貼到 Google Apps Script
2. 部署成 Web App
3. 權限設成「任何知道連結的人」
4. 在網站的 `渠道統整表` 頁面中選擇 `Apps Script API`
5. 貼上 Web App 的 `/exec` 網址

## 後續可擴充

- Google 帳號登入與白名單控管
- 任務資料改成 Google Sheets 雲端同步
- 渠道批次多人協作
- 欄位權限與角色管理
