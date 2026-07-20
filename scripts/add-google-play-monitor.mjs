import { readFile, writeFile, appendFile } from 'node:fs/promises';

const configPath = process.env.GOOGLE_PLAY_CONFIG_PATH || new URL('../google-play-urls.json', import.meta.url);
const markerPattern = /<!--\s*google-play-monitor-request\s*([\s\S]*?)\s*-->/i;

function parseRequest(body) {
  const match = String(body || '').match(markerPattern);
  if (!match) throw new Error('Monitor request data was not found.');

  let request;
  try {
    request = JSON.parse(match[1]);
  } catch {
    throw new Error('Monitor request data is invalid.');
  }

  let url;
  try {
    url = new URL(String(request.url || '').trim());
  } catch {
    throw new Error('Google Play URL is invalid.');
  }
  if (url.hostname !== 'play.google.com' || url.pathname !== '/store/apps/details') {
    throw new Error('Only Google Play app detail URLs are allowed.');
  }

  const appId = String(url.searchParams.get('id') || '').trim();
  if (!/^[A-Za-z0-9_.]+$/.test(appId)) throw new Error('Google Play app ID is invalid.');

  return {
    appId,
    url: `https://play.google.com/store/apps/details?id=${encodeURIComponent(appId)}`,
    note: String(request.note || '').trim().slice(0, 120)
  };
}

async function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  await appendFile(process.env.GITHUB_OUTPUT, `${name}=${value}\n`, 'utf8');
}

const request = parseRequest(process.env.ISSUE_BODY);
const monitors = JSON.parse(await readFile(configPath, 'utf8'));
if (!Array.isArray(monitors)) throw new Error('google-play-urls.json must contain an array.');

const duplicate = monitors.some((item) => {
  try {
    return new URL(item.url).searchParams.get('id') === request.appId;
  } catch {
    return false;
  }
});

await setOutput('app_id', request.appId);
if (duplicate) {
  await setOutput('status', 'duplicate');
  console.log(`${request.appId} is already monitored.`);
} else {
  monitors.push({ url: request.url, note: request.note });
  await writeFile(configPath, `${JSON.stringify(monitors, null, 2)}\n`, 'utf8');
  await setOutput('status', 'added');
  console.log(`Added ${request.appId}.`);
}
