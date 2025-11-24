@echo off
setlocal

REM ==== НАСТРОЙКИ ====
REM Путь к проекту
set PROJECT_DIR=D:\wildRiftChampions

REM Путь к node.exe (проверь, что он верный)
set NODE_EXE="C:\Program Files\nodejs\node.exe"

REM Лог-файл
set LOG_FILE=%PROJECT_DIR%\deploy.log

REM ==== ПОДГОТОВКА ====
cd /d %PROJECT_DIR%

echo [START] %date% %time% >> "%LOG_FILE%"
echo === Запуск merge-full-with-historu.mjs === >> "%LOG_FILE%"

REM ==== ЗАПУСК NODE-СКРИПТА С ИСТОРИЕЙ ====
%NODE_EXE% "%PROJECT_DIR%\merge-full-with-historu.mjs" >> "%LOG_FILE%" 2>&1

IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] merge-full-with-historu.mjs завершился с ошибкой %ERRORLEVEL% >> "%LOG_FILE%"
    echo Ошибка при запуске merge-full-with-historu.mjs
    goto AFTER_GIT
) ELSE (
    echo [OK] merge-full-with-historu.mjs успешно выполнен >> "%LOG_FILE%"
)

REM ==== GIT ====
:AFTER_GIT
echo === Добавляю изменения === >> "%LOG_FILE%"
git add -A >> "%LOG_FILE%" 2>&1

echo === Коммит === >> "%LOG_FILE%"
git commit -m "Auto update CN stats" >> "%LOG_FILE%" 2>&1

echo === Пуш в GitHub === >> "%LOG_FILE%"
git push >> "%LOG_FILE%" 2>&1

echo [END] %date% %time% EXIT=%ERRORLEVEL% >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

endlocal
