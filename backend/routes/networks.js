const express = require('express');
const router = express.Router();
const dockerService = require('../services/dockerService');

router.get('/', async (req, res) => {
  try {
    const networks = await dockerService.getNetworks();
    res.json({ success: true, data: networks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const network = await dockerService.createNetwork(req.body);
    res.status(201).json({ success: true, data: network });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await dockerService.removeNetwork(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/inspect', async (req, res) => {
  try {
    const result = await dockerService.inspectNetwork(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;