
const columnMap = {
  "APP ID": "APPID",
  "包名": "渠道&名稱",
  "應用渠道": "渠道",
  "包名稱": "版本",
  "昨日新增": "昨日新增",
  "昨日DAU": "昨日DAU",
  "昨日充值": "昨日充值",
  "版本確認": "版本確認",
  "登入B面": "登入B面",
  "拉充值": "拉充值",
  "遊戲遊玩": "遊戲遊玩"
};

function normalizeHeaders(headers) {
  return headers.map(h => columnMap[h] || h);
}
