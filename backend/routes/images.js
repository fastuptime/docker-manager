const express = require('express');
const router = express.Router();
const dockerService = require('../services/dockerService');

router.get('/', async (req, res) => {
  try {
    const images = await dockerService.getImages();
    res.json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/pull', async (req, res) => {
  try {
    const result = await dockerService.pullImage(req.body.name);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await dockerService.removeImage(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/inspect', async (req, res) => {
  try {
    const result = await dockerService.inspectImage(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;