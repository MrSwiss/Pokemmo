@echo off

"../utils/preprocess/preprocess.exe" -o "server.out.node.js" server.node.js
"C:\Python27\python.exe" "../utils/preprocess/preprocess.py" -o "server.out.node.js" server.node.js

IF ERRORLEVEL 1 pause