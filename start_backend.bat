@echo off
echo Starting Techeru AI Backend...
cd /d C:\Users\user\Music\project\backend
venv\Scripts\python.exe -m uvicorn main:app --port 8000
