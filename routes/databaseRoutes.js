const express = require('express');
const { getAllDatabase, createNewDatabase } = require('../controllers/databaseController');

const router = express.Router();
router.use(express.json())

router.get('/', getAllDatabase);
router.post('/create', createNewDatabase);


module.exports = router;