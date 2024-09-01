const express = require('express');
const { registerUser, loginUser, logoutUser, getUserProfile, updateUserProfile, confirmUser } = require('../controllers/authControllers');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinaryConfig');

const router = express.Router();

router.post('/register', upload.single('profileImage'), registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, upload.single('profileImage'), updateUserProfile);
router.post('/confirm', confirmUser);

module.exports = router;
