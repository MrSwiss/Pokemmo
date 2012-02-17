@echo off

"../utils/preprocess/preprocess.exe" -o "main.out.node.js" main.node.js
"C:\Python27\python.exe" "../utils/preprocess/preprocess.py" -o "main.out.node.js" main.node.js

IF ERRORLEVEL 1 pause