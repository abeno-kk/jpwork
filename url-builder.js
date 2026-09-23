(() => {
  'use strict';
  const get=name=>document.getElementById('url-builder-'+name);
  const form=get('form'),channel=get('channel'),aid=get('aid'),token=get('token'),output=get('output'),copy=get('copy'),status=get('status');
  const dialog=get('manager'),rows=get('rows'),error=get('manager-error');
  let draft=[],signature='',openedSignature='';
  let manualSource=false,requestId=0,requestController=null,queriedUid='';
  const uid=get('uid'),query=get('query'),queryStatus=get('query-status'),customUrl=get('custom-url');
  function cancelQuery(){requestId++;requestController?.abort();requestController=null;query.disabled=false;query.textContent='查詢 TOKEN';}
  function setSource(manual){
    manualSource=manual;channel.hidden=manual;channel.disabled=manual;customUrl.hidden=!manual;customUrl.disabled=!manual;
    get('source-list').setAttribute('aria-pressed',String(!manual));get('source-manual').setAttribute('aria-pressed',String(manual));update();
  }
  get('source-list').addEventListener('click',()=>setSource(false));
  get('source-manual').addEventListener('click',()=>{setSource(true);customUrl.focus();});
  function parseToken(text,requestedUid){
    const matches=String(text).replace(/^\uFEFF/,'').split(/\r?\n/).map(line=>line.trim().match(/^#?\s*(\d+)\s*[:,：]\s*([a-fA-F0-9]{32})\s*$/)).filter(row=>row&&row[1]===requestedUid);
    const values=[...new Set(matches.map(row=>row[2]))];
    if(values.length!==1)throw new Error(values.length?'回傳了多個不同 TOKEN，請重新查詢。':'查不到此 UID 的有效 TOKEN，請確認 UID。');
    return values[0];
  }
  uid.addEventListener('input',()=>{
    cancelQuery();
    if(queriedUid){token.value='';queriedUid='';}
    queryStatus.textContent='';update();
  });
  token.addEventListener('input',()=>{cancelQuery();queriedUid='';queryStatus.textContent='已改為手動輸入 TOKEN。';});
  query.addEventListener('click',async()=>{
    const requestedUid=uid.value.trim();cancelQuery();
    if(!/^[0-9]+$/.test(requestedUid)){queryStatus.textContent='請輸入一個純數字 UID。';return;}
    const id=requestId,controller=new AbortController();requestController=controller;
    token.value='';queriedUid='';update();query.disabled=true;query.textContent='查詢中…';queryStatus.textContent='正在查詢 TOKEN…';
    const timeout=setTimeout(()=>controller.abort(),15000);
    try{
      const endpoint=new URL('https://cchttps.twelvepacks.top/');endpoint.search=new URLSearchParams({func:'uid_token',form:'csv',uid:requestedUid});
      const response=await fetch(endpoint,{signal:controller.signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
      if(!response.ok)throw new Error('查詢服務暫時無法使用（HTTP '+response.status+'）。');
      const value=parseToken(await response.text(),requestedUid);
      if(id!==requestId||uid.value.trim()!==requestedUid)return;
      token.value=value;queriedUid=requestedUid;update();queryStatus.textContent='已取得 UID '+requestedUid+' 的 TOKEN，並自動填入。';
    }catch(e){
      if(id!==requestId)return;
      queryStatus.textContent=e.name==='AbortError'?'查詢逾時，請重試。':e instanceof TypeError?'無法連線到查詢服務，請稍後重試或手動貼上 TOKEN。':e.message;
    }finally{clearTimeout(timeout);if(id===requestId){requestController=null;query.disabled=false;query.textContent='查詢 TOKEN';}}
  });
  uid.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();query.click();}});
  const current=()=>state.data.urlBuilderChannels || PwaUrlModel.normalize(undefined);
  function refresh() {
    const list=current(),next=JSON.stringify(list);
    if(signature!==next){
      const selected=channel.value;channel.replaceChildren(...list.map(item=>new Option(item.name,item.id)));
      if(list.some(item=>item.id===selected))channel.value=selected;
      signature=next;
      get('count').textContent=list.length+' 個渠道';
    }
    update();
  }
  function update(){
    const entry=current().find(item=>item.id===channel.value);
    const a=aid.value.trim(),t=token.value.trim();
    const validAid=/^[0-9]+$/.test(a),validToken=t.length>0&&!/\s/.test(t);
    let base=entry?.url || '',urlError='';
    if(manualSource){
      base='';if(customUrl.value.trim()){try{base=PwaUrlModel.domain(customUrl.value);}catch(e){urlError=e.message;}}
    }
    get('domain').textContent=manualSource?(urlError||base||'輸入完整網址，例如 https://pwa.example.com'):base;
    output.value=base&&validAid&&validToken?`${base}?aid=${encodeURIComponent(a)}&login_token=${encodeURIComponent(t)}`:'';
    copy.disabled=!output.value;
    get('result-state').textContent=output.value?'網址已就緒':'等待輸入';
    get('result').classList.toggle('is-ready',Boolean(output.value));
    status.textContent=urlError?urlError:a&&!validAid?'AID 請填入純數字。':t&&!validToken?'TOKEN 中間不能包含空白或換行。':'';
  }
  form.addEventListener('input',update);channel.addEventListener('change',update);
  form.addEventListener('submit',async event=>{
    event.preventDefault();update();if(!output.value)return;
    try{await navigator.clipboard.writeText(output.value);status.textContent='已複製網址。';}
    catch{output.focus();output.select();try{status.textContent=document.execCommand('copy')?'已複製網址。':'請按 Ctrl+C 複製已選取的網址。';}catch{status.textContent='請按 Ctrl+C 複製已選取的網址。';}}
  });
  get('clear').addEventListener('click',()=>{cancelQuery();aid.value='';token.value='';uid.value='';customUrl.value='';queriedUid='';queryStatus.textContent='';update();aid.focus();});
  function drawRows(){
    rows.replaceChildren();
    draft.forEach((item,index)=>{
      const row=document.createElement('div');row.className='pwa-channel-row';row.dataset.id=item.id;
      const number=document.createElement('span');number.className='pwa-row-number';number.textContent=String(index+1).padStart(2,'0');
      const name=document.createElement('input');name.value=item.name;name.placeholder='渠道名稱';name.setAttribute('aria-label',`第 ${index+1} 列渠道名稱`);name.addEventListener('input',()=>{item.name=name.value;error.textContent='';});
      const url=document.createElement('input');url.value=item.url;url.placeholder='https://';url.setAttribute('aria-label',`第 ${index+1} 列渠道網址`);url.spellcheck=false;url.addEventListener('input',()=>{item.url=url.value;error.textContent='';});
      const remove=document.createElement('button');remove.type='button';remove.className='pwa-remove';remove.textContent='刪除';remove.setAttribute('aria-label',`刪除第 ${index+1} 列渠道`);remove.disabled=draft.length<=1;
      remove.addEventListener('click',()=>{draft.splice(index,1);drawRows();error.textContent='尚未儲存；取消可放棄本次修改。';});
      row.append(number,name,url,remove);rows.append(row);
    });
  }
  get('manage').addEventListener('click',()=>{draft=structuredClone(current());openedSignature=JSON.stringify(current());error.textContent='';drawRows();dialog.showModal();});
  get('add').addEventListener('click',()=>{draft.push({id:'pwa-'+crypto.randomUUID(),name:'',url:'https://'});drawRows();rows.lastElementChild.querySelector('input').focus();});
  get('manager-cancel').addEventListener('click',()=>dialog.close());
  get('manager-close').addEventListener('click',()=>dialog.close());
  get('manager-save').addEventListener('click',()=>{
    try{
      if(JSON.stringify(current())!==openedSignature)throw new Error('渠道資料已在其他分頁更新，請取消後重新開啟管理。');
      const next=PwaUrlModel.validate(draft),previous=state.data.urlBuilderChannels;
      state.data.urlBuilderChannels=next;
      if(!saveState()){state.data.urlBuilderChannels=previous;throw new Error('儲存失敗，請先匯出備份後再試。');}
      refresh();dialog.close();status.textContent='渠道列表已儲存。';
    }catch(e){error.textContent=e.message;}
  });
  window.refreshPwaUrlBuilder=refresh;
  refresh();
})();