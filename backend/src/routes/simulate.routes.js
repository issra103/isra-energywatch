const express = require('express');
const router  = express.Router();
const auth = require('../middleware/auth');
const { getStatus, startSimulator, stopSimulator } = require('../controllers/simulate.controller');

router.use(auth);

router.get('/status',  getStatus);
router.post('/start',  startSimulator);
router.post('/stop',   stopSimulator);

module.exports = router;
