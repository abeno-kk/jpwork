const SHEET_ID='1q0fj4U4wxAyQNyZA_U9Gldz5ffz7e0K_rh5YDMs2NAE';
const TAB='共用渠道';
const FOLDER_ID='1WH_8cCHNO7hK6Nv2YSGscFcbsr7dwGkb';
function doGet(e){
 return HtmlService.createHtmlOutputFromFile('Editor').setTitle('PWA 共用 URL 拼接').addMetaTag('viewport','width=device-width, initial-scale=1');
}
function digest_(text){return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text));}
function validate_(rows){
 if(!Array.isArray(rows)||!rows.length||rows.length>500)throw new Error('渠道數量須為 1 至 500 筆。');
 const ids={},names={};return rows.map(function(row,index){
 const name=String(row.name||'').trim(),raw=String(row.url||'').trim();
 if(!name||name.length>100)throw new Error('第 '+(index+1)+' 列渠道名稱不正確。');
 if(!/^https?:\/\/[^\s\/?#@:]+(?::\d+)?(?:\/[^\s?#]*)?$/i.test(raw))throw new Error('第 '+(index+1)+' 列請使用完整 http(s) 網址，不可含參數或帳密。');
 const id=String(row.id||('sheet-'+digest_(name).slice(0,20)));
 if(ids[id]||names[name.toLowerCase()])throw new Error('渠道名稱或 ID 重複。');ids[id]=true;names[name.toLowerCase()]=true;
 return {id:id,name:name,url:raw.replace(/\/$/,'')};
 });
}
function readChannels_(){
 const sheet=SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB);if(!sheet)throw new Error('找不到共用渠道分頁。');
 const last=sheet.getLastRow();if(last>501)throw new Error('渠道數量超過 500 筆。');
 const raw=last>1?sheet.getRange(2,1,last-1,3).getDisplayValues():[];
 const channels=validate_(raw.filter(r=>r.some(Boolean)).map(r=>({name:r[0],url:r[1],id:r[2]})));
 return {ok:true,channels:channels,revision:digest_(JSON.stringify(channels)),sheetUrl:'https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/edit'};
}
// Injected only into the two private standalone Apps Script projects during deployment.
const SESSION_KEY='__SESSION_KEY__';
function identity_(ticket){
 try{
  if(typeof ticket!=='string'||ticket.length>3000)throw 0;
  const parts=ticket.split('.');if(parts.length!==2)throw 0;
  const expected=Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0],SESSION_KEY));
  if(parts[1].length!==expected.length)throw 0;
  let diff=0;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^parts[1].charCodeAt(i);if(diff)throw 0;
  const claims=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
  const now=Math.floor(Date.now()/1000);
  if(claims.aud!=='jpwork-channels-v1'||!claims.email||claims.exp<=now||claims.iat>now+30||claims.exp-claims.iat>3600)throw 0;
  return claims.email.toLowerCase();
 }catch(e){throw new Error('登入已過期或無效，請返回儀表板重新 Google 登入。');}
}
function access_(ticket){
 const email=identity_(ticket),headers={Authorization:'Bearer '+ScriptApp.getOAuthToken()};
 function get(path){const r=UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/'+path,{headers:headers,muteHttpExceptions:true});if(r.getResponseCode()!==200)throw new Error('無法確認資料夾權限，請聯絡管理者。');return JSON.parse(r.getContentText());}
 const file=get('files/'+SHEET_ID+'?supportsAllDrives=true&fields=parents');
 if(!file.parents||!file.parents.includes(FOLDER_ID))throw new Error('共用資料表已移出授權資料夾。');
 function role(id){let next='',found='';do{
  const data=get('files/'+id+'/permissions?supportsAllDrives=true&pageSize=100&fields='+encodeURIComponent('nextPageToken,permissions(type,emailAddress,role,deleted,expirationTime)')+(next?'&pageToken='+encodeURIComponent(next):''));
  for(const p of data.permissions||[]){if(p.type!=='user'||p.deleted||String(p.emailAddress||'').toLowerCase()!==email||(p.expirationTime&&Date.parse(p.expirationTime)<=Date.now()))continue;
   if(['owner','organizer','fileOrganizer','writer'].includes(p.role))return 'editor';if(['reader','commenter'].includes(p.role))found='reader';}
  next=data.nextPageToken||'';
 }while(next);return found;}
 const folderRole=role(FOLDER_ID);if(!folderRole)throw new Error('此帳號未列在指定資料夾的個人分享名單，請管理者將你的 Google 帳號加入資料夾。');
 const sheetRole=role(SHEET_ID);if(!sheetRole)throw new Error('此帳號沒有共用表權限。');
 return {email:email,canEdit:folderRole==='editor'&&sheetRole==='editor'};
}
function assertEditor_(ticket){const access=access_(ticket);if(!access.canEdit)throw new Error('你只有檢視權限，修改渠道需要指定資料夾及共用表的編輯權限。');return access.email;}
function loadEditor(ticket){const access=access_(ticket);return Object.assign(readChannels_(),access);}
function lookupToken(uid,ticket){
 access_(ticket);uid=String(uid||'').trim();if(!/^\d+$/.test(uid))throw new Error('UID 必須是純數字。');
 const response=UrlFetchApp.fetch('https://cchttps.twelvepacks.top/?func=uid_token&form=csv&uid='+encodeURIComponent(uid),{muteHttpExceptions:true});
 if(response.getResponseCode()!==200)throw new Error('TOKEN 查詢服務暫時無法使用。');
 const values=response.getContentText().split(/\r?\n/).map(line=>line.trim().match(/^#?\s*(\d+)\s*[:,：]\s*([a-fA-F0-9]{32})\s*$/)).filter(row=>row&&row[1]===uid).map(row=>row[2]);
 const unique=[...new Set(values)];if(unique.length!==1)throw new Error('查不到唯一有效 TOKEN，請確認 UID。');return {uid:uid,token:unique[0]};
}
function saveChannels(rows,expectedRevision,ticket){
 assertEditor_(ticket);const next=validate_(rows),lock=LockService.getScriptLock();lock.waitLock(10000);
 try{
 const current=readChannels_();if(current.revision!==expectedRevision)throw new Error('共用表已被其他人修改，請重新載入後再編輯。');
 const count=Math.max(current.channels.length,next.length),values=[['渠道名稱','渠道網址','渠道ID']];
 for(let i=0;i<count;i++)values.push(i<next.length?[next[i].name,next[i].url,next[i].id]:['','','']);
 const response=UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+SHEET_ID+'/values/'+encodeURIComponent("'"+TAB+"'!A1:C"+(count+1))+'?valueInputOption=RAW',{method:'put',contentType:'application/json',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},payload:JSON.stringify({values:values}),muteHttpExceptions:true});
 if(response.getResponseCode()!==200)throw new Error('儲存失敗，請檢查共用表編輯權限。');
 SpreadsheetApp.flush();return readChannels_();
 }finally{lock.releaseLock();}
}
// Run once by the project owner in the Apps Script editor; private to RPC callers.
function authorizeBackend_(){
 SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB).getLastRow();
 const response=UrlFetchApp.fetch("https://www.googleapis.com/drive/v3/files/"+FOLDER_ID+"?fields=id",{headers:{Authorization:"Bearer "+ScriptApp.getOAuthToken()},muteHttpExceptions:true});
 if(response.getResponseCode()!==200)throw new Error("管理者無法讀取指定資料夾。");
 return "管理者服務已啟用";
}
