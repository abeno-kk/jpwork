(function () {
  'use strict';

  var REPO_URL = 'https://github.com/abeno-kk/jpwork';
  var CONFIG_URL = REPO_URL + '/edit/main/tenjin-appids.json';
  var CONTENTS_API_URL = 'https://api.github.com/repos/abeno-kk/jpwork/contents/tenjin-monitor-results.json?ref=main';
  var els = {
    input: document.getElementById('tenjin-appids-input'),
    configure: document.getElementById('tenjin-save-appids-btn'),
    run: document.getElementById('tenjin-check-now-btn'),
    status: document.getElementById('tenjin-monitor-status'),
    message: document.getElementById('tenjin-monitor-message'),
    body: document.getElementById('tenjin-monitor-body'),
    empty: document.getElementById('tenjin-monitor-empty')
  };
  if (!els.body) return;

  var snapshot = { appIds: [], checks: [], date: '' };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function formatDate(value) {
    if (!value) return '—';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('zh-TW', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  }

  function formatTime(value) {
    if (!value) return '尚未執行';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '尚未執行';
    return date.toLocaleTimeString('zh-TW', {
      timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  }

  function setMessage(text, isError) {
    els.message.hidden = !text;
    els.message.textContent = text || '';
    els.message.classList.toggle('is-error', Boolean(isError));
  }

  function checksFor(appId) {
    return (Array.isArray(snapshot.checks) ? snapshot.checks : []).filter(function (item) {
      return String(item.appId) === String(appId);
    }).sort(function (a, b) { return String(b.checkedAt || '').localeCompare(String(a.checkedAt || '')); });
  }

  function scheduledCheck(appId, slot) {
    return checksFor(appId).find(function (check) {
      return check.date === snapshot.date && check.slot === slot;
    });
  }

  function metricValue(item, key) {
    if (!item || item.error || !Object.prototype.hasOwnProperty.call(item, key)) return '—';
    return String(item[key] == null ? 0 : item[key]);
  }

  function metricsCell(item) {
    return [
      '<div class="tenjin-metric-lines">',
      '<span><small>完成註冊</small><strong class="tenjin-count-badge is-latest">' + escapeHtml(metricValue(item, 'count')) + '</strong></span>',
      '<span><small>進入驗證碼頁</small><strong class="tenjin-count-badge is-latest">' + escapeHtml(metricValue(item, 'c4EnterOptCount')) + '</strong></span>',
      '</div>'
    ].join('');
  }

  function scheduledTimeCell(item) {
    if (!item) return '<span class="tenjin-schedule-pending">尚未執行</span>';
    if (item.error) return '<span class="tenjin-schedule-error">執行失敗<br>' + escapeHtml(formatTime(item.checkedAt)) + '</span>';
    return '<time class="tenjin-schedule-time" datetime="' + escapeHtml(item.checkedAt || '') + '">' +
      escapeHtml(formatTime(item.checkedAt)) + '</time>';
  }

  function render() {
    var ids = Array.isArray(snapshot.appIds) ? snapshot.appIds : [];
    els.empty.hidden = ids.length > 0;
    els.input.value = ids.join('\n');
    els.body.innerHTML = ids.map(function (appId, index) {
      var latest = checksFor(appId)[0];
      var statusText = latest ? (latest.error || '正常') : '等待第一次查詢';
      var statusClass = latest && latest.error ? ' is-error' : '';
      return [
        '<tr>',
        '<td>' + (index + 1) + '</td>',
        '<td><strong class="tenjin-appid">' + escapeHtml(appId) + '</strong></td>',
        '<td>' + scheduledTimeCell(scheduledCheck(appId, '10:00')) + '</td>',
        '<td>' + scheduledTimeCell(scheduledCheck(appId, '15:00')) + '</td>',
        '<td>' + metricsCell(latest) + '</td>',
        '<td>' + escapeHtml(formatDate(latest && latest.checkedAt)) + '</td>',
        '<td><span class="google-play-row-status' + statusClass + '">' + escapeHtml(statusText) + '</span></td>',
        '<td><a class="secondary-button compact-mini-button tenjin-action-link" href="' + CONFIG_URL + '" target="_blank" rel="noopener">設定</a></td>',
        '</tr>'
      ].join('');
    }).join('');
    els.status.textContent = snapshot.updatedAt
      ? 'GitHub 最近更新：' + formatDate(snapshot.updatedAt)
      : '固定查詢：每日 10:00、15:00（北京時間）';
  }

  async function refresh(quiet) {
    if (!quiet) {
      els.run.disabled = true;
      els.run.textContent = '讀取最新結果中…';
      setMessage('正在讀取 GitHub main 的最新結果…', false);
    }
    try {
      var githubMode = location.hostname.endsWith('github.io');
      var resultsUrl = githubMode
        ? CONTENTS_API_URL + '&t=' + Date.now()
        : './tenjin-monitor-results.json?t=' + Date.now();
      var response = await fetch(resultsUrl, {
        cache: 'no-store',
        headers: githubMode ? { Accept: 'application/vnd.github+json' } : {}
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      if (githubMode) {
        var file = await response.json();
        var binary = window.atob(String(file.content || '').replace(/\s/g, ''));
        var bytes = Uint8Array.from(binary, function (char) { return char.charCodeAt(0); });
        snapshot = JSON.parse(new TextDecoder().decode(bytes));
      } else {
        snapshot = await response.json();
      }
      render();
      if (!quiet) setMessage('已讀取 GitHub 最新結果。', false);
    } catch (error) {
      els.status.textContent = 'GitHub 查詢結果讀取失敗';
      setMessage('目前無法讀取 Tenjin 結果：' + (error.message || error), true);
    } finally {
      if (!quiet) {
        els.run.disabled = false;
        els.run.textContent = '重新整理結果';
      }
    }
  }

  els.configure.addEventListener('click', function () { window.open(CONFIG_URL, '_blank', 'noopener'); });
  els.run.addEventListener('click', function () { void refresh(false); });
  void refresh(false);
  window.setInterval(function () { void refresh(true); }, 60 * 1000);
})();
