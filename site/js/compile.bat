@echo off

"../../utils/preprocess/preprocess.exe" -o "main.out.js" main.js
"C:\Python27\python.exe" "../../utils/preprocess/preprocess.py" -o "main.out.js" main.js

pause