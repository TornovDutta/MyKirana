@echo off
title Upgrade MyKirana to Expo SDK 58
echo ========================================================
echo Upgrading MyKirana to Expo SDK 58 (Matching your Phone)
echo ========================================================
echo.

cd /d "e:\Project Resume\MyKirana\frontend"

echo Running: npx expo install expo@^58.0.0 --fix
echo Please wait while npm downloads the compatible SDK 58 packages...
echo.

call npx expo install expo@^58.0.0 --fix

echo.
echo ========================================================
echo Upgrade Complete! Starting Expo...
echo ========================================================
echo.

set REACT_NATIVE_PACKAGER_HOSTNAME=172.25.252.42
call npx expo start -c
pause
