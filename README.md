# Docker Manager - Kapsamlı Docker Yönetim Uygulaması

Docker Manager, Docker container'larını, image'larını, network'lerini ve volume'larını yönetmek için geliştirilmiş kapsamlı bir web tabanlı yönetim uygulamasıdır.
![image](https://github.com/user-attachments/assets/96d408c9-5b8f-4a0d-b39a-368e5986e7cd)
![image](https://github.com/user-attachments/assets/a30cbca8-fb46-4a1a-a954-844c3779b8d3)
![image](https://github.com/user-attachments/assets/6c93e44e-f390-4800-b4d6-cefc4763fbb8)
![image](https://github.com/user-attachments/assets/6f018a4b-ea15-4db2-ac22-8654ae82ca48)
![image](https://github.com/user-attachments/assets/13392cca-602d-43a5-a56f-524653b9e622)

## 🚀 Özellikler

### Backend Özellikleri
- **Docker API Entegrasyonu**: Dockerode kullanarak tam Docker API desteği
- **Container Yönetimi**: Oluşturma, başlatma, durdurma, silme, listeleme
- **Log Yönetimi**: Container loglarını görüntüleme ve real-time takip
- **Network Yönetimi**: Network oluşturma, listeleme, silme
- **Volume Yönetimi**: Volume oluşturma, listeleme, silme
- **Image Yönetimi**: Image listeleme ve silme
- **Sistem Monitörü**: Sistem bilgileri ve istatistikleri
- **RESTful API**: Tüm işlemler için API endpoint'leri

### Frontend Özellikleri
- **Modern Web Arayüzü**: Responsive ve kullanıcı dostu tasarım
- **Real-time Güncelleme**: WebSocket ile anlık bilgi güncellemeleri
- **İnteraktif Dashboard**: Sistem durumu ve istatistikleri
- **Log Viewer**: Real-time log görüntüleme
- **Modal Formlar**: Kolay container, network ve volume oluşturma
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu

### Güvenlik ve Performans
- **Rate Limiting**: API isteklerini sınırlama
- **CORS Desteği**: Cross-origin istekleri
- **Helmet**: HTTP güvenlik başlıkları
- **Winston Logging**: Kapsamlı log sistemi
- **Error Handling**: Hata yönetimi ve kullanıcı bilgilendirme

## 📁 Proje Yapısı

```
docker-manager/
├── backend/
│   ├── routes/
│   │   ├── containers.js      # Container API routes
│   │   ├── images.js          # Image API routes
│   │   ├── networks.js        # Network API routes
│   │   ├── volumes.js         # Volume API routes
│   │   └── system.js          # System API routes
│   ├── services/
│   │   └── dockerService.js   # Docker operations service
│   ├── middleware/
│   └── server.js              # Express server
├── frontend/
│   ├── css/
│   │   └── style.css          # Styles
│   ├── js/
│   │   └── app.js             # Frontend JavaScript
│   └── index.html             # Ana HTML dosyası
├── logs/                      # Log dosyaları
├── package.json
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## 🛠️ Kurulum

### Gereksinimler
- Node.js 18+
- Docker
- Docker Compose (opsiyonel)

### 1. Yerel Kurulum

```bash
# Projeyi klonla
git clone https://github.com/fastuptime/docker-manager.git
cd docker-manager

# Bağımlılıkları yükle
npm install

# Uygulamayı başlat
npm start

# Geliştirme modunda çalıştır
npm run dev
```

### 2. Docker ile Kurulum

```bash
# Docker image'ı oluştur
docker build -t docker-manager .

# Container'ı çalıştır
docker run -d \
  --name docker-manager \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  docker-manager

# Windows için:
# docker run -d --name docker-manager -p 3000:3000 -v //./pipe/docker_engine://./pipe/docker_engine docker-manager
```

### 3. Docker Compose ile Kurulum

```bash
# Servisleri başlat
docker-compose up -d

# Logları görüntüle
docker-compose logs -f

# Servisleri durdur
docker-compose down
```

## 🔧 Yapılandırma

### Çevre Değişkenleri
```bash
NODE_ENV=production          # Çalışma ortamı
PORT=3000                   # Sunucu portu
DOCKER_SOCKET_PATH=/var/run/docker.sock  # Docker socket path
```

### Docker Socket Bağlantısı
- **Linux/Mac**: `/var/run/docker.sock:/var/run/docker.sock`
- **Windows**: `//./pipe/docker_engine://./pipe/docker_engine`

## 🚀 Kullanım

### Web Arayüzü
1. Tarayıcınızda `http://localhost:3000` adresine gidin
2. Dashboard'da sistem durumunu görüntüleyin
3. Sidebar'dan istediğiniz bölüme geçin:
   - **Dashboard**: Sistem özeti
   - **Container'lar**: Container yönetimi
   - **Image'lar**: Image yönetimi
   - **Network'ler**: Network yönetimi
   - **Volume'lar**: Volume yönetimi
   - **Loglar**: Container logları

### API Kullanımı

#### Container İşlemleri
```bash
# Container'ları listele
GET /api/containers

# Container oluştur
POST /api/containers
{
  "name": "test-container",
  "Image": "nginx:latest",
  "HostConfig": {
    "PortBindings": {
      "80/tcp": [{"HostPort": "8080"}]
    }
  }
}

# Container başlat
POST /api/containers/:id/start

# Container durdur
POST /api/containers/:id/stop

# Container sil
DELETE /api/containers/:id
```

#### Image İşlemleri
```bash
# Image'ları listele
GET /api/images

# Image sil
DELETE /api/images/:id
```

#### Network İşlemleri
```bash
# Network'leri listele
GET /api/networks

# Network oluştur
POST /api/networks
{
  "Name": "test-network",
  "Driver": "bridge"
}

# Network sil
DELETE /api/networks/:id
```

#### Volume İşlemleri
```bash
# Volume'ları listele
GET /api/volumes

# Volume oluştur
POST /api/volumes
{
  "Name": "test-volume",
  "Driver": "local"
}

# Volume sil
DELETE /api/volumes/:name
```

#### Sistem Bilgileri
```bash
# Sistem bilgileri
GET /api/system/info

# Sistem istatistikleri
GET /api/system/stats
```

## 🎯 Özellik Detayları

### Container Yönetimi
- Container listesi görüntüleme (çalışan/durdurulmuş)
- Yeni container oluşturma (image, port, environment variables)
- Container başlatma/durdurma/yeniden başlatma
- Container silme
- Container durumu ve bilgileri

### Log Yönetimi
- Container logları görüntüleme
- Real-time log takibi
- Log temizleme
- WebSocket ile anlık log akışı

### Network Yönetimi
- Network listeleme
- Yeni network oluşturma
- Network silme
- Network detay bilgileri

### Volume Yönetimi
- Volume listeleme
- Yeni volume oluşturma
- Volume silme
- Volume detay bilgileri

### Sistem Monitörü
- Docker version bilgisi
- Container istatistikleri
- Sistem kaynak kullanımı
- Real-time sistem durumu

## 🔒 Güvenlik

### Güvenlik Önlemleri
- Rate limiting ile API koruması
- CORS yapılandırması
- Helmet ile HTTP güvenlik başlıkları
- Input validation
- Error handling

### Docker Güvenliği
- Non-root user kullanımı
- Multi-stage build
- Minimal base image
- Health check implementasyonu

## 📊 Performans

### Optimizasyonlar
- Gzip compression
- Static file caching
- Connection pooling
- Efficient Docker API usage

### Monitoring
- Winston logging
- Health checks
- Error tracking
- Performance metrics

## 🐛 Sorun Giderme

### Yaygın Sorunlar

1. **Docker socket bağlantı hatası**
   - Windows: Docker Desktop'ın çalıştığından emin olun
   - Linux: Docker daemon'ın çalıştığından emin olun
   - Permission hatası: Docker grup izinlerini kontrol edin

2. **Port çakışması**
   - 3000 portunu kullanan başka uygulamalar
   - PORT environment variable ile farklı port kullanın

3. **Container oluşturma hatası**
   - Image'ın mevcut olduğundan emin olun
   - Port mapping formatını kontrol edin

### Debug Modları
```bash
# Debug logları
DEBUG=* npm start

# Verbose Docker logs
docker-compose logs -f
```

## 🔄 Güncellemeler

### Versiyon Geçmişi
- v1.0.0: İlk sürüm
  - Temel container yönetimi
  - Web arayüzü
  - API endpoints

### Gelecek Özellikler
- [ ] Image build desteği
- [ ] Multi-host Docker support
- [ ] Container statistics
- [ ] Backup/restore
- [ ] User authentication
- [ ] Role-based access control

## 🤝 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit'leyin (`git commit -m 'Add amazing feature'`)
4. Push'layın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

- GitHub: https://github.com/fastuptime/docker-manager
- Email: [Email Address]

## 🙏 Teşekkürler

- [Dockerode](https://github.com/apocas/dockerode) - Docker API client
- [Express.js](https://expressjs.com/) - Web framework
- [Socket.io](https://socket.io/) - Real-time communication
- [Winston](https://github.com/winstonjs/winston) - Logging library
