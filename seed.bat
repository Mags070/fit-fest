@echo off
echo Seeding database with demo data...
cd /d %~dp0backend
C:\Users\Pranav\AppData\Local\Programs\Python\Python312\python.exe ..\data\seed_data.py
echo Done.
pause
