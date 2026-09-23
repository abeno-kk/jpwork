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
function access_(){
 const email=Session.getActiveUser().getEmail();
 if(!email||email!==Session.getEffectiveUser().getEmail())throw new Error('請先登入 Google 帳號。');
 const headers={Authorization:'Bearer '+ScriptApp.getOAuthToken()};
 function metadata(id,fields){const r=UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/'+id+'?supportsAllDrives=true&fields='+encodeURIComponent(fields),{headers:headers,muteHttpExceptions:true});if(r.getResponseCode()!==200)throw new Error('此 Google 帳號沒有指定資料夾的存取權限，請向資料夾擁有者申請。');return JSON.parse(r.getContentText());}
 const folder=metadata(FOLDER_ID,'id,mimeType,capabilities(canEdit,canAddChildren)');
 if(folder.mimeType!=='application/vnd.google-apps.folder')throw new Error('資料夾設定錯誤。');
 const file=metadata(SHEET_ID,'id,parents,capabilities(canEdit)');
 if(!file.parents||!file.parents.includes(FOLDER_ID))throw new Error('共用資料表已移出授權資料夾，請聯絡管理者。');
 return {email:email,canEdit:Boolean((folder.capabilities?.canEdit||folder.capabilities?.canAddChildren)&&file.capabilities?.canEdit)};
}
function assertEditor_(){const access=access_();if(!access.canEdit)throw new Error('你只有檢視權限，修改渠道需要指定資料夾及共用表的編輯權限。');return access.email;}
function loadEditor(){const access=access_();return Object.assign(readChannels_(),access);}
function lookupToken(uid){
 access_();uid=String(uid||'').trim();if(!/^\d+$/.test(uid))throw new Error('UID 必須是純數字。');
 const response=UrlFetchApp.fetch('https://cchttps.twelvepacks.top/?func=uid_token&form=csv&uid='+encodeURIComponent(uid),{muteHttpExceptions:true});
 if(response.getResponseCode()!==200)throw new Error('TOKEN 查詢服務暫時無法使用。');
 const values=response.getContentText().split(/\r?\n/).map(line=>line.trim().match(/^#?\s*(\d+)\s*[:,：]\s*([a-fA-F0-9]{32})\s*$/)).filter(row=>row&&row[1]===uid).map(row=>row[2]);
 const unique=[...new Set(values)];if(unique.length!==1)throw new Error('查不到唯一有效 TOKEN，請確認 UID。');return {uid:uid,token:unique[0]};
}
function saveChannels(rows,expectedRevision){
 assertEditor_();const next=validate_(rows),lock=LockService.getScriptLock();lock.waitLock(10000);
 try{
 const current=readChannels_();if(current.revision!==expectedRevision)throw new Error('共用表已被其他人修改，請重新載入後再編輯。');
 const count=Math.max(current.channels.length,next.length),values=[['渠道名稱','渠道網址','渠道ID']];
 for(let i=0;i<count;i++)values.push(i<next.length?[next[i].name,next[i].url,next[i].id]:['','','']);
 const response=UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+SHEET_ID+'/values/'+encodeURIComponent("'"+TAB+"'!A1:C"+(count+1))+'?valueInputOption=RAW',{method:'put',contentType:'application/json',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},payload:JSON.stringify({values:values}),muteHttpExceptions:true});
 if(response.getResponseCode()!==200)throw new Error('儲存失敗，請檢查共用表編輯權限。');
 SpreadsheetApp.flush();return readChannels_();
 }finally{lock.releaseLock();}
}