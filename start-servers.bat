@echo off
cd /d C:\Users\nites\Desktop\dipportfolio.github.io
start "API Server" cmd /k "npx tsx watch server/src/index.ts"
timeout /t 3 /nobreak >nul
start "Web Client" cmd /k "cd /d C:\Users\nites\Desktop\dipportfolio.github.io\client && npx vite --port 5173"
echo.
echo ============================================
echo   Servers starting...
echo   API:      http://localhost:5000
echo   Frontend: http://localhost:5173
echo ============================================
echo.
