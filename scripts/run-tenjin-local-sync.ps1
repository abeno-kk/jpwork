param(
  [ValidateSet('10:00', '15:00', 'manual')]
  [string]$Slot = 'manual'
)

$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$configPath = Join-Path $repo 'tenjin-appids.json'
$resultsPath = Join-Path $repo 'tenjin-monitor-results.json'
$apiBase = 'https://cchttps.twelvepacks.top/'
$reportPage = $apiBase + 'html/tenjin_report.html'
$git = (Get-Command git.exe -ErrorAction Stop).Source
$headers = @{
  'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36'
  'Accept-Language' = 'zh-TW,zh;q=0.9,en;q=0.8'
  'Referer' = $reportPage
}

function Invoke-Git([string[]]$Arguments, [switch]$AllowFailure) {
  $output = & $git -c credential.helper=manager -C $repo @Arguments 2>&1
  if ($LASTEXITCODE -ne 0 -and -not $AllowFailure) {
    throw ('git ' + ($Arguments -join ' ') + ' failed: ' + ($output -join [Environment]::NewLine))
  }
  return @($output)
}

function Get-ShanghaiNow {
  $zone = [TimeZoneInfo]::FindSystemTimeZoneById('China Standard Time')
  return [TimeZoneInfo]::ConvertTimeFromUtc([DateTime]::UtcNow, $zone)
}

function Get-EventCount([string]$Text, [string]$EventName) {
  $escaped = [regex]::Escape($EventName)
  $match = [regex]::Match($Text, '(?im)^\s*[0-9.]+%\s*,\s*\((?<count>\d+)\)\s*,\s*' + $escaped + '\s*$')
  if ($match.Success) { return [int]$match.Groups['count'].Value }
  return 0
}

$null = Invoke-Git @('pull', '--rebase', 'origin', 'main')
$config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$appIds = @($config.appIds | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ } | Select-Object -Unique)
if (-not $appIds.Count -or @($appIds | Where-Object { $_ -notmatch '^\d{6,15}$' }).Count) {
  throw 'tenjin-appids.json must contain one or more 6-15 digit APPIDs.'
}

$previousChecks = @()
try {
  $previous = Get-Content -LiteralPath $resultsPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $previousChecks = @($previous.checks)
} catch {
  $previousChecks = @()
}

$now = Get-ShanghaiNow
$date = $now.ToString('yyyy-MM-dd')
$start = $now.Date.AddDays(-1).ToString('yyyy-MM-dd')
$newChecks = @()

foreach ($appId in $appIds) {
  $record = [ordered]@{
    appId = $appId; date = $date; slot = $Slot
    count = $null; c4EnterOptCount = $null
    checkedAt = [DateTime]::UtcNow.ToString('o')
    start = $start; end = $date; error = ''
  }
  try {
    $query = '?func=tenjin_report&form=csv&start=' + $start + '&end=' + $date + '&app_id=' + [Uri]::EscapeDataString($appId)
    $response = Invoke-WebRequest -UseBasicParsing -Uri ($apiBase + $query) -Headers $headers -TimeoutSec 30
    $text = [string]$response.Content
    if ($text -notmatch 'progress\s*,\s*count\s*,\s*event') { throw 'Unexpected Tenjin response format.' }
    $record.count = Get-EventCount $text 'registersuccess_all'
    $record.c4EnterOptCount = Get-EventCount $text 'c4_enter_opt'
  } catch {
    $record.error = $_.Exception.Message
  }
  $newChecks += [pscustomobject]$record
}

$allChecks = @($previousChecks) + @($newChecks)
$allChecks = @($allChecks | Select-Object -Last 1000)
$runOk = @($newChecks | Where-Object { ([string]$_.error) }).Count -eq 0
$output = [ordered]@{
  ok = $true; runOk = $runOk; version = 1; appIds = @($appIds)
  checks = $allChecks; date = $date; timezone = 'Asia/Shanghai'
  slots = @('10:00', '15:00'); updatedAt = [DateTime]::UtcNow.ToString('o')
}
$json = $output | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText($resultsPath, $json + [Environment]::NewLine, (New-Object Text.UTF8Encoding($false)))

$null = Invoke-Git @('add', 'tenjin-monitor-results.json')
$diff = Invoke-Git @('diff', '--cached', '--quiet') -AllowFailure
if ($LASTEXITCODE -ne 0) {
  $null = Invoke-Git @('commit', '-m', ('Update Tenjin result: ' + $Slot))
  $null = Invoke-Git @('pull', '--rebase', 'origin', 'main')
  $null = Invoke-Git @('push', 'origin', 'main')
}

foreach ($item in $newChecks) {
  Write-Output (($item.appId) + ': register=' + ($item.count) + ', verificationPage=' + ($item.c4EnterOptCount) + $(if ($item.error) { ', error=' + $item.error } else { '' }))
}
if (-not $runOk) { exit 1 }
