@echo off
title Update RSOB Quality Dashboard
echo ============================================
echo  RSOB Quality Dashboard — Weekly Update
echo ============================================
echo.
echo Step 1: Make sure you've replaced 2026-RQM.xlsx
echo         with the latest week's data file.
echo.
pause
echo.
echo Step 2: Loading data from Excel...
set PATH=C:\Users\mpuranik\nodejs;%PATH%
call npx tsx scripts/load-data.ts
if errorlevel 1 (
    echo ERROR: Data loading failed!
    pause
    exit /b 1
)
echo.
echo Step 3: Building dashboard...
call npx tsx scripts/build-static.ts
if errorlevel 1 (
    echo ERROR: Dashboard build failed!
    pause
    exit /b 1
)
echo.
echo ============================================
echo  SUCCESS! Dashboard updated.
echo ============================================
echo.
echo Next: Copy dist\dashboard.html to your
echo shared network drive folder.
echo.
pause
