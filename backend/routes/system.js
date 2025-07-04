const express = require('express');
const router = express.Router();
const dockerService = require('../services/dockerService');

router.get('/info', async (req, res) => {
  try {
    const info = await dockerService.getSystemInfo();
    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await dockerService.getSystemStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
