const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/', eventController.getDukeEvents);

router.post('/rank', eventController.rankEvents);

router.get('/majors', eventController.getMajors);

module.exports = router;