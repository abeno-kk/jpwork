(() => {
  'use strict';
  const get=name=>document.getElementById('url-builder-'+name);
  const form=get('form'),channel=get('channel'),aid=get('aid'),token=get('token'),output=get('output'),copy=get('copy'),status=get('status');
  const dialog=get('manager'),rows=get('rows'),error=get('manager-error');
  let draft=[],signature='',openedSignature='';
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
    get('domain').textContent=entry?.url || '';
    output.value=entry&&validAid&&validToken?`${entry.url}?aid=${encodeURIComponent(a)}&login_token=${encodeURIComponent(t)}`:'';
    copy.disabled=!output.value;
    get('result-state').textContent=output.value?'網址已就緒':'等待輸入';
    get('result').classList.toggle('is-ready',Boolean(output.value));
    status.textContent=a&&!validAid?'AID 請填入純數字。':t&&!validToken?'TOKEN 中間不能包含空白或換行。':'';
  }
  form.addEventListener('input',update);channel.addEventListener('change',update);
  form.addEventListener('submit',async event=>{
    event.preventDefault();update();if(!output.value)return;
    try{await navigator.clipboard.writeText(output.value);status.textContent='已複製網址。';}
    catch{output.focus();output.select();try{status.textContent=document.execCommand('copy')?'已複製網址。':'請按 Ctrl+C 複製已選取的網址。';}catch{status.textContent='請按 Ctrl+C 複製已選取的網址。';}}
  });
  get('clear').addEventListener('click',()=>{aid.value='';token.value='';update();aid.focus();});
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