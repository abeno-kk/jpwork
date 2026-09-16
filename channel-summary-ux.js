/* UI improvements for the existing channel summary. No bundled API endpoint. */
function channelSyncAdvice(error) {
  const text = String(error || '');
  if (/Unauthorized|403|401|拒絕|権限|permission|access denied/i.test(text))
    return '資料來源拒絕存取。請確認 API 的存取設定，以及部署帳號是否已授權讀取試算表。';
  if (/404|not found|不存在/i.test(text))
    return '找不到資料來源。請確認完整網址以 /exec 結尾，且部署仍有效。';
  if (/逾時|timeout/i.test(text))
    return '連線逾時。請稍後重試；若持續發生，請檢查網路與 API 執行紀錄。';
  if (/格式|不支援|Unsupported/i.test(text))
    return '資料格式不符合需求。請確認使用的是渠道統整表的 API。';
  if (/無法連線|Failed to fetch|Network/i.test(text))
    return '無法連上資料來源。請檢查網路、網址及 API 的存取權限。';
  return '同步未完成。請檢查資料來源設定，並查看下方錯誤詳細資訊。';
}
function formatChannelMetric(value) {
  const text = String(value ?? '').trim();
  if (!text || !/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(text)) return text || '—';
  const parts = text.replace(/,/g, '').split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
function initChannelSummaryUX() {
  const view = document.getElementById('channel-summary-view');
  if (!view || view.dataset.uxReady) return;
  view.dataset.uxReady = 'true';
  const source = document.createElement('details');
  source.id = 'channel-source-settings';
  source.className = 'channel-source-settings';
  const summary = document.createElement('summary');
  summary.textContent = '資料來源設定';
  const controls = document.createElement('div');
  controls.className = 'channel-source-controls';
  source.append(summary, controls);
  const mode = document.getElementById('channel-summary-sync-mode');
  const url = document.getElementById('channel-summary-sync-url');
  const save = document.getElementById('channel-summary-sync-save-btn');
  mode.setAttribute('aria-label', '資料來源類型');
  url.setAttribute('aria-label', '資料來源網址');
  url.autocomplete = 'off';
  url.spellcheck = false;
  url.placeholder = '貼上完整的 /exec 網址';
  for (const [control, title] of [[mode,'來源類型'],[url,'API 或 CSV 網址']]) {
    const label = document.createElement('label');
    const text = document.createElement('span');
    text.textContent = title;
    label.append(text, control);
    controls.append(label);
    control.addEventListener('input', () => { mode.dataset.dirty = url.dataset.dirty = 'true'; });
  }
  controls.append(save);
  const help = document.getElementById('channel-summary-help');
  help.hidden = false;
  help.textContent = '填入完整網址後，按「儲存同步來源」測試連線。設定只存於此瀏覽器；請妥善保管 API 網址。資料不會自動同步，更新時請按「重新整理」。';
  source.append(help);
  const header = view.querySelector('.panel-header');
  header.before(source);
  const labels = {
    'channel-summary-search':'搜尋 APPID、渠道名稱、渠道或版本',
    'channel-summary-channel-filter':'渠道',
    'channel-summary-version-filter':'版本',
    'channel-summary-confirm-filter':'確認狀態',
    'channel-summary-joint-channel-filter':'聯運渠道',
    'channel-summary-package-name-filter':'包名稱'
  };
  Object.entries(labels).forEach(([id,label]) => document.getElementById(id)?.setAttribute('aria-label',label));
  const toolbar = header.querySelector('.history-toolbar');
  const densityLabel = document.createElement('label');
  densityLabel.className = 'channel-density-control';
  densityLabel.textContent = '表格密度 ';
  const density = document.createElement('select');
  density.id = 'channel-density';
  density.setAttribute('aria-label','表格密度');
  density.innerHTML = '<option value="comfortable">舒適</option><option value="compact">緊湊</option>';
  try { density.value = localStorage.getItem('jpwork-channel-density') === 'compact' ? 'compact' : 'comfortable'; } catch (_) {}
  view.dataset.density = density.value;
  density.addEventListener('change', () => {
    view.dataset.density = density.value;
    try { localStorage.setItem('jpwork-channel-density', density.value); } catch (_) {}
  });
  densityLabel.append(density);
  toolbar.append(densityLabel);
  const bar = document.createElement('div');
  bar.className = 'channel-filter-summary';
  bar.innerHTML = '<span id="channel-match-count" role="status" aria-live="polite"></span><div id="channel-filter-chips" aria-label="目前篩選條件"></div>';
  header.after(bar);
  const scroll = view.querySelector('.table-wrap');
  scroll.classList.add('channel-table-scroll');
  scroll.tabIndex = 0;
  scroll.setAttribute('role','region');
  scroll.setAttribute('aria-label','渠道統整表，可使用方向鍵捲動');
  const caption = document.createElement('caption');
  caption.className = 'visually-hidden';
  caption.textContent = '渠道統整表。欄名按鈕可排序，表格可橫向及縱向捲動。';
  scroll.querySelector('table').prepend(caption);
  const hint = document.createElement('p');
  hint.className = 'channel-scroll-hint';
  hint.textContent = '可左右捲動查看更多欄位；前兩個可見欄位固定顯示。加總依目前篩選結果計算。';
  scroll.before(hint);
  document.getElementById('channel-summary-sync-status').setAttribute('role','status');
  document.getElementById('undo-banner').setAttribute('role','status');
  document.getElementById('undo-banner').setAttribute('aria-live','polite');
  const menu = document.createElement('button');
  menu.type = 'button';
  menu.id = 'mobile-nav-toggle';
  menu.className = 'secondary-button mobile-nav-toggle';
  menu.textContent = '展開功能選單';
  menu.setAttribute('aria-expanded','false');
  menu.setAttribute('aria-controls','dashboard-nav');
  const nav = document.querySelector('.sidebar .nav');
  nav.id = 'dashboard-nav';
  document.querySelector('.sidebar .brand').after(menu);
  const closeMenu = () => {
    document.querySelector('.sidebar').classList.remove('mobile-nav-open');
    menu.setAttribute('aria-expanded','false');
    menu.textContent = '展開功能選單';
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    document.querySelector('.sidebar').classList.toggle('mobile-nav-open',open);
    menu.setAttribute('aria-expanded',String(open));
    menu.textContent = open ? '收合功能選單' : '展開功能選單';
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('.nav-button[data-view]') && matchMedia('(max-width: 1100px)').matches) {
      closeMenu();
      document.getElementById('page-title').setAttribute('tabindex','-1');
      document.getElementById('page-title').focus();
    }
  });
  nav.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); menu.focus(); } });
}
function enhanceChannelSummaryView(filteredRows) {
  initChannelSummaryUX();
  const view = document.getElementById('channel-summary-view');
  const data = state.channelSummary;
  const hasData = Boolean(data.lastFetchedAt);
  const source = document.getElementById('channel-source-settings');
  if (!source.dataset.initialized) {
    source.open = !state.data.channelSummarySync?.url;
    source.dataset.initialized = 'true';
  }
  if (data.error) source.open = true;
  if (!hasData) {
    ['channel-summary-count','channel-summary-yesterday-new-total','channel-summary-yesterday-dau-total','channel-summary-yesterday-recharge-total']
      .forEach(id => { document.getElementById(id).textContent = '—'; });
  }
  const time = hasData ? new Date(data.lastFetchedAt).toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
  const status = document.getElementById('channel-summary-sync-status');
  status.dataset.state = data.error ? 'error' : data.loading ? 'loading' : hasData ? 'ready' : 'empty';
  status.textContent = data.loading ? '正在同步…' + (time ? ' · 目前顯示 ' + time + ' 的資料' : '')
    : data.error ? '同步失敗' + (time ? ' · 保留 ' + time + ' 的資料' : ' · 尚未取得資料')
    : hasData ? '最後成功同步 ' + time : '尚未同步';
  const refresh = document.getElementById('channel-summary-refresh-btn');
  refresh.disabled = data.loading;
  refresh.textContent = data.loading ? '同步中…' : '重新整理';
  document.getElementById('channel-summary-sync-save-btn').disabled = data.loading;
  view.querySelector('.channel-table-scroll').setAttribute('aria-busy',String(data.loading));
  document.getElementById('channel-summary-help').hidden = false;
  const message = document.getElementById('channel-summary-message');
  if (data.error) {
    message.replaceChildren();
    const title = document.createElement('p');
    title.textContent = channelSyncAdvice(data.error);
    const detail = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = '錯誤詳細資訊';
    const raw = document.createElement('pre');
    // Do not echo an API URL returned in an error into the visible status.
    raw.textContent = String(data.error).replace(/https?:\/\/[^\s"'<>]+/g,'[資料來源網址]');
    detail.append(summary,raw);
    const retry = document.createElement('button');
    retry.type = 'button'; retry.className = 'secondary-button'; retry.textContent = '重新測試填入的來源';
    retry.addEventListener('click', () => document.getElementById('channel-summary-sync-save-btn').click());
    message.append(title,detail,retry);
  } else if (!data.loading && !filteredRows.length) {
    message.hidden = false;
    message.textContent = !hasData ? '尚未取得資料。請先設定資料來源，再測試連線。'
      : data.rows.length ? '沒有符合條件的資料。可移除下方篩選標籤，或按「清除條件」。'
      : '同步成功，來源目前沒有資料。';
  }
  document.getElementById('channel-match-count').textContent = hasData ? '符合 ' + filteredRows.length + '／' + data.rows.length + ' 筆' : '尚未取得資料';
  const chips = document.getElementById('channel-filter-chips');
  chips.replaceChildren();
  const filters = {search:'搜尋',channel:'渠道',version:'版本',versionChecked:'確認',jointChannel:'聯運',packageName:'包名稱'};
  Object.entries(filters).forEach(([key,label]) => {
    if (!data[key]) return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'channel-filter-chip';
    button.textContent = label + '：' + data[key] + ' ×';
    button.setAttribute('aria-label','移除' + label + '篩選：' + data[key]);
    button.addEventListener('click', () => { data[key] = ''; renderChannelSummaryView(); document.getElementById('channel-summary-search').focus(); });
    chips.append(button);
  });
  const columns = getChannelSummaryColumns().filter(column => !isColumnHidden('channelSummary',column.id));
  const numeric = columns.map(column => !/appid|id$|version|package|channel|phone/i.test(column.id)
    && /新增|DAU|充值|金額|用戶|人数|人數|数量|數量|營收|收入|支出|成本|费用|費用|消費|new|dau|recharge|amount|revenue|cost|count/i.test(column.label + ' ' + column.id)
    && isChannelSummaryNumericColumn(column.id));
  Array.from(els.channelSummaryTableHead.querySelectorAll('th')).forEach((th,index) => {
    th.scope = 'col';
    th.setAttribute('aria-sort',data.sortKey === columns[index]?.id ? data.sortDirection === 'asc' ? 'ascending' : 'descending' : 'none');
    th.classList.toggle('metric-cell',Boolean(numeric[index]));
  });
  Array.from(els.channelSummaryTableBody.rows).forEach(tr => Array.from(tr.cells).forEach((cell,index) => {
    if (numeric[index]) { cell.classList.add('metric-cell'); cell.textContent = formatChannelMetric(cell.textContent); }
    cell.title = cell.textContent;
  }));
}
