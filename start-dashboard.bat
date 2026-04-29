@echo off
title RSOB Quality Dashboard
echo.
echo  RSOB - Quality Performance Dashboard
echo  Starting...
echo.
"%~dp0..\nodejs\node.exe" "%~dp0serve.js"
if errorlevel 1 (
  echo.
  echo Node.js not found at default path. Trying PATH...
  node "%~dp0serve.js"
)
pause
