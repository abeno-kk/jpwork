



param([int]$Port = 5500, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($PSScriptRoot)
$prefix = 'http://127.0.0.1:' + $Port + '/'
$listener = New-Object Net.HttpListener
$listener.Prefixes.Add($prefix)
$tenjinDataPath = Join-Path $root 'tenjin-monitor-data.json'
$tenjinApiBase = 'https://cchttps.twelvepacks.top/'
$tenjinSlots = @('10:00', '15:00')

# 讀取 tenjin-monitor-config.json；若讀取失敗，保留上方的硬編碼預設值
$configPath = Join-Path $root 'tenjin-monitor-config.json'
if (Test-Path -LiteralPath $configPath -PathType Leaf) {
  try {
    $config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $tenjinApiBase = [string]$config.tenjinApiBase
    $tenjinSlots = @($config.tenjinSlots | ForEach-Object { [string]$_ })
  } catch {
    Write-Warning ('Unable to read Tenjin config; keeping hardcoded defaults: ' + $_.Exception.Message)
  }
}

function Send-Bytes($response, [int]$status, [string]$contentType, [byte[]]$body) {
  $response.StatusCode = $status
  $response.Headers['Access-Control-Allow-Origin'] = '*'
  $response.ContentType = $contentType
  $response.ContentLength64 = $body.Length
  $response.OutputStream.Write($body, 0, $body.Length)
  $response.OutputStream.Close()
}

function Send-Json($response, [int]$status, $data) {
  $json = $data | ConvertTo-Json -Depth 8 -Compress
  Send-Bytes $response $status 'application/json; charset=utf-8' ([Text.Encoding]::UTF8.GetBytes($json))
}

function Get-ShanghaiNow {
  $zone = [TimeZoneInfo]::FindSystemTimeZoneById('China Standard Time')
  return [TimeZoneInfo]::ConvertTimeFromUtc([DateTime]::UtcNow, $zone)
}

function Read-TenjinState {
  $state = [ordered]@{ version = 1; appIds = @(); checks = @() }
  if (-not (Test-Path -LiteralPath $tenjinDataPath -PathType Leaf)) { return $state }
  try {
    $raw = Get-Content -LiteralPath $tenjinDataPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $state.appIds = @($raw.appIds | ForEach-Object { [string]$_ } |
      Where-Object { $_ -match '^\d{6,15}$' } | Select-Object -Unique)
    $state.checks = @($raw.checks | Where-Object { $_ -and ([string]$_.appId) -match '^\d{6,15}$' } |
      Select-Object -Last 1000)
  } catch {
    Write-Warning ('Unable to read Tenjin monitor data; using an empty state: ' + $_.Exception.Message)
  }
  return $state
}

function Save-TenjinState($state) {
  $json = $state | ConvertTo-Json -Depth 8
  $tempPath = $tenjinDataPath + '.tmp'
  [IO.File]::WriteAllText($tempPath, $json, (New-Object Text.UTF8Encoding($false)))
  Move-Item -LiteralPath $tempPath -Destination $tenjinDataPath -Force
}

function Get-TenjinPublicState {
  $state = Read-TenjinState
  $now = Get-ShanghaiNow
  return [ordered]@{
    ok = $true
    appIds = @($state.appIds)
    checks = @($state.checks)
    date = $now.ToString('yyyy-MM-dd')
    timezone = 'Asia/Shanghai'
    slots = @($tenjinSlots)
  }
}

function Get-TenjinRegistrationCount([string]$appId, [DateTime]$shanghaiNow) {
  if ($appId -notmatch '^\d{6,15}$') { throw 'Invalid APPID format.' }
  $start = $shanghaiNow.Date.AddDays(-1).ToString('yyyy-MM-dd')
  $end = $shanghaiNow.Date.ToString('yyyy-MM-dd')
  $query = '?func=tenjin_report&form=csv&start=' + $start + '&end=' + $end + '&app_id=' + [Uri]::EscapeDataString($appId)
  $headers = @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' }
  $response = $null
  $lastError = $null
  for ($attempt = 1; $attempt -le 2; $attempt++) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri ($tenjinApiBase + $query) -Headers $headers -TimeoutSec 12
      break
    } catch {
      $lastError = $_.Exception
      if ($attempt -lt 2) { Start-Sleep -Milliseconds 800 }
    }
  }
  if (-not $response) {
    $isTimeout = $lastError -and (
      $lastError.Status -eq [Net.WebExceptionStatus]::Timeout -or
      $lastError.Message -match 'timed out|timeout|超时|逾時|操作超時'
    )
    if ($isTimeout) { throw 'TENJIN_TIMEOUT' }
    throw ('TENJIN_REQUEST_FAILED: ' + $(if ($lastError) { $lastError.Message } else { 'Unknown error' }))
  }
  $text = [string]$response.Content
  if ($text -notmatch 'progress\s*,\s*count\s*,\s*event') { throw 'Unexpected Tenjin response format.' }
  $match = [regex]::Match($text, '(?im)^\s*[0-9.]+%\s*,\s*\((?<count>\d+)\)\s*,\s*registersuccess_all\s*$')
  $registrationCount = 0
  if ($match.Success) { $registrationCount = [int]$match.Groups['count'].Value }
  $c4Match = [regex]::Match($text, '(?im)^\s*[0-9.]+%\s*,\s*\((?<count>\d+)\)\s*,\s*c4_enter_opt\s*$')
  $c4EnterOptCount = 0
  if ($c4Match.Success) { $c4EnterOptCount = [int]$c4Match.Groups['count'].Value }
  return [ordered]@{
    count = $registrationCount
    c4EnterOptCount = $c4EnterOptCount
    start = $start
    end = $end
  }
}

function Invoke-TenjinCheck([string]$slot, [switch]$Force) {
  $state = Read-TenjinState
  if (-not $state.appIds.Count) { return $state }
  $now = Get-ShanghaiNow
  $date = $now.ToString('yyyy-MM-dd')
  foreach ($appId in @($state.appIds)) {
    $alreadyChecked = @($state.checks | Where-Object {
      ([string]$_.appId) -eq $appId -and ([string]$_.date) -eq $date -and ([string]$_.slot) -eq $slot
    }).Count -gt 0
    if ($alreadyChecked -and -not $Force) { continue }
    $record = [ordered]@{
      appId = $appId
      date = $date
      slot = $slot
      count = $null
      c4EnterOptCount = $null
      checkedAt = [DateTime]::UtcNow.ToString('o')
      start = $now.Date.AddDays(-1).ToString('yyyy-MM-dd')
      end = $date
      error = ''
    }
    try {
      $result = Get-TenjinRegistrationCount $appId $now
      $record.count = $result.count
      $record.c4EnterOptCount = $result.c4EnterOptCount
      $record.start = $result.start
      $record.end = $result.end
    } catch {
      $record.error = $_.Exception.Message
    }
    $state.checks = @($state.checks) + [pscustomobject]$record
    $state.checks = @($state.checks | Select-Object -Last 1000)
    Save-TenjinState $state
  }
  return $state
}

function Invoke-DueTenjinChecks {
  $now = Get-ShanghaiNow
  $minutes = $now.Hour * 60 + $now.Minute
  if ($minutes -ge 600 -and $minutes -lt 630) { $null = Invoke-TenjinCheck '10:00' }
  if ($minutes -ge 900 -and $minutes -lt 930) { $null = Invoke-TenjinCheck '15:00' }
}

function Read-JsonRequest($request) {
  $encoding = $request.ContentEncoding
  if (-not $encoding) { $encoding = [Text.Encoding]::UTF8 }
  $reader = New-Object IO.StreamReader($request.InputStream, $encoding)
  try { return ($reader.ReadToEnd() | ConvertFrom-Json) }
  finally { $reader.Close() }
}

try { $listener.Start() }
catch {
  try {
    $existing = Invoke-WebRequest -UseBasicParsing -Uri ($prefix + 'api/tenjin-monitor') -TimeoutSec 3
    if ($existing.StatusCode -eq 200) {
      if (-not $NoBrowser) { Start-Process ($prefix + 'index.html') }
      Write-Host ('Dashboard is already running: ' + $prefix + 'index.html') -ForegroundColor Green
      exit 0
    }
  } catch {
    # The port is unavailable and it is not the dashboard service.
  }
  Write-Host ('Unable to start. Port ' + $Port + ' may already be in use.') -ForegroundColor Red
  Read-Host 'Press Enter to close'
  exit 1
}

$dashboardUrl = $prefix + 'index.html'
Write-Host ('Dashboard started: ' + $dashboardUrl) -ForegroundColor Green
Write-Host 'Keep this window open for Google Play monitoring. Press Ctrl+C to stop.'
if (-not $NoBrowser) { Start-Process $dashboardUrl }

$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'application/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
  '.svg' = 'image/svg+xml'; '.txt' = 'text/plain; charset=utf-8'
}

try {
  $pendingContext = $listener.BeginGetContext($null, $null)
  $lastTenjinPoll = [DateTime]::MinValue
  while ($listener.IsListening) {
    if (([DateTime]::UtcNow - $lastTenjinPoll).TotalSeconds -ge 30) {
      Invoke-DueTenjinChecks
      $lastTenjinPoll = [DateTime]::UtcNow
    }
    if (-not $pendingContext.AsyncWaitHandle.WaitOne(1000)) { continue }
    $context = $listener.EndGetContext($pendingContext)
    $pendingContext = $listener.BeginGetContext($null, $null)
    try {
      $path = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath)
      if ($path -eq '/api/tenjin-monitor' -and $context.Request.HttpMethod -eq 'GET') {
        Send-Json $context.Response 200 (Get-TenjinPublicState)
        continue
      }
      if ($path -eq '/api/tenjin-monitor' -and $context.Request.HttpMethod -eq 'POST') {
        try {
          $body = Read-JsonRequest $context.Request
          $ids = @($body.appIds | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ } | Select-Object -Unique)
          $invalid = @($ids | Where-Object { $_ -notmatch '^\d{6,15}$' })
          if ($invalid.Count) { throw ('Invalid APPID format: ' + ($invalid -join ', ')) }
          $state = Read-TenjinState
          $state.appIds = $ids
          Save-TenjinState $state
          Send-Json $context.Response 200 (Get-TenjinPublicState)
        } catch { Send-Json $context.Response 400 @{ ok = $false; error = $_.Exception.Message } }
        continue
      }
      if ($path -eq '/api/tenjin-monitor/check' -and $context.Request.HttpMethod -eq 'POST') {
        $null = Invoke-TenjinCheck 'manual' -Force
        $public = Get-TenjinPublicState
        $failedAppIds = @()
        foreach ($appId in @($public.appIds)) {
          $latestManual = @($public.checks | Where-Object {
            ([string]$_.appId) -eq $appId -and ([string]$_.slot) -eq 'manual'
          } | Select-Object -Last 1)
          if ($latestManual.Count -and ([string]$latestManual[0].error)) { $failedAppIds += $appId }
        }
        $public['manualFailedAppIds'] = @($failedAppIds)
        Send-Json $context.Response 200 $public
        continue
      }
      if ($path.StartsWith('/api/')) {
        Send-Json $context.Response 404 @{ ok = $false; error = 'API not found' }
        continue
      }
      if ($path -eq '/') { $path = '/index.html' }
      $relative = $path.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
      $file = [IO.Path]::GetFullPath((Join-Path $root $relative))
      if (-not $file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $file -PathType Leaf)) {
        Send-Bytes $context.Response 404 'text/plain; charset=utf-8' ([Text.Encoding]::UTF8.GetBytes('Not found'))
        continue
      }
      $ext = [IO.Path]::GetExtension($file).ToLowerInvariant()
      $type = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      Send-Bytes $context.Response 200 $type ([IO.File]::ReadAllBytes($file))
    } catch {
      if ($context.Response.OutputStream.CanWrite) {
        Send-Json $context.Response 500 @{ ok = $false; error = $_.Exception.Message }
      }
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
