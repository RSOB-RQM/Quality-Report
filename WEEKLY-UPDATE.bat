@echo off
title RSOB Quality Dashboard — Weekly Update
echo.
echo ============================================
echo  RSOB Quality Dashboard — Weekly Update
echo ============================================
echo.
echo STEP 1: Make sure you have replaced
echo         2026-RQM.xlsx with the latest data.
echo.
pause

set PATH=C:\Users\mpuranik\nodejs;%PATH%

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
echo STEP 4: Creating zip package...
powershell -NoProfile -Command "Compress-Archive -Path 'dist\dashboard.html','dist\OPEN-DASHBOARD.bat','dist\README.txt' -DestinationPath 'dist\RSOB-Quality-Dashboard.zip' -Force"

echo.
echo STEP 5: Opening email with attachment...
powershell -NoProfile -Command "$outlook = New-Object -ComObject Outlook.Application; $mail = $outlook.CreateItem(0); $mail.Subject = 'RSOB Quality Dashboard — Weekly Update'; $mail.Body = 'Hi Team,`n`nUpdated RSOB Quality Performance Dashboard attached with latest week data.`n`nSteps:`n1. Download and extract the zip`n2. Double-click OPEN-DASHBOARD.bat`n3. Browser opens automatically with your data`n`nKeep both files in the same folder. Always open via the BAT file.`n`nThanks'; $mail.Attachments.Add((Resolve-Path 'dist\RSOB-Quality-Dashboard.zip').Path); $mail.Display()"

echo.
echo ============================================
echo  DONE! Email is ready — just click Send.
echo ============================================
echo.
pause
