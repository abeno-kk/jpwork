param(
  [switch]$Remove
)

$ErrorActionPreference = 'Stop'
$taskName = '工作儀表板背景服務'
$serverScript = Join-Path $PSScriptRoot 'start-dashboard.ps1'

if ($Remove) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host '已取消工作儀表板的自動啟動。' -ForegroundColor Yellow
  exit 0
}

if (-not (Test-Path -LiteralPath $serverScript -PathType Leaf)) {
  throw "找不到啟動檔：$serverScript"
}

$arguments = '-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $serverScript + '" -NoBrowser'
$action = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument $arguments `
  -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$principal = New-ScheduledTaskPrincipal `
  -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) `
  -LogonType Interactive `
  -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Description '登入 Windows 後在背景啟動本機工作儀表板與 Google Play 下載數查詢服務。' `
  -Force | Out-Null

Write-Host '設定完成：Windows 登入後會自動在背景啟動工作儀表板。' -ForegroundColor Green
Write-Host '儀表板網址：http://127.0.0.1:5500/index.html'
