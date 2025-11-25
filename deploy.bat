@echo off
setlocal

REM ==== NASTROYKI ====
set "PROJECT_DIR=D:\wildRiftChampions"

REM ==== PEREKHOD V PAPKU PROEKTA ====
cd /d "%PROJECT_DIR%"

echo [START] %date% %time%
echo === Zapusk merge-full-with-historu.mjs ===

REM ==== ZAPUSK NODE-SKRIPTA ====
node merge-full-with-historu.mjs
set "NODE_EXIT=%ERRORLEVEL%"

if not "%NODE_EXIT%"=="0" (
    echo [ERROR] merge-full-with-historu.mjs exit code %NODE_EXIT%
) else (
    echo [OK] merge-full-with-historu.mjs done
)

REM ==== GIT OPERATSII ====
echo === Git add ===
git add -A

echo === Git commit ===
git commit -m "Auto update CN stats"

echo === Git push ===
git push

echo [END] %date% %time% EXIT=%ERRORLEVEL%
echo.

endlocal
