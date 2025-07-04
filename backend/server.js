const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const winston = require('winston');
const dockerService = require('./services/dockerService');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const activities = [];

function addActivity({ type, color, title, subtitle }) {
  activities.unshift({
    type,
    color,
    title,
    subtitle,
    time: new Date().toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  });
  if (activities.length > 20) activities.pop();
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://cdn.tailwindcss.com",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      scriptSrcAttr: ["'unsafe-inline'"]
    }
  }
}));

app.use(cors());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.'
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/containers', require('./routes/containers'));
app.use('/api/images', require('./routes/images'));
app.use('/api/networks', require('./routes/networks'));
app.use('/api/volumes', require('./routes/volumes'));
app.use('/api/system', require('./routes/system'));
app.use('/api/market', require('./routes/market'));

app.get('/api/activities', (req, res) => {
  res.json({ success: true, activities });
});

global.addActivity = addActivity;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

io.on('connection', (socket) => {
  logger.info(`Yeni client bağlandı: ${socket.id}`);

  socket.on('follow-logs', async (containerId) => {
    try {
      const stream = await dockerService.followLogs(containerId);

      stream.on('data', (chunk) => {
        socket.emit('container-log', {
          containerId,
          log: chunk.toString('utf8')
        });
      });

      stream.on('end', () => {
        socket.emit('log-stream-ended', { containerId });
      });

      stream.on('error', (err) => {
        logger.error('Log stream hatası:', err);
        socket.emit('log-error', { containerId, error: err.message });
      });

      socket.on('disconnect', () => {
        stream.destroy();
      });

    } catch (error) {
      logger.error('Log takip hatası:', error);
      socket.emit('log-error', { containerId, error: error.message });
    }
  });

  socket.on('subscribe-system-stats', () => {
    const interval = setInterval(async () => {
      try {
        const stats = await dockerService.getSystemStats();
        socket.emit('system-stats', stats);
      } catch (error) {
        logger.error('Sistem istatistikleri hatası:', error);
        socket.emit('system-stats-error', { error: error.message });
      }
    }, 5000); 

    socket.on('unsubscribe-system-stats', () => {
      clearInterval(interval);
    });

    socket.on('disconnect', () => {
      clearInterval(interval);
    });
  });

  socket.on('disconnect', () => {
    logger.info(`Client ayrıldı: ${socket.id}`);
  });
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Sunucu hatası!' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Sayfa bulunamadı!' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Docker Manager sunucusu ${PORT} portunda çalışıyor`);
});

module.exports = app;