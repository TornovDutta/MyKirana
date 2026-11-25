@echo off
title MyKirana Frontend (Expo)
echo ========================================================
echo Starting MyKirana Expo Frontend
echo ========================================================
echo.

rem Force Metro to bind to your physical Wi-Fi IP instead of virtual Hyper-V/WSL adapter
set REACT_NATIVE_PACKAGER_HOSTNAME=172.25.252.42

cd /d "e:\Project Resume\MyKirana\frontend"
npx expo start -c
pause
