@echo off
setlocal
title Dashboard Service
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-dashboard.ps1"
if errorlevel 1 pause
