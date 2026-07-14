@echo off
chcp 65001 >nul
cd /d "%~dp0site"
echo.
echo  PDM Learn 本地服务器
echo  ==================
echo.

where node >nul 2>&1
if %errorlevel% equ 0 (
  echo 正在启动 http://localhost:5173
  echo 按 Ctrl+C 停止
  echo.
  node server.cjs
  goto :end
)

set "NODE=%LOCALAPPDATA%\Programs\cursor\resources\app\resources\helpers\node.exe"
if exist "%NODE%" (
  echo 正在启动 http://localhost:5173
  echo 按 Ctrl+C 停止
  echo.
  "%NODE%" server.cjs
  goto :end
)

echo [错误] 未找到 Node.js
echo.
echo 请任选一种方式打开：
echo   1. 双击 site\index.html 用浏览器打开
echo   2. 安装 Node.js 后重新运行此脚本
echo.
pause

:end
