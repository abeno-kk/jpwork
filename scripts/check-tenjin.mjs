import { readFile, writeFile } from 'node:fs/promises';

const configPath = new URL('../tenjin-appids.json', import.meta.url);
const resultsPath = new URL('../tenjin-monitor-results.json', import.meta.url);
const apiBase = 'https://cchttps.twelvepacks.top/';
const reportPageUrl = `${apiBase}html/tenjin_report.html`;
const browserHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8'
};
const slot = ['10:00', '15:00', 'manual'].includes(process.env.TENJIN_SLOT)
  ? process.env.TENJIN_SLOT
  : 'manual';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
});

function shanghaiDate(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 86400000);
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function eventCount(text, eventName) {
  const escaped = eventName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`^\\s*[0-9.]+%\\s*,\\s*\\((\\d+)\\)\\s*,\\s*${escaped}\\s*$`, 'im'));
  return match ? Number(match[1]) : 0;
}

async function fetchWithRetry(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const pageResponse = await fetch(reportPageUrl, {
        headers: { ...browserHeaders, Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000)
      });
      if (!pageResponse.ok) throw new Error(`Tenjin report page returned HTTP ${pageResponse.status}`);
      await pageResponse.arrayBuffer();
      const cookies = typeof pageResponse.headers.getSetCookie === 'function'
        ? pageResponse.headers.getSetCookie().map((value) => value.split(';', 1)[0]).join('; ')
        : '';
      const response = await fetch(url, {
        headers: {
          ...browserHeaders,
          Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8',
          Referer: reportPageUrl,
          ...(cookies ? { Cookie: cookies } : {})
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000)
      });
      const text = await response.text();
      if (!response.ok) {
        const detail = text.replace(/\s+/g, ' ').trim().slice(0, 160);
        throw new Error(`Tenjin returned HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
      }
      return text;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
}

const config = JSON.parse(await readFile(configPath, 'utf8'));
const appIds = [...new Set((Array.isArray(config.appIds) ? config.appIds : []).map(String))];
if (!appIds.length || appIds.some((id) => !/^\d{6,15}$/.test(id))) {
  throw new Error('tenjin-appids.json must contain one or more 6-15 digit APPIDs.');
}

let previousChecks = [];
try {
  const previous = JSON.parse(await readFile(resultsPath, 'utf8'));
  previousChecks = Array.isArray(previous.checks) ? previous.checks : [];
} catch {
  previousChecks = [];
}

const date = shanghaiDate();
const start = shanghaiDate(-1);
const checks = [];

for (const appId of appIds) {
  const checkedAt = new Date().toISOString();
  const record = { appId, date, slot, count: null, c4EnterOptCount: null, checkedAt, start, end: date, error: '' };
  try {
    const query = new URLSearchParams({ func: 'tenjin_report', form: 'csv', start, end: date, app_id: appId });
    const text = await fetchWithRetry(`${apiBase}?${query}`);
    if (!/progress\s*,\s*count\s*,\s*event/i.test(text)) throw new Error('Unexpected Tenjin response format.');
    record.count = eventCount(text, 'registersuccess_all');
    record.c4EnterOptCount = eventCount(text, 'c4_enter_opt');
  } catch (error) {
    record.error = error instanceof Error ? error.message : String(error);
  }
  checks.push(record);
}

const allChecks = [...previousChecks, ...checks].slice(-1000);
const runOk = checks.every((item) => !item.error);
const output = {
  ok: true, runOk, version: 1, appIds, checks: allChecks, date,
  timezone: 'Asia/Shanghai', slots: ['10:00', '15:00'], updatedAt: new Date().toISOString()
};
await writeFile(resultsPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

for (const item of checks) {
  console.log(`${item.error ? 'ERROR' : 'OK'} ${item.appId}: register=${item.count ?? '-'}, c4=${item.c4EnterOptCount ?? '-'}${item.error ? `, ${item.error}` : ''}`);
}
if (!runOk) process.exitCode = 1;
