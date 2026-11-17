@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

cd /d "%~dp0"

set "NODE_DIR="
if exist "%APPDATA%\fnm\node-versions\v22.23.5\installation\npm.cmd" (
  set "NODE_DIR=%APPDATA%\fnm\node-versions\v22.23.5\installation"
) else (
  for /d %%D in ("%APPDATA%\fnm\node-versions\v22*") do (
    if exist "%%~fD\installation\npm.cmd" set "NODE_DIR=%%~fD\installation"
  )
)

if defined NODE_DIR (
  set "PATH=%NODE_DIR%;%PATH%"
) else (
  where fnm >nul 2>&1
  if !errorlevel!==0 (
    echo [Info] Running with fnm Node 22...
    call fnm exec --using=22 npm.cmd run build
    if errorlevel 1 goto :fail
    echo.
    echo [Preview] Local server starting at http://localhost:4321/ (Ctrl+C to stop)
    call fnm exec --using=22 npm.cmd run preview
    goto :end
  )
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [Error] npm.cmd not found. Please install Node.js 22+.
  goto :fail
)

for /f "tokens=1" %%V in ('node -v') do set "NODE_VER=%%V"
echo [Info] Using Node %NODE_VER%

echo [1/2] Building static site and search index...
call npm.cmd run build
if errorlevel 1 goto :fail

echo.
echo [2/2] Starting local preview at http://localhost:4321/ (Press Ctrl+C to stop)...
call npm.cmd run preview
goto :end

:fail
echo.
echo [Error] Build or preview failed. Press any key to exit...
pause >nul
exit /b 1

:end
endlocal
