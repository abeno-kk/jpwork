import { readFile, writeFile } from 'node:fs/promises';

const configPath = new URL('../google-play-urls.json', import.meta.url);
const resultsPath = new URL('../google-play-results.json', import.meta.url);
const monitors = JSON.parse(await readFile(configPath, 'utf8'));

let previousItems = [];
try {
  const previous = JSON.parse(await readFile(resultsPath, 'utf8'));
  previousItems = Array.isArray(previous.items) ? previous.items : [];
} catch {
  previousItems = [];
}

function decodeHtml(value = '') {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function parseMonitor(entry) {
  const value = typeof entry === 'string' ? { url: entry } : entry;
  const url = new URL(String(value?.url || '').trim());
  const appId = String(url.searchParams.get('id') || '').trim();
  if (url.hostname !== 'play.google.com' || !url.pathname.startsWith('/store/apps/details')) {
    throw new Error('Only Google Play app detail URLs are allowed.');
  }
  if (!/^[A-Za-z0-9_.]+$/.test(appId)) throw new Error('Invalid Google Play app ID.');
  return {
    appId,
    note: String(value?.note || '').trim(),
    url: `https://play.google.com/store/apps/details?id=${encodeURIComponent(appId)}`
  };
}

async function checkApp(monitor) {
  const old = previousItems.find((item) => item.appId === monitor.appId);
  const checkedAt = new Date().toISOString();
  try {
    const pageUrl = `${monitor.url}&hl=en_US&gl=US`;
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error(`Google Play returned HTTP ${response.status}`);
    const html = await response.text();
    const installMatch = html.match(/<div class="ClM7O">([^<]+)<\/div>\s*<div class="g1rdde">Downloads<\/div>/i)
      || html.match(/\["([0-9][0-9.,KMBkmb]*\+?)",0,0,"[^"]+"\]/);
    if (!installMatch) throw new Error('Public download value was not found.');
    const titleMatch = html.match(/<title[^>]*>(.*?)\s+-\s+Apps on Google Play<\/title>/is);
    const installs = decodeHtml(installMatch[1]).trim().replace(/\+$/, '');
    const previousInstalls = old?.installs == null ? '' : String(old.installs);
    return {
      ok: true,
      appId: monitor.appId,
      url: monitor.url,
      note: monitor.note,
      title: titleMatch ? decodeHtml(titleMatch[1].trim()) : (old?.title || monitor.appId),
      installs,
      previousInstalls,
      changed: Boolean(previousInstalls && previousInstalls !== installs),
      checkedAt,
      error: ''
    };
  } catch (error) {
    return {
      ok: false,
      appId: monitor.appId,
      url: monitor.url,
      note: monitor.note,
      title: old?.title || monitor.appId,
      installs: old?.installs ?? '',
      previousInstalls: old?.previousInstalls ?? '',
      changed: false,
      checkedAt,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

const parsed = monitors.map(parseMonitor);
const items = [];
for (const monitor of parsed) {
  items.push(await checkApp(monitor));
  if (parsed.length > 1) await new Promise((resolve) => setTimeout(resolve, 2500));
}

const output = {
  updatedAt: new Date().toISOString(),
  items
};
await writeFile(resultsPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

for (const item of items) {
  console.log(`${item.ok ? 'OK' : 'ERROR'} ${item.appId}: ${item.installs || item.error}`);
}
