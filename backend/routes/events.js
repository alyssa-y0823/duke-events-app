// routes/events.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// GET /events?future_days=30
router.get('/', eventController.getDukeEvents);

module.exports = router;