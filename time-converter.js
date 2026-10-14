(function () {
  'use strict';
  const pad = (n, width = 2) => String(n).padStart(width, '0');
  const zone = n => `UTC${n < 0 ? '-' : '+'}${pad(Math.floor(Math.abs(n) / 60))}:${pad(Math.abs(n) % 60)}`;
  function parts(ms, offset) {
    const d = new Date(ms + offset * 60000);
    const date = `${pad(d.getUTCFullYear(),4)}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
    const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}${d.getUTCMilliseconds() ? '.'+pad(d.getUTCMilliseconds(),3) : ''}`;
    return { date, time, weekday:'星期'+'日一二三四五六'[d.getUTCDay()], text:date+' '+time+zone(offset).slice(3) };
  }
  function parse(input, source = 330, order = 'auto') {
    let s = String(input).normalize('NFKC').trim().replace(/\u2212/g,'-').replace(/\s+/g,' ');
    if (!s) throw Error('請輸入日期與時間。');
    if (/^\d{10}(?:\.\d{1,3})?$/.test(s) || /^\d{13}$/.test(s)) {
      const ms = Math.round(Number(s) * (/^\d{13}$/.test(s) ? 1 : 1000));
      return {ms,offset:0,info:'已辨識 Unix 時間戳（UTC）'};
    }
    let offset = Number(source), explicit = false;
    const tz = s.match(/(?:\s*(?:UTC|GMT)\s*)?([+-])(\d{1,2})(?::?(\d{2}))?$/i);
    if (tz && (/[T :年月日]/.test(s.slice(0,tz.index)) || /UTC|GMT/i.test(tz[0]))) {
      const h=Number(tz[2]), m=Number(tz[3] || 0);
      if (h>14 || m>59 || (h===14 && m!==0)) throw Error('時區偏移超出範圍，請使用 ±00:00 至 ±14:00。');
      offset=(tz[1]==='-'?-1:1)*(h*60+m); explicit=true; s=s.slice(0,tz.index).trim();
    } else if (/(?:Z|UTC|GMT)$/i.test(s)) {
      s=s.replace(/(?:Z|UTC|GMT)$/i,'').trim(); offset=0; explicit=true;
    }
    let meridiem='';
    s=s.replace(/上午|下午|\bAM\b|\bPM\b/gi, token => {
      if (meridiem) throw Error('上午／下午標記重複。');
      meridiem=/下午|PM/i.test(token)?'pm':'am'; return ' ';
    }).trim();
    s=s.replace(/年|月/g,'-').replace(/日/g,' ').replace(/時|时|分/g,':').replace(/秒/g,'').replace(/T/gi,' ').replace(/\s+/g,' ').trim();
    let y,mo,day,clock,kind='年月日';
    let m=s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s+(.+))?$/);
    if (m) [,y,mo,day,clock]=m;
    else if ((m=s.match(/^(\d{4}) (\d{1,2}) (\d{1,2})(?: (.+))?$/))) [,y,mo,day,clock]=m;
    else if ((m=s.match(/^(\d{4})(\d{2})(\d{2})(?:\s?(\d{6}))?$/))) { [,y,mo,day,clock]=m; kind='連續數字'; }
    else if ((m=s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s+(.+))?$/))) {
      let [,a,b,year,time]=m; y=year; clock=time;
      let selected=order;
      if (selected==='auto') {
        if (+a>12 && +b<=12) selected='dmy';
        else if (+b>12 && +a<=12) selected='mdy';
        else if (+a===+b) selected='dmy';
        else throw Error('月／日順序不明，請選擇「日／月／年」或「月／日／年」。');
      }
      [mo,day]=selected==='dmy'?[b,a]:[a,b]; kind=selected==='dmy'?'日／月／年':'月／日／年';
    } else throw Error('無法辨識，請輸入完整日期，例如 2026-10-11 21:13:08；時區請用 +08:00 或 Z。');
    let h=0,mi=0,sec=0,milli=0, note='';
    if (!clock) {
      if (meridiem) throw Error('上午／下午標記需搭配時間。');
      note='；未提供時間，使用 00:00:00';
    } else {
      const tm=clock.match(/^(\d{1,2})[: ](\d{1,2})(?:[: ](\d{1,2})(?:\.(\d{1,3}))?)?$/) || clock.match(/^(\d{2})(\d{2})(\d{2})$/);
      if (!tm) throw Error('時間格式不正確，請使用 21:13:08、21 13 08 或 211308。');
      h=+tm[1]; mi=+tm[2]; sec=+(tm[3] || 0); milli=+(tm[4] || '').padEnd(3,'0');
      if (tm[3]===undefined) note='；未提供秒，補 00';
      if (meridiem) {
        if (h<1 || h>12) throw Error('12 小時制的時數必須是 1 至 12。');
        h=h%12+(meridiem==='pm'?12:0);
      }
    }
    y=+y; mo=+mo; day=+day;
    if (y<1000 || y>9999 || mo<1 || mo>12 || day<1 || day>31 || h>23 || mi>59 || sec>59) throw Error('日期或時間超出範圍；請檢查年月日、時（0–23）、分與秒（0–59）。');
    const local=Date.UTC(y,mo-1,day,h,mi,sec,milli), d=new Date(local);
    if (d.getUTCFullYear()!==y || d.getUTCMonth()!==mo-1 || d.getUTCDate()!==day) throw Error('這個日期不存在，請檢查月份天數與閏年。');
    return {ms:local-offset*60000,offset,info:`已辨識${kind}；${explicit?'輸入已含時區，優先採用':'未標時區，使用所選來源時區'} ${zone(offset)}${explicit?'（上方來源選單不套用）':''}${note}`};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports={parse,parts,zone};
  if (typeof document === 'undefined') return;
  const $=id=>document.getElementById('tc-'+id);
  if (!$('form')) return;
  let result=null;
  const name = offset => ({330:'印度',480:'台灣',0:'UTC'}[offset] || '輸入時區')+' '+zone(offset);
  function clearResults() {
    result=null;
    for(const id of ['from-time','from-date','to-time','to-date']) $(id).textContent='—';
    $('from-label').textContent='來源時間'; $('to-label').textContent='轉換結果'; $('diff').textContent='';
    $('copy-source').disabled=$('copy-target').disabled=true;
    document.querySelectorAll('[data-tc-step]').forEach(b=>b.disabled=true);
  }
  function convert() {
    try {
      result=parse($('input').value,Number($('source').value),$('order').value);
      let target=Number($('target').value);
      let automaticNote='';
      if (target===result.offset) {
        target=result.offset===480 ? 330 : 480;
        $('target').value=String(target);
        automaticNote='；已自動將目標切換為'+name(target)+'，避免重複顯示相同時區';
      }
      const a=parts(result.ms,result.offset), b=parts(result.ms,target);
      $('from-label').textContent='來源時間｜'+name(result.offset); $('to-label').textContent='轉換結果｜'+name(target);
      $('from-time').textContent=a.time; $('from-date').textContent=a.date+' '+a.weekday;
      $('to-time').textContent=b.time; $('to-date').textContent=b.date+' '+b.weekday;
      const delta=target-result.offset, days=Math.round((Date.parse(b.date+'T00:00:00Z')-Date.parse(a.date+'T00:00:00Z'))/86400000);
      $('diff').textContent=delta===0 ? '來源與目標時區相同，因此兩邊時間一致。若要換算其他時區，請變更上方「目標時間」。' : `目標比來源${delta<0?'慢':'快'} ${Math.floor(Math.abs(delta)/60)} 小時 ${Math.abs(delta)%60} 分鐘${days?'；跨日：'+(days>0?'＋':'')+days+' 天':'；同一天'}`;
      $('status').classList.remove('tc-error'); $('status').textContent=result.info+automaticNote;
      $('input').setAttribute('aria-invalid','false');
      $('copy-source').disabled=$('copy-target').disabled=false;
      document.querySelectorAll('[data-tc-step]').forEach(b=>b.disabled=false);
    } catch(e) {
      clearResults(); $('status').classList.add('tc-error'); $('status').textContent=e.message; $('input').setAttribute('aria-invalid','true');
    }
  }
  $('form').addEventListener('submit',e=>{e.preventDefault();convert();});
  $('input').addEventListener('input',()=>{ if ($('input').value.trim()) convert(); else reset(); });
  for(const id of ['source','target','order']) $(id).addEventListener('change',()=>{if($('input').value.trim())convert();});
  function reset() {clearResults();$('status').textContent='';$('status').classList.remove('tc-error');$('input').setAttribute('aria-invalid','false');}
  $('clear').addEventListener('click',()=>{$('input').value='';reset();$('input').focus();});
  $('now').addEventListener('click',()=>{$('input').value=parts(Date.now()-Date.now()%1000,Number($('source').value)).text;convert();});
  $('swap').addEventListener('click',()=>{
    const ms=result?.ms, old=String(result?.offset ?? Number($('source').value));
    $('source').value=$('target').value;
    $('target').value=['330','480','0'].includes(old) ? old : ( $('source').value==='480' ? '330' : '480');
    if(ms!==undefined) $('input').value=parts(ms,Number($('source').value)).text;
    if($('input').value.trim())convert();
  });
  document.querySelectorAll('[data-tc-step]').forEach(b=>b.addEventListener('click',()=>{
    if(!result)return;
    $('input').value=parts(result.ms+Number(b.dataset.tcStep)*1000,result.offset).text;convert();
  }));
  async function copy(offset) {
    if(!result)return;
    const value=parts(result.ms,offset).text;
    try {await navigator.clipboard.writeText(value);$('status').textContent='已複製：'+value;}
    catch { $('status').textContent='無法自動複製，請選取下方文字複製：'+value; }
  }
  $('copy-source').addEventListener('click',()=>copy(result?.offset));
  $('copy-target').addEventListener('click',()=>copy(Number($('target').value)));
  clearResults();
})();
