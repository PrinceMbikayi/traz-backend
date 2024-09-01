// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { createReport, searchReports } = require('../controllers/reportController');
const { upload } = require('../config/cloudinaryConfig');


router.post('/', upload.single('image'), createReport);
router.get('/search', searchReports);

module.exports = router;
