@echo off
chcp 65001 >nul
echo ====================================
echo   情绪急救 App - 本地服务器
echo ====================================
echo.
echo 正在启动服务器...
echo 启动后请在浏览器访问: http://localhost:8000
echo.
echo 按 Ctrl+C 可以停止服务器
echo ====================================
echo.

python -m http.server 8000

pause
