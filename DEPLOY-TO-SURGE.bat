@echo off
title RSOB Quality Dashboard — Deploy to Surge
echo.
echo ============================================
echo  RSOB Quality Dashboard — Deploy to Surge
echo ============================================
echo.

set PATH=C:\Users\mpuranik\nodejs;%PATH%

echo STEP 1: Make sure you have replaced
echo         2026-RQM.xlsx with the latest data.
echo.
pause

echo.
echo STEP 2: Loading data from Excel...
call npx tsx scripts/load-data.ts
if errorlevel 1 (
    echo ERROR: Data loading failed!
    pause
    exit /b 1
)

echo.
echo STEP 3: Building dashboard...
call npx tsx scripts/build-static.ts
if errorlevel 1 (
    echo ERROR: Dashboard build failed!
    pause
    exit /b 1
)

echo.
echo STEP 4: Deploying to Surge...
echo         (First time: you'll be asked to create an account)
echo.
call npx surge ./dist rsob-quality-dashboard.surge.sh
if errorlevel 1 (
    echo.
    echo ERROR: Surge deployment failed!
    echo If this is your first time, run this command manually:
    echo   npx surge login
    echo Then re-run this script.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  DONE! Dashboard is live at:
echo  https://rsob-quality-dashboard.surge.sh
echo ============================================
echo.
echo Share this link with your team:
echo https://rsob-quality-dashboard.surge.sh
echo.
pause
