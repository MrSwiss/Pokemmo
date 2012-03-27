@echo off
java -jar compiler.jar --warning_level QUIET --js main.out.js --js_output_file main.tmp.js
del main.out.js
ren main.tmp.js main.out.js
pause