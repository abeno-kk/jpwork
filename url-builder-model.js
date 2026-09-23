(() => {
  'use strict';
  const defaults = [
    [1,'https://pwa.game123.asia'],[3,'https://pwa.awin.today'],[4,'https://pwa.xwin.asia'],[5,'https://pwa.11win.asia'],
    [6,'https://pwa.hccgame.online'],[7,'https://pwa.yywin.online'],[8,'https://pwa.haqgame.online'],[9,'https://pwa.offsspack.info'],
    [10,'https://weak.funsnowlucky.top'],[11,'https://weak.elevenpackage.top'],[12,'https://weak.twelvepacks.top'],
    [13,'https://weak.seventypackage.cc'],[14,'https://weak.artbyrichs.cc'],[15,'https://weak.amlinear.com'],
  ].map(([id,url]) => ({id:'pwa-'+id,name:`渠道${id}_弱转PWA`,url}));
  function domain(value) {
    const text=String(value || '').trim();
    let url; try { url=new URL(text); } catch { throw new Error('請輸入完整的 https:// 網址。'); }
    if (!['https:','http:'].includes(url.protocol) || url.username || url.password || text.includes('?') || text.includes('#')) {
      throw new Error('渠道網址限 http:// 或 https://，不能包含帳密、? 參數或 #。');
    }
    return url.href.replace(/\/$/,'');
  }
  function validate(rows) {
    if (!Array.isArray(rows) || !rows.length) throw new Error('請至少保留一個渠道。');
    const ids=new Set(),names=new Set();
    return rows.map((row,index)=>{
      const id=String(row?.id || 'pwa-'+crypto.randomUUID());
      const name=String(row?.name || '').trim();
      if (!name) throw new Error(`第 ${index+1} 列：請填寫渠道名稱。`);
      if (ids.has(id) || names.has(name.toLowerCase())) throw new Error(`第 ${index+1} 列：渠道名稱不可重複。`);
      ids.add(id);names.add(name.toLowerCase());
      try { return {id,name,url:domain(row.url)}; } catch(error) { throw new Error(`第 ${index+1} 列：${error.message}`); }
    });
  }
  function normalize(rows) {
    if (rows===undefined) return structuredClone(defaults);
    try { return validate(rows); } catch { return structuredClone(defaults); }
  }
  window.PwaUrlModel={defaults,domain,validate,normalize};
})();