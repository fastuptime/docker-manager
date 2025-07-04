const Docker = require('dockerode');
const winston = require('winston');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Docker bağlantısı
const docker = new Docker({
  socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock'
});

class DockerService {
  // Container işlemleri
  async getContainers(all = false) {
    try {
      const containers = await docker.listContainers({ all });
      return containers.map(container => ({
        id: container.Id,
        name: container.Names[0].replace('/', ''),
        image: container.Image,
        status: container.Status,
        state: container.State,
        created: container.Created,
        ports: container.Ports
      }));
    } catch (error) {
      logger.error('Container listesi alınamadı:', error);
      throw new Error('Container listesi alınamadı');
    }
  }

  async getContainer(id) {
    try {
      const container = docker.getContainer(id);
      const info = await container.inspect();
      return {
        id: info.Id,
        name: info.Name.replace('/', ''),
        image: info.Config.Image,
        status: info.State.Status,
        state: info.State,
        created: info.Created,
        config: info.Config,
        networkSettings: info.NetworkSettings
      };
    } catch (error) {
      logger.error(`Container ${id} bilgileri alınamadı:`, error);
      throw new Error('Container bilgileri alınamadı');
    }
  }

  async createContainer(options) {
    try {
      // Eğer market.js'den gelen tam yapılandırma varsa direkt kullan
      if (options.Image && options.name) {
        const container = await docker.createContainer(options);
        logger.info(`Container oluşturuldu: ${container.id}`);
        return { success: true, message: 'Container oluşturuldu', id: container.id };
      }

      const containerConfig = {
        Image: options.image,
        name: options.name,
        ExposedPorts: {},
        HostConfig: {
          PortBindings: {}
        }
      };

      // Port mapping
      if (options.ports) {
        const portMappings = options.ports.split(',').map(p => p.trim());
        portMappings.forEach(mapping => {
          const [hostPort, containerPort] = mapping.split(':');
          if (hostPort && containerPort) {
            const key = `${containerPort}/tcp`;
            containerConfig.ExposedPorts[key] = {};
            containerConfig.HostConfig.PortBindings[key] = [{ HostPort: hostPort }];
          }
        });
      }

      const container = await docker.createContainer(containerConfig);
      logger.info(`Container oluşturuldu: ${container.id}`);
      return { success: true, message: 'Container oluşturuldu', id: container.id };
    } catch (error) {
      logger.error('Container oluşturulamadı:', error);
      throw new Error('Container oluşturulamadı');
    }
  }

  async startContainer(id) {
    try {
      const container = docker.getContainer(id);
      await container.start();
      logger.info(`Container başlatıldı: ${id}`);
      return { success: true, message: 'Container başlatıldı' };
    } catch (error) {
      logger.error(`Container ${id} başlatılamadı:`, error);
      throw new Error('Container başlatılamadı');
    }
  }

  async stopContainer(id) {
    try {
      const container = docker.getContainer(id);
      await container.stop();
      logger.info(`Container durduruldu: ${id}`);
      return { success: true, message: 'Container durduruldu' };
    } catch (error) {
      logger.error(`Container ${id} durdurulamadı:`, error);
      throw new Error('Container durdurulamadı');
    }
  }

  async removeContainer(id) {
    try {
      const container = docker.getContainer(id);
      await container.remove({ force: true });
      logger.info(`Container silindi: ${id}`);
      return { success: true, message: 'Container silindi' };
    } catch (error) {
      logger.error(`Container ${id} silinemedi:`, error);
      throw new Error('Container silinemedi');
    }
  }

  async restartContainer(id) {
    try {
      const container = docker.getContainer(id);
      await container.restart();
      logger.info(`Container yeniden başlatıldı: ${id}`);
      return { success: true, message: 'Container yeniden başlatıldı' };
    } catch (error) {
      logger.error(`Container ${id} yeniden başlatılamadı:`, error);
      throw new Error('Container yeniden başlatılamadı');
    }
  }

  async getContainerLogs(id, options = {}) {
    try {
      const container = docker.getContainer(id);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: options.tail || 100,
        timestamps: true,
        ...options
      });
      return logs.toString('utf8');
    } catch (error) {
      logger.error(`Container ${id} logları alınamadı:`, error);
      throw new Error('Container logları alınamadı');
    }
  }

  async followLogs(id) {
    try {
      const container = docker.getContainer(id);
      const stream = await container.logs({
        stdout: true,
        stderr: true,
        follow: true,
        timestamps: true
      });
      return stream;
    } catch (error) {
      logger.error(`Container ${id} log takibi başlatılamadı:`, error);
      throw new Error('Log takibi başlatılamadı');
    }
  }

  // Image işlemleri
  async getImages() {
    try {
      const images = await docker.listImages({ all: false });
      return images.map(image => ({
        id: image.Id,
        repoTags: image.RepoTags,
        created: image.Created,
        size: image.Size,
        virtualSize: image.VirtualSize
      }));
    } catch (error) {
      logger.error('Image listesi alınamadı:', error);
      throw new Error('Image listesi alınamadı');
    }
  }

  async pullImage(imageName) {
    try {
      const stream = await docker.pull(imageName);
      return new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err, res) => {
          if (err) {
            logger.error(`Image ${imageName} çekilemedi:`, err);
            reject(new Error('Image çekilemedi'));
          } else {
            logger.info(`Image çekildi: ${imageName}`);
            resolve({ success: true, message: 'Image başarıyla çekildi' });
          }
        });
      });
    } catch (error) {
      logger.error(`Image ${imageName} çekilemedi:`, error);
      throw new Error('Image çekilemedi');
    }
  }

  async inspectImage(id) {
    try {
      const image = docker.getImage(id);
      const info = await image.inspect();
      return info;
    } catch (error) {
      logger.error(`Image ${id} detayları alınamadı:`, error);
      throw new Error('Image detayları alınamadı');
    }
  }

  // Network işlemleri
  async getNetworks() {
    try {
      const networks = await docker.listNetworks();
      return networks.map(network => ({
        id: network.Id,
        name: network.Name,
        driver: network.Driver,
        scope: network.Scope,
        created: network.Created,
        ipam: network.IPAM
      }));
    } catch (error) {
      logger.error('Network listesi alınamadı:', error);
      throw new Error('Network listesi alınamadı');
    }
  }

  async createNetwork(options) {
    try {
      const network = await docker.createNetwork({
        Name: options.name,
        Driver: options.driver || 'bridge',
        CheckDuplicate: true
      });
      logger.info(`Network oluşturuldu: ${options.name}`);
      return { success: true, message: 'Network oluşturuldu', id: network.id };
    } catch (error) {
      logger.error(`Network ${options.name} oluşturulamadı:`, error);
      throw new Error('Network oluşturulamadı');
    }
  }

  async removeNetwork(id) {
    try {
      const network = docker.getNetwork(id);
      await network.remove();
      logger.info(`Network silindi: ${id}`);
      return { success: true, message: 'Network silindi' };
    } catch (error) {
      logger.error(`Network ${id} silinemedi:`, error);
      throw new Error('Network silinemedi');
    }
  }

  async inspectNetwork(id) {
    try {
      const network = docker.getNetwork(id);
      const info = await network.inspect();
      return info;
    } catch (error) {
      logger.error(`Network ${id} detayları alınamadı:`, error);
      throw new Error('Network detayları alınamadı');
    }
  }

  // Volume işlemleri
  async getVolumes() {
    try {
      const result = await docker.listVolumes();
      return result.Volumes?.map(volume => ({
        name: volume.Name,
        driver: volume.Driver,
        mountpoint: volume.Mountpoint,
        created: volume.CreatedAt,
        scope: volume.Scope,
        labels: volume.Labels
      })) || [];
    } catch (error) {
      logger.error('Volume listesi alınamadı:', error);
      throw new Error('Volume listesi alınamadı');
    }
  }

  async createVolume(options) {
    try {
      const volume = await docker.createVolume({
        Name: options.name,
        Driver: options.driver || 'local'
      });
      logger.info(`Volume oluşturuldu: ${options.name}`);
      return { success: true, message: 'Volume oluşturuldu', name: volume.Name };
    } catch (error) {
      logger.error(`Volume ${options.name} oluşturulamadı:`, error);
      throw new Error('Volume oluşturulamadı');
    }
  }

  async removeVolume(name) {
    try {
      const volume = docker.getVolume(name);
      await volume.remove();
      logger.info(`Volume silindi: ${name}`);
      return { success: true, message: 'Volume silindi' };
    } catch (error) {
      logger.error(`Volume ${name} silinemedi:`, error);
      throw new Error('Volume silinemedi');
    }
  }

  async inspectVolume(name) {
    try {
      const volume = docker.getVolume(name);
      const info = await volume.inspect();
      return info;
    } catch (error) {
      logger.error(`Volume ${name} detayları alınamadı:`, error);
      throw new Error('Volume detayları alınamadı');
    }
  }

  async getSystemInfo() {
    try {
      const info = await docker.info();
      const version = await docker.version();
      
      // Container stats
      const containers = await this.getContainers(true);
      const runningContainers = containers.filter(c => c.state === 'running').length;
      
      // Images stats
      const images = await this.getImages();
      const totalImageSize = images.reduce((total, img) => total + (img.size || 0), 0);
      
      // Networks stats
      const networks = await this.getNetworks();
      
      // Volumes stats
      const volumes = await this.getVolumes();
      
      // Calculate volumes size (estimate)
      let totalVolumeSize = 0;
      try {
        for (const volume of volumes) {
          if (volume.mountpoint) {
            // This is a rough estimation since we can't easily get exact size
            totalVolumeSize += 100 * 1024 * 1024; // 100MB per volume estimation
          }
        }
      } catch (error) {
        logger.warn('Volume boyutu hesaplanamadı:', error);
      }

      return {
        Containers: info.Containers || 0,
        ContainersRunning: info.ContainersRunning || 0,
        ContainersPaused: info.ContainersPaused || 0,
        ContainersStopped: info.ContainersStopped || 0,
        Images: info.Images || 0,
        ImageSize: totalImageSize,
        Networks: networks.length,
        Volumes: volumes.length,
        VolumesSize: totalVolumeSize,
        ServerVersion: info.ServerVersion || 'Unknown',
        ApiVersion: version.ApiVersion || 'Unknown',
        OperatingSystem: info.OperatingSystem || 'Unknown',
        Architecture: info.Architecture || 'Unknown',
        MemTotal: info.MemTotal || 0,
        NCPU: info.NCPU || 0,
        DockerRootDir: info.DockerRootDir || 'Unknown'
      };
    } catch (error) {
      logger.error('Sistem bilgileri alınamadı:', error);
      throw new Error('Sistem bilgileri alınamadı');
    }
  }

  async getSystemStats() {
    try {
      const info = await docker.info();
      return {
        containers: {
          total: info.Containers,
          running: info.ContainersRunning,
          paused: info.ContainersPaused,
          stopped: info.ContainersStopped
        },
        images: info.Images,
        memory: {
          total: info.MemTotal,
          used: info.MemTotal - info.MemAvailable || 0
        },
        cpus: info.NCPU,
        version: info.ServerVersion,
        os: info.OperatingSystem
      };
    } catch (error) {
      logger.error('Sistem istatistikleri alınamadı:', error);
      throw new Error('Sistem istatistikleri alınamadı');
    }
  }
}

module.exports = new DockerService();
