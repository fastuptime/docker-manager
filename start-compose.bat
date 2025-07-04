@echo off
echo Docker Manager Docker Compose Kurulumu Başlatılıyor...
echo.

echo 1. Docker Compose ile servisler başlatılıyor...
docker-compose up -d

echo.
echo 2. Servis durumu kontrol ediliyor...
docker-compose ps

echo.
echo 3. Loglar görüntüleniyor...
echo Çıkmak için Ctrl+C tuşlarına basın.
echo.

docker-compose logs -f

pause
