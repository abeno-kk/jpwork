param([string]$RequestUri = '')

$ErrorActionPreference = 'Stop'
$logPath = 'C:\actions-runner-jpwork\tenjin-dashboard-update.log'
$syncScript = Join-Path $PSScriptRoot 'run-tenjin-local-sync.ps1'
$mutex = New-Object Threading.Mutex($false, 'Local\JPWorkTenjinDashboardUpdate')

try {
  if (-not $mutex.WaitOne(0)) { exit 0 }
  ('[' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '] Dashboard update started.') | Out-File -LiteralPath $logPath -Encoding utf8 -Append
  & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $syncScript -Slot manual *>> $logPath
  $exitCode = $LASTEXITCODE
  ('[' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '] Dashboard update finished with exit code ' + $exitCode + '.') | Out-File -LiteralPath $logPath -Encoding utf8 -Append
  exit $exitCode
} catch {
  ('[' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '] Dashboard update failed: ' + $_.Exception.Message) | Out-File -LiteralPath $logPath -Encoding utf8 -Append
  exit 1
} finally {
  try { $mutex.ReleaseMutex() } catch {}
  $mutex.Dispose()
}
