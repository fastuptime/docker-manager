const express = require('express');
const router = express.Router();
const dockerService = require('../services/dockerService');

router.get('/', async (req, res) => {
  try {
    const volumes = await dockerService.getVolumes();
    res.json({ success: true, data: volumes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const volume = await dockerService.createVolume(req.body);
    res.status(201).json({ success: true, data: volume });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:name', async (req, res) => {
  try {
    const result = await dockerService.removeVolume(req.params.name);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:name/inspect', async (req, res) => {
  try {
    const result = await dockerService.inspectVolume(req.params.name);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;