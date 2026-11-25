@echo off
title MyKirana Frontend Tunnel (Expo)
echo ========================================================
echo Starting MyKirana Expo Frontend in Tunnel Mode
echo (Bypasses all Wi-Fi and Firewall connection issues)
echo ========================================================
echo.
cd /d "e:\Project Resume\MyKirana\frontend"
npx expo start -c --tunnel
pause
