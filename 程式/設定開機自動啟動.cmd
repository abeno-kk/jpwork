@echo off
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0設定開機自動啟動.ps1"
echo.
pause
