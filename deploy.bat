@echo off
echo === Запуск merge-cn-full.mjs ===
node merge-cn-full.mjs
IF %ERRORLEVEL% NEQ 0 (
    echo Ошибка при запуске merge-cn-full.mjs
    exit /b 1
)

echo === Добавляю изменения ===
git add -A

echo === Коммит ===
git commit -m "Auto update CN stats"

echo === Пуш в GitHub ===
git push

echo === Готово! Vercel сам деплоит проект ===
pause
