const express = require('express');
const router = express.Router();
const dockerService = require('../services/dockerService');

const appTemplates = [
  {
    id: 'nginx',
    name: 'Nginx Web Server',
    image: 'nginx:latest',
    description: 'Popüler ve yüksek performanslı web sunucusu',
    icon: 'fas fa-server',
    env: [],
    ports: [{ container: 80, host: 8080 }],
    volumes: [],
    cmd: null 
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    image: 'postgres:13',
    description: 'Güçlü açık kaynak ilişkisel veritabanı',
    icon: 'fas fa-database',
    env: [{ key: 'POSTGRES_PASSWORD', label: 'Veritabanı Şifresi', required: true, default: 'postgres' }],
    ports: [{ container: 5432, host: 5432 }],
    volumes: [{ container: '/var/lib/postgresql/data', host: 'postgres_data' }],
    cmd: null 
  },
  {
    id: 'redis',
    name: 'Redis Cache',
    image: 'redis:alpine',
    description: 'Hızlı in-memory veri yapısı sunucusu',
    icon: 'fas fa-memory',
    env: [],
    ports: [{ container: 6379, host: 6379 }],
    volumes: [],
    cmd: null 
  },
  {
    id: 'mysql',
    name: 'MySQL',
    image: 'mysql:8.0',
    description: 'Popüler açık kaynak veritabanı',
    icon: 'fas fa-database',
    env: [
      { key: 'MYSQL_ROOT_PASSWORD', label: 'Root Şifre', required: true, default: 'mysql' },
      { key: 'MYSQL_DATABASE', label: 'Veritabanı Adı', required: false, default: 'mydb' }
    ],
    ports: [{ container: 3306, host: 3306 }],
    volumes: [{ container: '/var/lib/mysql', host: 'mysql_data' }],
    cmd: null 
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    image: 'mongo:latest',
    description: 'NoSQL doküman veritabanı',
    icon: 'fas fa-leaf',
    env: [
      { key: 'MONGO_INITDB_ROOT_USERNAME', label: 'Admin Kullanıcı', required: false, default: 'admin' },
      { key: 'MONGO_INITDB_ROOT_PASSWORD', label: 'Admin Şifre', required: false, default: 'admin' }
    ],
    ports: [{ container: 27017, host: 27017 }],
    volumes: [{ container: '/data/db', host: 'mongodb_data' }],
    cmd: null 
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    image: 'wordpress:latest',
    description: 'Dünyanın en popüler içerik yönetim sistemi',
    icon: 'fab fa-wordpress',
    env: [
      { key: 'WORDPRESS_DB_HOST', label: 'Veritabanı Host', required: true, default: 'db' },
      { key: 'WORDPRESS_DB_USER', label: 'Veritabanı Kullanıcı', required: true, default: 'wordpress' },
      { key: 'WORDPRESS_DB_PASSWORD', label: 'Veritabanı Şifresi', required: true, default: 'wordpress' },
      { key: 'WORDPRESS_DB_NAME', label: 'Veritabanı Adı', required: true, default: 'wordpress' }
    ],
    ports: [{ container: 80, host: 8080 }],
    volumes: [
      { container: '/var/www/html', host: 'wordpress_data' }
    ],
    cmd: null 
  },
  {
    id: 'uptime-kuma',
    name: 'Uptime Kuma',
    image: 'louislam/uptime-kuma:1',
    description: 'Modern ve kullanışlı uptime monitoring aracı',
    icon: 'fas fa-heartbeat',
    env: [],
    ports: [{ container: 3001, host: 3001 }],
    volumes: [{ container: '/app/data', host: 'uptime-kuma-data' }],
    cmd: null 
  },
  {
    id: 'phpmyadmin',
    name: 'phpMyAdmin',
    image: 'phpmyadmin/phpmyadmin:latest',
    description: 'MySQL veritabanı yönetim aracı',
    icon: 'fas fa-tools',
    env: [
      { key: 'PMA_HOST', label: 'MySQL Host', required: true, default: 'mysql' },
      { key: 'PMA_PORT', label: 'MySQL Port', required: false, default: '3306' }
    ],
    ports: [{ container: 80, host: 8081 }],
    volumes: [],
    cmd: null
  },
  {
    id: 'adminer',
    name: 'Adminer',
    image: 'adminer:latest',
    description: 'Hafif veritabanı yönetim aracı',
    icon: 'fas fa-database',
    env: [],
    ports: [{ container: 8080, host: 8082 }],
    volumes: [],
    cmd: null
  },
  {
    id: 'portainer',
    name: 'Portainer',
    image: 'portainer/portainer-ce:latest',
    description: 'Docker container yönetim arayüzü',
    icon: 'fab fa-docker',
    env: [],
    ports: [{ container: 9000, host: 9000 }],
    volumes: [
      { container: '/var/run/docker.sock', host: '/var/run/docker.sock' },
      { container: '/data', host: 'portainer_data' }
    ],
    cmd: null
  },
  {
    id: 'grafana',
    name: 'Grafana',
    image: 'grafana/grafana:latest',
    description: 'Güçlü monitoring ve görselleştirme platformu',
    icon: 'fas fa-chart-line',
    env: [
      { key: 'GF_SECURITY_ADMIN_PASSWORD', label: 'Admin Şifre', required: true, default: 'admin' }
    ],
    ports: [{ container: 3000, host: 3000 }],
    volumes: [{ container: '/var/lib/grafana', host: 'grafana_data' }],
    cmd: null
  },
  {
    id: 'nextcloud',
    name: 'Nextcloud',
    image: 'nextcloud:latest',
    description: 'Kendi bulut depolama çözümünüz',
    icon: 'fas fa-cloud',
    env: [],
    ports: [{ container: 80, host: 8083 }],
    volumes: [{ container: '/var/www/html', host: 'nextcloud_data' }],
    cmd: null
  },
  {
    id: 'gitlab',
    name: 'GitLab CE',
    image: 'gitlab/gitlab-ce:latest',
    description: 'Açık kaynak Git repository yönetimi',
    icon: 'fab fa-gitlab',
    env: [
      { key: 'GITLAB_OMNIBUS_CONFIG', label: 'GitLab Config', required: false, default: 'external_url "http://localhost:8084"' }
    ],
    ports: [
      { container: 80, host: 8084 },
      { container: 443, host: 8443 },
      { container: 22, host: 2222 }
    ],
    volumes: [
      { container: '/etc/gitlab', host: 'gitlab_config' },
      { container: '/var/log/gitlab', host: 'gitlab_logs' },
      { container: '/var/opt/gitlab', host: 'gitlab_data' }
    ],
    cmd: null
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    image: 'jenkins/jenkins:lts',
    description: 'Popüler CI/CD otomasyonu aracı',
    icon: 'fas fa-cogs',
    env: [],
    ports: [{ container: 8080, host: 8085 }],
    volumes: [{ container: '/var/jenkins_home', host: 'jenkins_data' }],
    cmd: null
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    image: 'elasticsearch:7.17.0',
    description: 'Güçlü arama ve analiz motoru',
    icon: 'fas fa-search',
    env: [
      { key: 'discovery.type', label: 'Discovery Type', required: true, default: 'single-node' },
      { key: 'ES_JAVA_OPTS', label: 'Java Opts', required: false, default: '-Xms512m -Xmx512m' }
    ],
    ports: [{ container: 9200, host: 9200 }],
    volumes: [{ container: '/usr/share/elasticsearch/data', host: 'elasticsearch_data' }],
    cmd: null
  },
  {
    id: 'kibana',
    name: 'Kibana',
    image: 'kibana:7.17.0',
    description: 'Elasticsearch için görselleştirme aracı',
    icon: 'fas fa-chart-pie',
    env: [
      { key: 'ELASTICSEARCH_HOSTS', label: 'Elasticsearch Host', required: true, default: 'http://elasticsearch:9200' }
    ],
    ports: [{ container: 5601, host: 5601 }],
    volumes: [],
    cmd: null
  },
  {
    id: 'rabbitmq',
    name: 'RabbitMQ',
    image: 'rabbitmq:3-management',
    description: 'Message broker ve queue sistemi',
    icon: 'fas fa-exchange-alt',
    env: [
      { key: 'RABBITMQ_DEFAULT_USER', label: 'Admin Kullanıcı', required: true, default: 'admin' },
      { key: 'RABBITMQ_DEFAULT_PASS', label: 'Admin Şifre', required: true, default: 'admin' }
    ],
    ports: [
      { container: 5672, host: 5672 },
      { container: 15672, host: 15672 }
    ],
    volumes: [{ container: '/var/lib/rabbitmq', host: 'rabbitmq_data' }],
    cmd: null
  },
  {
    id: 'minio',
    name: 'MinIO',
    image: 'minio/minio:latest',
    description: 'Yüksek performanslı object storage',
    icon: 'fas fa-hdd',
    env: [
      { key: 'MINIO_ROOT_USER', label: 'Access Key', required: true, default: 'minioadmin' },
      { key: 'MINIO_ROOT_PASSWORD', label: 'Secret Key', required: true, default: 'minioadmin' }
    ],
    ports: [
      { container: 9000, host: 9001 },
      { container: 9001, host: 9002 }
    ],
    volumes: [{ container: '/data', host: 'minio_data' }],
    cmd: ['server', '/data', '--console-address', ':9001']
  },
  {
    id: 'traefik',
    name: 'Traefik',
    image: 'traefik:latest',
    description: 'Modern reverse proxy ve load balancer',
    icon: 'fas fa-route',
    env: [],
    ports: [
      { container: 80, host: 8086 },
      { container: 8080, host: 8087 }
    ],
    volumes: [
      { container: '/var/run/docker.sock', host: '/var/run/docker.sock' }
    ],
    cmd: ['--api.insecure=true', '--providers.docker=true', '--providers.docker.exposedbydefault=false', '--entrypoints.web.address=:80']
  }
];

router.get('/templates', (req, res) => {
  res.json({ success: true, data: appTemplates });
});

router.post('/install', async (req, res) => {
  try {
    const { templateId, name, env, ports } = req.body;

    const template = appTemplates.find(t => t.id === templateId);
    if (!template) {
      return res.status(400).json({ success: false, error: 'Şablon bulunamadı' });
    }

    const envVars = [];
    if (env && Array.isArray(env)) {
      env.forEach(e => {
        if (e.key && e.value) {
          envVars.push(`${e.key}=${e.value}`);
        }
      });
    }

    if (template.env) {
      template.env.forEach(e => {
        if (e.default && !envVars.find(ev => ev.startsWith(e.key + '='))) {
          envVars.push(`${e.key}=${e.default}`);
        }
      });
    }

    const containerConfig = {
      Image: template.image,
      name: name || `${template.id}-${Date.now()}`,
      Env: envVars,
      ExposedPorts: {},
      HostConfig: {
        PortBindings: {},
        RestartPolicy: { Name: 'unless-stopped' }
      }
    };

    if (template.cmd && template.cmd.length > 0) {
      containerConfig.Cmd = template.cmd;
    }

    const portConfig = ports || template.ports;
    if (portConfig && portConfig.length > 0) {
      portConfig.forEach(port => {
        const portKey = `${port.container}/tcp`;
        containerConfig.ExposedPorts[portKey] = {};
        containerConfig.HostConfig.PortBindings[portKey] = [{ HostPort: String(port.host) }];
      });
    }

    if (template.volumes && template.volumes.length > 0) {
      containerConfig.HostConfig.Binds = template.volumes.map(vol => 
        `${vol.host}:${vol.container}`
      );
    }

    console.log('Container Config:', JSON.stringify(containerConfig, null, 2));

    const container = await dockerService.createContainer(containerConfig);
    await dockerService.startContainer(container.id);

    if (global.addActivity) {
      global.addActivity({
        type: 'download',
        color: 'blue',
        title: 'Uygulama kuruldu',
        subtitle: template.name
      });
    }

    res.json({ 
      success: true, 
      message: `${template.name} başarıyla kuruldu!`,
      containerId: container.id,
      containerName: containerConfig.name
    });
  } catch (error) {
    console.error('Container kurulum hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;