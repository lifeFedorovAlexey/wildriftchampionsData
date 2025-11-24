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
echo === Запуск merge-cn-full.mjs === >> "%LOG_FILE%"

REM ==== ЗАПУСК NODE-СКРИПТА ====
%NODE_EXE% "%PROJECT_DIR%\merge-cn-full.mjs" >> "%LOG_FILE%" 2>&1

IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] merge-cn-full.mjs завершился с ошибкой %ERRORLEVEL% >> "%LOG_FILE%"
    echo Ошибка при запуске merge-cn-full.mjs
    goto AFTER_GIT
) ELSE (
    echo [OK] merge-cn-full.mjs успешно выполнен >> "%LOG_FILE%"
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
