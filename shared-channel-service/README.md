> Legacy implementation. The active login and data service is documented in [basic-login/README.md](basic-login/README.md). Do not redeploy this USER_ACCESSING data service as the current login.

# PWA 共用渠道

共用表：1q0fj4U4wxAyQNyZA_U9Gldz5ffz7e0K_rh5YDMs2NAE
授權資料夾：1WH_8cCHNO7hK6Nv2YSGscFcbsr7dwGkb
Apps Script：1gngb0fohv0I1piv3F9bHAJIreQYoM7EJLOR3rvUXZURhyzq-mWSehRwN
部署：AKfycbymNE1aBeQ-eVFV-fkpLLt6N7LDpfCAMNuMcJCN43nAE2y-CyPFVv_7uTAeIsRuBtLoKA

必須以 USER_ACCESSING 執行，access=ANYONE（需要 Google 登入），禁止 ANYONE_ANONYMOUS。每次 loadEditor、lookupToken、saveChannels 必須先檢查資料夾權限；寫入還需資料夾與表格編輯權限。勿將渠道清單、UID 或 TOKEN 放到公開靜態檔案、日誌或匿名 API。

更新此目錄後需更新 Apps Script 的版本與既有 deployment ID；GitHub Pages 僅提供登入入口，不代表 Apps Script 已更新。
