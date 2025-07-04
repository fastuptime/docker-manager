@echo off
echo Docker Manager Kurulumu Başlatılıyor...
echo.

echo 1. Node.js bağımlılıkları yükleniyor...
call npm install

echo.
echo 2. Docker Desktop'ın çalıştığından emin olun...
echo.

echo 3. Uygulama başlatılıyor...
call npm start

pause
