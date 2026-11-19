@echo off
echo ===================================================
echo Pushing your code to GitHub...
echo If a browser window or popup appears, please log in!
echo ===================================================
"C:\Program Files\Git\cmd\git.exe" push -u origin main
echo.
echo If it says 'Everything up-to-date' or 'Branch main set up to track...', it worked!
pause
