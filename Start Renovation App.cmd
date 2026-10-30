@echo off
cd /d "%~dp0"
echo Starting Renovation Companion...
echo Open http://127.0.0.1:4173 in your browser.
echo Keep this window open while you use the app.
echo.
node server.js
echo.
echo The app server has stopped. If the address is already in use,
echo the app may already be running. Try opening it in your browser.
pause
