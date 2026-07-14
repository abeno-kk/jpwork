


(function () {
  'use strict';

  var els = {
    body: document.getElementById('google-play-monitor-body'),
    empty: document.getElementById('google-play-empty'),
    count: document.getElementById('google-play-monitor-count'),
    changeCount: document.getElementById('google-play-change-count'),
    url: document.getElementById('google-play-url-input'),
    label: document.getElementById('google-play-label-input'),
    add: document.getElementById('google-play-add-btn'),
    checkAll: document.getElementById('google-play-check-all-btn'),
    interval: document.getElementById('google-play-interval-select'),
    serviceStatus: document.getElementById('google-play-service-status'),
    notification: document.getElementById('google-play-notification-btn')
  };
  if (!els.body) return;
  var checkingAll = false;
  var githubMode = location.hostname === 'abeno-kk.github.io';
  var githubWorkflowUrl = 'https://github.com/abeno-kk/jpwork/actions/workflows/google-play-monitor.yml';
  var githubConfigUrl = 'https://github.com/abeno-kk/jpwork/edit/main/google-play-urls.json';
  var githubResultsUrl = 'https://raw.githubusercontent.com/abeno-kk/jpwork/main/google-play-results.json';

  function monitors() {
    if (!Array.isArray(state.data.googlePlayMonitors)) state.data.googlePlayMonitors = [];
    return state.data.googlePlayMonitors;
  }

  function settings() {
    if (!state.data.googlePlayMonitorSettings) state.data.googlePlayMonitorSettings = { intervalMinutes: 60 };
    return state.data.googlePlayMonitorSettings;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function parsePlayUrl(raw) {
    var url;
    try { url = new URL(String(raw || '').trim()); }
    catch (error) { throw new Error('請貼上完整的 Google Play 網址'); }
    if (url.hostname !== 'play.google.com' || !url.pathname.startsWith('/store/apps/details')) {
      throw new Error('這不是 Google Play App 詳情網址');
    }
    var appId = String(url.searchParams.get('id') || '').trim();
    if (!/^[A-Za-z0-9_.]+$/.test(appId)) throw new Error('網址中找不到有效的 App ID');
    return {
      appId: appId,
      url: 'https://play.google.com/store/apps/details?id=' + encodeURIComponent(appId)
    };
  }

  function formatDate(value) {
    if (!value) return '尚未檢查';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '尚未檢查';
    return date.toLocaleString('zh-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  function render() {
    var rows = monitors();
    els.count.textContent = String(rows.length);
    els.changeCount.textContent = String(rows.filter(function (item) { return item.status === 'changed'; }).length);
    els.empty.hidden = rows.length > 0;
    els.interval.value = String(settings().intervalMinutes || 0);
    els.notification.hidden = !('Notification' in window);
    if ('Notification' in window && Notification.permission === 'granted') {
      els.notification.textContent = '桌面通知已開啟';
    }
    els.body.innerHTML = rows.map(function (item, index) {
      var title = item.title || item.label || item.appId || '尚未取得 App 名稱';
      var note = item.label && item.label !== title ? item.label : '';
      var badgeClass = item.installs ? '' : ' is-empty';
      var statusClass = item.status === 'changed' ? ' is-changed' : item.status === 'error' ? ' is-error' : '';
      var statusText = item.status === 'checking' ? '檢查中…'
        : item.status === 'changed' ? '已從 ' + escapeHtml(item.previousInstalls || '未記錄') + ' 變更'
        : item.status === 'error' ? escapeHtml(item.error || '檢查失敗')
        : item.status === 'ok' ? '正常' : '等待第一次檢查';
      return [
        '<tr data-google-play-id="' + escapeHtml(item.id) + '">',
        '<td>' + (index + 1) + '</td>',
        '<td class="google-play-app-cell"><strong class="google-play-app-title">' + escapeHtml(title) + '</strong>',
        '<a class="google-play-app-meta" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.appId || item.url) + '</a></td>',
        '<td class="google-play-note-cell"><input class="google-play-note-input" data-google-play-note type="text" value="' + escapeHtml(note) + '" placeholder="輸入備註"></td>',
        '<td><span class="google-play-install-badge' + badgeClass + '">' + escapeHtml(item.installs || '—') + '</span></td>',
        '<td>' + escapeHtml(item.previousInstalls || '—') + '</td>',
        '<td>' + escapeHtml(formatDate(item.lastCheckedAt)) + '</td>',
        '<td><span class="google-play-row-status' + statusClass + '">' + statusText + '</span></td>',
        '<td><div class="google-play-row-actions">',
        '<button class="secondary-button compact-mini-button" data-google-play-action="check" type="button">檢查</button>',
        '<button class="secondary-button compact-mini-button" data-google-play-action="edit" type="button">修改</button>',
        '<button class="danger-button compact-mini-button" data-google-play-action="delete" type="button">刪除</button>',
        '</div></td></tr>'
      ].join('');
    }).join('');
  }

  function setServiceStatus(message, isError) {
    els.serviceStatus.textContent = message;
    els.serviceStatus.classList.toggle('is-error', Boolean(isError));
  }

  function openGitHubCheck() {
    window.open(githubWorkflowUrl, '_blank', 'noopener,noreferrer');
    setServiceStatus('已開啟 GitHub；按 Run workflow 即可立即檢查', false);
  }

  async function syncFromGitHub() {
    if (!githubMode) return;
    try {
      var response = await fetch(githubResultsUrl + '?t=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('尚未產生第一次檢查結果');
      var payload = await response.json();
      var items = Array.isArray(payload.items) ? payload.items : [];
      state.data.googlePlayMonitors = normalizeGooglePlayMonitors(items.map(function (result) {
        return {
          id: result.appId,
          url: result.url,
          appId: result.appId,
          label: result.note || '',
          title: result.title || '',
          installs: result.installs == null ? '' : String(result.installs),
          previousInstalls: result.previousInstalls == null ? '' : String(result.previousInstalls),
          lastCheckedAt: result.checkedAt || payload.updatedAt || '',
          status: result.ok ? (result.changed ? 'changed' : 'ok') : 'error',
          error: result.error || ''
        };
      }));
      saveState();
      render();
      setServiceStatus('GitHub 最後完成：' + formatDate(payload.updatedAt), false);
    } catch (error) {
      setServiceStatus(error.message || '無法讀取 GitHub 檢查結果', true);
    }
  }

  function notifyChange(item, previous) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification('Google Play 下載級距有變動', {
      body: (item.title || item.label || item.appId) + '：' + (previous || '未記錄') + ' → ' + item.installs
    });
  }

  async function checkMonitor(item) {
    if (githubMode) {
      openGitHubCheck();
      return;
    }
    item.status = 'checking';
    item.error = '';
    render();
    try {
      var sameLocalService = location.protocol === 'http:' && location.hostname === '127.0.0.1' && location.port === '5500';
      var apiOrigin = sameLocalService ? '' : 'http://127.0.0.1:5500';
      var response = await fetch(apiOrigin + '/api/google-play?url=' + encodeURIComponent(item.url), {
        headers: { Accept: 'application/json' }
      });
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok || !payload.ok) throw new Error(payload.error || '檢查失敗（' + response.status + '）');
      var checkedAt = new Date().toISOString();
      var previous = item.installs;
      item.url = payload.url || item.url;
      item.appId = payload.appId || item.appId;
      item.title = payload.title || item.title;
      item.lastCheckedAt = checkedAt;
      item.error = '';
      item.previousInstalls = previous && previous !== payload.installs ? previous : item.previousInstalls;
      item.installs = payload.installs;
      item.history = Array.isArray(item.history) ? item.history : [];
      item.history.push({ at: checkedAt, installs: payload.installs });
      item.history = item.history.slice(-100);
      if (previous && previous !== payload.installs) {
        item.status = 'changed';
        item.lastChangedAt = checkedAt;
        notifyChange(item, previous);
      } else {
        item.status = 'ok';
      }
      saveState();
      setServiceStatus('最後完成：' + formatDate(checkedAt), false);
    } catch (error) {
      item.status = 'error';
      item.error = error && error.message ? error.message : '檢查失敗';
      item.lastCheckedAt = new Date().toISOString();
      saveState();
      setServiceStatus(item.error.includes('Failed to fetch')
        ? '請使用「啟動總儀表板.cmd」開啟監控服務' : item.error, true);
    } finally {
      render();
    }
  }

  async function checkAll() {
    if (githubMode) {
      openGitHubCheck();
      return;
    }
    if (checkingAll || !monitors().length) return;
    checkingAll = true;
    els.checkAll.disabled = true;
    els.checkAll.textContent = '檢查中…';
    for (var i = 0; i < monitors().length; i += 1) await checkMonitor(monitors()[i]);
    checkingAll = false;
    els.checkAll.disabled = false;
    els.checkAll.textContent = '全部立即檢查';
  }

  function addMonitor() {
    try {
      var parsed = parsePlayUrl(els.url.value);
      if (githubMode) {
        window.alert('GitHub 每日監控網址需加入網址清單。接著會開啟清單編輯頁，加入後按 Commit changes。');
        window.open(githubConfigUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      var existing = monitors().find(function (item) {
        return item.appId === parsed.appId || item.url === parsed.url;
      });
      if (existing) throw new Error('這個 App 已在監控清單中');
      var item = normalizeGooglePlayMonitors([{
        url: parsed.url, appId: parsed.appId, label: els.label.value.trim()
      }])[0];
      monitors().push(item);
      saveState();


      els.url.value = '';
      els.label.value = '';
      render();
      void checkMonitor(item);
    } catch (error) {
      window.alert(error.message || '無法加入監控');
    }
  }

  function editMonitor(item) {
    var nextUrl = window.prompt('修改 Google Play 網址', item.url);
    if (nextUrl === null) return;
    var parsed;
    try { parsed = parsePlayUrl(nextUrl); }
    catch (error) { window.alert(error.message); return; }
    item.url = parsed.url;
    item.appId = parsed.appId;
    item.title = '';
    item.status = 'idle';
    item.error = '';
    saveState();
    render();
    void checkMonitor(item);
  }

  function deleteMonitor(item) {
    if (!window.confirm('確定刪除「' + (item.title || item.label || item.appId) + '」的監控與歷史紀錄嗎？')) return;
    state.data.googlePlayMonitors = monitors().filter(function (candidate) { return candidate.id !== item.id; });
    saveState();
    render();
  }

  function maybeAutoCheck() {
    if (githubMode) return;
    var interval = Number(settings().intervalMinutes || 0);
    if (!interval || state.view !== 'google-play-monitor' || checkingAll) return;
    var dueBefore = Date.now() - interval * 60 * 1000;
    var due = monitors().some(function (item) {
      return !item.lastCheckedAt || new Date(item.lastCheckedAt).getTime() <= dueBefore;
    });
    if (due) void checkAll();
  }

  els.add.addEventListener('click', addMonitor);
  els.url.addEventListener('keydown', function (event) { if (event.key === 'Enter') addMonitor(); });
  els.checkAll.addEventListener('click', function () { void checkAll(); });
  els.interval.addEventListener('change', function () {
    settings().intervalMinutes = Number(els.interval.value || 0);
    saveState();
    maybeAutoCheck();
  });
  els.notification.addEventListener('click', async function () {
    if (!('Notification' in window)) return;
    var permission = await Notification.requestPermission();
    els.notification.textContent = permission === 'granted' ? '桌面通知已開啟' : '桌面通知未允許';
  });
  els.body.addEventListener('change', function (event) {
    var input = event.target.closest('[data-google-play-note]');
    var row = event.target.closest('[data-google-play-id]');
    if (!input || !row) return;
    var item = monitors().find(function (candidate) { return candidate.id === row.dataset.googlePlayId; });
    if (!item) return;
    item.label = String(input.value || '').trim();
    saveState();
    render();
  });

  els.body.addEventListener('click', function (event) {
    var button = event.target.closest('[data-google-play-action]');
    var row = event.target.closest('[data-google-play-id]');
    if (!button || !row) return;
    var item = monitors().find(function (candidate) { return candidate.id === row.dataset.googlePlayId; });
    if (!item) return;
    if (button.dataset.googlePlayAction === 'check') void checkMonitor(item);
    if (button.dataset.googlePlayAction === 'edit') editMonitor(item);
    if (button.dataset.googlePlayAction === 'delete') deleteMonitor(item);
  });
  var navButton = document.querySelector('[data-view="google-play-monitor"]');
  if (navButton) navButton.addEventListener('click', function () {
    setTimeout(githubMode ? syncFromGitHub : maybeAutoCheck, 0);
  });

  render();
  if (githubMode) {
    els.interval.disabled = true;
    els.checkAll.textContent = '前往 GitHub 立即檢查';
    setServiceStatus('每日早上 8:00 由 GitHub 自動檢查', false);
    void syncFromGitHub();
  }
  window.setInterval(maybeAutoCheck, 60 * 1000);
})();
