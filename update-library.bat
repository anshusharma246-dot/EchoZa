@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\generate-library.ps1"
echo.
echo Library updated. Press any key to close.
pause >nul
