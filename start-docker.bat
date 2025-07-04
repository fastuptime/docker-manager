@echo off
echo Docker Manager Docker Kurulumu Başlatılıyor...
echo.

echo 1. Docker image'ı oluşturuluyor...
docker build -t docker-manager .

echo.
echo 2. Docker container'ı başlatılıyor...
docker run -d --name docker-manager -p 3000:3000 -v //./pipe/docker_engine://./pipe/docker_engine docker-manager

echo.
echo 3. Container durumu kontrol ediliyor...
docker ps -a | findstr docker-manager

echo.
echo Uygulama http://localhost:3000 adresinde çalışıyor.
echo.

pause
