(() => {
  'use strict';
  const KEY='dashboardNavConfigV4',nav=document.querySelector('.nav');
  const buttons=new Map([...nav.querySelectorAll('.nav-button')].map(el=>[el.dataset.view,el]));
  const groups=new Map([...nav.querySelectorAll('.nav-group')].map(el=>['group-'+el.dataset.group,el]));
  const defaultTitles=Object.fromEntries([...buttons].map(([key,el])=>[key,el.textContent.trim()]));
  for(const [key,el] of groups)defaultTitles[key]=el.querySelector('.nav-group-toggle span').textContent.trim();
  const defaults={order:[...nav.children].filter(el=>el.matches('.nav-group,.nav-button')).map(el=>el.dataset.view || 'group-'+el.dataset.group),groupOrder:{},titles:defaultTitles,hidden:[],schemaVersion:5};
  for(const [key,el] of groups)defaults.groupOrder[key]=[...el.querySelectorAll('.nav-button')].map(el=>el.dataset.view);
  defaults.groupOrder['group-tools']=['tools','url-builder'];
  const toolIndex=defaults.order.indexOf('tools');
  defaults.order=defaults.order.filter(key=>!['tools','url-builder'].includes(key));defaults.order.splice(toolIndex,0,'group-tools');
  defaults.titles['group-tools']='資料工具';defaults.titles.tools='數值轉換器';
  const isGroup=key=>key.startsWith('group-');
  const safeGroup=key=>/^group-[a-zA-Z0-9-]+$/.test(key);
  function normalize(source){
    const cfg={order:[],groupOrder:{},titles:{...defaults.titles},hidden:[],schemaVersion:5};
    const raw=source&&typeof source==='object'?structuredClone(source):structuredClone(defaults);
    raw.order=Array.isArray(raw.order)?raw.order:[];
    raw.groupOrder=raw.groupOrder&&typeof raw.groupOrder==='object'?raw.groupOrder:{};
    if(raw.schemaVersion!==5){
      const oldIndex=raw.order.indexOf('tools');
      raw.order=raw.order.filter(key=>!['tools','url-builder','group-tools'].includes(key));
      raw.order.splice(oldIndex>=0?oldIndex:raw.order.length,0,'group-tools');
      for(const key of Object.keys(raw.groupOrder))if(Array.isArray(raw.groupOrder[key]))raw.groupOrder[key]=raw.groupOrder[key].filter(item=>!['tools','url-builder'].includes(item));
      raw.groupOrder['group-tools']=['tools','url-builder'];
      if(raw.titles?.tools==='資料工具')raw.titles.tools='數值轉換器';
    }
    const groupKeys=new Set([...Object.keys(raw.groupOrder).filter(safeGroup),...(raw.schemaVersion===5?[]:Object.keys(defaults.groupOrder))]);
    for(const key of groupKeys)cfg.groupOrder[key]=[];
    const seen=new Set();
    function visit(list,target,parents=[]){
      for(const key of Array.isArray(list)?list:[]){
        if(typeof key!=='string'||seen.has(key)||parents.includes(key)||(!buttons.has(key)&&!groupKeys.has(key)))continue;
        seen.add(key);target.push(key);
        if(groupKeys.has(key))visit(raw.groupOrder[key],cfg.groupOrder[key],[...parents,key]);
      }
    }
    visit(raw.order,cfg.order);
    for(const key of groupKeys)if(!seen.has(key)){seen.add(key);cfg.order.push(key);visit(raw.groupOrder[key],cfg.groupOrder[key],[key]);}
    for(const [key] of buttons)if(!seen.has(key)){
      const parent=Object.keys(defaults.groupOrder).find(group=>defaults.groupOrder[group].includes(key));
      (parent&&cfg.groupOrder[parent]?cfg.groupOrder[parent]:cfg.order).push(key);seen.add(key);
    }
    for(const key of seen)if(typeof raw.titles?.[key]==='string'&&raw.titles[key].trim())cfg.titles[key]=raw.titles[key].trim();
    for(const key of groupKeys)if(!cfg.titles[key])cfg.titles[key]='未命名群組';
    cfg.hidden=Array.isArray(raw.hidden)?[...new Set(raw.hidden.filter(key=>seen.has(key)))]:[];
    return cfg;
  }
  function read(){try{return normalize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{return normalize(null);}}
  let config=read(),draft,baseline='',dragged='';
  function ensureGroup(key){
    if(groups.has(key))return groups.get(key);
    const el=document.createElement('div');el.className='nav-group';el.dataset.group=key.slice(6);
    const toggle=document.createElement('button');toggle.type='button';toggle.className='nav-group-toggle';toggle.dataset.navGroup=key.slice(6);
    const label=document.createElement('span'),arrow=document.createElement('span');arrow.className='nav-group-arrow';arrow.textContent='⌄';toggle.append(label,arrow);
    const submenu=document.createElement('div');submenu.className='nav-submenu';submenu.dataset.navSubmenu=key.slice(6);el.append(toggle,submenu);groups.set(key,el);return el;
  }
  function revealActive(){
    let group=buttons.get(state.view)?.closest('.nav-group');
    while(group){state.navGroups[group.dataset.group]=true;group=group.parentElement.closest('.nav-group');}
  }
  function apply(){
    // Keep the original page buttons so their existing event handlers survive moves.
    for(const el of buttons.values())el.remove();
    for(const el of groups.values())el.remove();
    function append(list,parent){
      for(const key of list){
        const el=isGroup(key)?ensureGroup(key):buttons.get(key);if(!el)continue;
        el.classList.toggle('nav-item-hidden',config.hidden.includes(key));
        if(isGroup(key)){
          el.querySelector('.nav-group-toggle span').textContent=config.titles[key];
          const submenu=el.querySelector(':scope > .nav-submenu');submenu.replaceChildren();
          if(state.navGroups[key.slice(6)]===undefined)state.navGroups[key.slice(6)]=true;
          append(config.groupOrder[key],submenu);
        }else{
          el.textContent=config.titles[key];el.classList.toggle('nav-button-standalone',parent===nav);
        }
        parent.append(el);
      }
    }
    append(config.order,nav);nav.append(document.getElementById('nav-edit-toggle'));
    revealActive();renderNavigation();
  }
  const dialog=document.getElementById('nav-manager'),tree=document.getElementById('nav-manager-tree'),message=document.getElementById('nav-manager-status');
  function parentOf(key){return Object.keys(draft.groupOrder).find(group=>draft.groupOrder[group].includes(key))||'';}
  function listOf(parent){return parent?draft.groupOrder[parent]:draft.order;}
  function descendants(key){return [key,...(draft.groupOrder[key]||[]).flatMap(descendants)];}
  function move(key,parent,index){
    if(!key || key===parent || (isGroup(key)&&descendants(key).includes(parent)))return false;
    const old=listOf(parentOf(key)),at=old.indexOf(key);if(at<0)return false;
    const target=listOf(parent);if(!target)return false;
    if(old===target&&at<index)index--;
    old.splice(at,1);target.splice(Math.max(0,Math.min(index,target.length)),0,key);
    return true;
  }
  function button(label,fn,cls=''){const el=document.createElement('button');el.type='button';el.textContent=label;el.className=cls;el.addEventListener('click',fn);return el;}
  function dropArea(parent,index){
    const el=document.createElement('div');el.className='nav-drop-zone';el.dataset.parent=parent;el.dataset.index=index;
    el.addEventListener('dragover',event=>{if(!dragged)return;event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect='move';el.classList.add('is-over');});
    el.addEventListener('dragleave',()=>el.classList.remove('is-over'));
    el.addEventListener('drop',event=>{event.preventDefault();event.stopPropagation();el.classList.remove('is-over');if(move(dragged,parent,index)){message.textContent='已移動，儲存後套用。';draw();}endDrag();});
    return el;
  }
  function endDrag(){pointerDrag=null;cancelAnimationFrame(scrollFrame);dragged='';tree.classList.remove('is-dragging');tree.querySelectorAll('.is-over').forEach(el=>el.classList.remove('is-over'));}
  let pointerDrag=null,scrollFrame=0;
  function startPointerDrag(event,key){
    if(event.button!==0)return;
    event.preventDefault();pointerDrag={key,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,target:null};
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function pointerTarget(x,y){
    const hit=document.elementFromPoint(x,y);if(!hit||!tree.contains(hit))return null;
    const zone=hit.closest('.nav-drop-zone');
    if(zone)return {parent:zone.dataset.parent,index:Number(zone.dataset.index),element:zone};
    const row=hit.closest('.nav-organizer-row');if(!row)return null;
    const key=row.parentElement.dataset.key,parent=parentOf(key),index=listOf(parent).indexOf(key),rect=row.getBoundingClientRect();
    const ratio=(y-rect.top)/rect.height,inside=isGroup(key)&&ratio>.25&&ratio<.75;
    return {parent:inside?key:parent,index:inside?listOf(key).length:index+(ratio>.5?1:0),element:row};
  }
  function markPointerTarget(){
    tree.querySelectorAll('.is-over').forEach(el=>el.classList.remove('is-over'));
    const target=pointerTarget(pointerDrag.x,pointerDrag.y);
    if(target&&(target.parent===dragged||(isGroup(dragged)&&descendants(dragged).includes(target.parent)))){pointerDrag.target=null;return;}
    pointerDrag.target=target;target?.element.classList.add('is-over');
  }
  function autoScroll(){
    if(!pointerDrag||!dragged)return;
    const body=tree.closest('.workspace-dialog-body'),rect=body.getBoundingClientRect(),y=pointerDrag.y;
    const amount=y<rect.top+42?-12:y>rect.bottom-42?12:0;
    if(amount){body.scrollTop+=amount;markPointerTarget();}
    scrollFrame=requestAnimationFrame(autoScroll);
  }
  document.addEventListener('pointermove',event=>{
    if(!pointerDrag)return;
    pointerDrag.x=event.clientX;pointerDrag.y=event.clientY;
    if(!dragged&&Math.hypot(event.clientX-pointerDrag.startX,event.clientY-pointerDrag.startY)<5)return;
    if(!dragged){dragged=pointerDrag.key;tree.classList.add('is-dragging');scrollFrame=requestAnimationFrame(autoScroll);}
    event.preventDefault();markPointerTarget();
  },{passive:false});
  document.addEventListener('pointerup',()=>{
    if(!pointerDrag)return;
    const target=pointerDrag.target;
    if(dragged&&target&&move(dragged,target.parent,target.index)){message.textContent='已移動，儲存後套用。';draw();}
    endDrag();
  });
  document.addEventListener('pointercancel',endDrag);
  function draw(){
    tree.replaceChildren();
    function drawList(parent,container){
      const list=listOf(parent);container.append(dropArea(parent,0));
      list.forEach((key,index)=>{
        const group=isGroup(key),block=document.createElement('div');block.className='nav-organizer-item'+(group?' is-group':'');block.dataset.key=key;
        const row=document.createElement('div');row.className='nav-organizer-row';
        const handle=button('⠿',()=>{},'nav-drag-handle');handle.draggable=false;handle.addEventListener('pointerdown',event=>startPointerDrag(event,key));handle.title='拖曳排序或移入群組';handle.setAttribute('aria-label','拖曳 '+draft.titles[key]);
        const name=document.createElement('input');name.value=draft.titles[key]||'';name.setAttribute('aria-label',(group?'群組':'功能')+'名稱 '+key);name.maxLength=50;
        name.addEventListener('input',()=>draft.titles[key]=name.value);
        name.addEventListener('change',()=>{if(!name.value.trim())return;draft.titles[key]=name.value.trim();tree.querySelectorAll('select option').forEach(option=>{if(option.value===key)option.textContent=draft.titles[key];});handle.setAttribute('aria-label','拖曳 '+draft.titles[key]);});
        const select=document.createElement('select');select.setAttribute('aria-label','所屬群組 '+key);select.add(new Option('最外層',''));
        const excluded=group?descendants(key):[];
        for(const other of Object.keys(draft.groupOrder))if(!excluded.includes(other))select.add(new Option(draft.titles[other]||'未命名群組',other));
        select.value=parent;select.addEventListener('change',()=>{move(key,select.value,listOf(select.value).length);draw();});
        const visible=document.createElement('label');visible.className='nav-visible-toggle';const check=document.createElement('input');check.type='checkbox';check.checked=!draft.hidden.includes(key);check.setAttribute('aria-label','顯示 '+key);
        check.addEventListener('change',()=>{draft.hidden=draft.hidden.filter(id=>id!==key);if(!check.checked)draft.hidden.push(key);});visible.append(check,document.createTextNode('顯示'));
        const actions=document.createElement('div');actions.className='nav-row-actions';
        const up=button('↑',()=>{move(key,parent,index-1);draw();});up.disabled=index===0;up.setAttribute('aria-label','上移 '+key);
        const down=button('↓',()=>{move(key,parent,index+2);draw();});down.disabled=index===list.length-1;down.setAttribute('aria-label','下移 '+key);actions.append(up,down);
        if(group){const remove=button('解散',()=>{const items=[...draft.groupOrder[key]],target=listOf(parent),at=target.indexOf(key);target.splice(at,1,...items);delete draft.groupOrder[key];delete draft.titles[key];draft.hidden=draft.hidden.filter(id=>id!==key);draw();message.textContent='群組已解散，內部功能已移到上一層；儲存後套用。';});remove.title='保留內部功能，移到上一層';actions.append(remove);}
        row.append(handle,name,select,visible,actions);block.append(row);
        row.addEventListener('dragover',event=>{if(!dragged)return;event.preventDefault();event.stopPropagation();row.classList.add('is-over');});
        row.addEventListener('dragleave',()=>row.classList.remove('is-over'));
        row.addEventListener('drop',event=>{event.preventDefault();event.stopPropagation();const rect=row.getBoundingClientRect(),fraction=(event.clientY-rect.top)/rect.height;
          const inside=group&&fraction>.25&&fraction<.75;
          if(move(dragged,inside?key:parent,inside?listOf(key).length:index+(fraction>.5?1:0))){message.textContent='已移動，儲存後套用。';draw();}endDrag();});
        if(group){const child=document.createElement('div');child.className='nav-organizer-children';child.dataset.group=key;const hint=document.createElement('p');hint.className='nav-group-drop-hint';hint.textContent='拖到群組名稱可放入此群組';child.append(hint);drawList(key,child);block.append(child);}
        container.append(block,dropArea(parent,index+1));
      });
    }
    drawList('',tree);
  }
  document.getElementById('nav-edit-toggle').textContent='整理功能列';
  document.getElementById('nav-edit-toggle').addEventListener('click',()=>{baseline=localStorage.getItem(KEY)||'';draft=structuredClone(config);message.textContent='拖曳左側把手；拖到群組名稱可放入，拖到間隔可排序。';draw();dialog.showModal();});
  document.getElementById('nav-manager-add').addEventListener('click',()=>{const key='group-'+crypto.randomUUID();draft.groupOrder[key]=[];draft.titles[key]='新群組';draft.order.push(key);draw();tree.querySelector('[data-key="'+key+'"] input').focus();});
  document.getElementById('nav-manager-save').addEventListener('click',()=>{
    if(Object.values(draft.titles).some(title=>!title.trim())){message.textContent='名稱不能留白。';return;}
    if((localStorage.getItem(KEY)||'')!==baseline){message.textContent='其他分頁已更新功能列，請取消後重新開啟。';return;}
    try{localStorage.setItem(KEY,JSON.stringify(draft));config=structuredClone(draft);apply();dialog.close();}
    catch{message.textContent='儲存失敗，請先備份資料並確認瀏覽器空間。';}
  });
  for(const id of ['nav-manager-close','nav-manager-cancel'])document.getElementById(id).addEventListener('click',()=>dialog.close());
  window.addEventListener('storage',event=>{if(event.key===KEY){config=read();if(!dialog.open)apply();}});
  dialog.addEventListener('close',()=>{endDrag();config=read();apply();});
  try{if(localStorage.getItem(KEY)!==JSON.stringify(config))localStorage.setItem(KEY,JSON.stringify(config));}catch{ /* Keep usable in memory if storage is unavailable. */ }
  apply();
})();