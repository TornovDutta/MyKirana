@echo off
title MyKirana Frontend (Expo)
echo ========================================================
echo Starting MyKirana Expo Frontend
echo ========================================================
echo.

rem 1. Dynamically detect active Wi-Fi IP so IP changes never break Expo Go
for /f "delims=" %%I in ('node -e "const os = require('os'); const nets = os.networkInterfaces(); const wifi = nets['Wi-Fi']?.find(n => n.family === 'IPv4'); const fallback = Object.values(nets).flat().find(n => n.family === 'IPv4' && !n.internal); console.log((wifi || fallback)?.address || 'localhost');"') do set HOST_IP=%%I

if defined HOST_IP (
    echo [INFO] Detected active Wi-Fi IP: %HOST_IP%
    set REACT_NATIVE_PACKAGER_HOSTNAME=%HOST_IP%
)

rem 2. Configure ADB reverse forwarding for Android Emulator (Pixel_8) if running
if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
    echo [INFO] Setting up ADB port forwarding for Android Emulator...
    "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081 2>nul
    "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" reverse tcp:8000 tcp:8000 2>nul
)

echo [INFO] Starting Metro packager on %HOST_IP%:8081...
echo.

cd /d "e:\Project Resume\MyKirana\frontend"
npx expo start -c
pause
