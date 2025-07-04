const express = require('express');
const router = express.Router();
const dockerService = require('../services/dockerService');

router.get('/', async (req, res) => {
  try {
    const all = req.query.all !== 'false'; 
    const containers = await dockerService.getContainers(all);
    res.json({ success: true, data: containers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const container = await dockerService.getContainer(req.params.id);
    res.json(container);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const container = await dockerService.createContainer(req.body);
    res.status(201).json({ success: true, data: container });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/start', async (req, res) => {
  try {
    const result = await dockerService.startContainer(req.params.id);

    if (global.addActivity) {
      global.addActivity({
        type: 'play',
        color: 'green',
        title: 'Container başlatıldı',
        subtitle: req.params.id.substring(0, 12)
      });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    const result = await dockerService.stopContainer(req.params.id);

    if (global.addActivity) {
      global.addActivity({
        type: 'stop',
        color: 'red',
        title: 'Container durduruldu',
        subtitle: req.params.id.substring(0, 12)
      });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/restart', async (req, res) => {
  try {
    const result = await dockerService.restartContainer(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await dockerService.removeContainer(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/logs', async (req, res) => {
  try {
    const logs = await dockerService.getContainerLogs(req.params.id, req.query);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;