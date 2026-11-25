@echo off
title MyKirana Backend
echo ========================================================
echo Starting MongoDB & FastAPI Backend for MyKirana
echo ========================================================
echo.

rem Start MongoDB in a separate window
start "MongoDB" "C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe" --dbpath "e:\Project Resume\MyKirana\backend\mongo-data"

rem Wait 2 seconds for MongoDB to initialize
timeout /t 2 /nobreak >nul

rem Activate virtual environment and start FastAPI
cd /d "e:\Project Resume\MyKirana\backend"
call .\venv\Scripts\activate.bat
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
