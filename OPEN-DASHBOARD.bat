@echo off
title RSOB Quality Dashboard
echo ============================================
echo  RSOB - Quality Performance Dashboard
echo ============================================
echo.
echo Detected user: %USERNAME%
echo Starting dashboard...
echo.
powershell -ExecutionPolicy Bypass -NoProfile -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$htmlFile = Join-Path '%~dp0' 'dashboard.html';" ^
  "$html = [System.IO.File]::ReadAllBytes($htmlFile);" ^
  "$user = '%USERNAME%'.ToLower();" ^
  "$listener = New-Object System.Net.HttpListener;" ^
  "$listener.Prefixes.Add('http://localhost:8080/');" ^
  "$listener.Start();" ^
  "Write-Host '';" ^
  "Write-Host '  Dashboard is LIVE at: http://localhost:8080' -ForegroundColor Green;" ^
  "Write-Host '  Logged in as: %USERNAME%' -ForegroundColor Cyan;" ^
  "Write-Host '  Press Ctrl+C to stop.' -ForegroundColor Yellow;" ^
  "Write-Host '';" ^
  "Start-Process ('http://localhost:8080?user=' + $user);" ^
  "try { while ($listener.IsListening) { $ctx = $listener.GetContext(); $resp = $ctx.Response; $resp.ContentType = 'text/html; charset=utf-8'; $resp.ContentLength64 = $html.Length; $resp.OutputStream.Write($html, 0, $html.Length); $resp.Close() } } finally { $listener.Stop() }"
