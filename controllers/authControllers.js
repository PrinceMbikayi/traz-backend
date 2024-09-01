const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { cloudinary } = require('../config/cloudinaryConfig');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { google } = require('googleapis');

// Initialisation du client OAuth2 pour l'envoi d'emails
const oauth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID, // ID client
  process.env.OAUTH_CLIENT_SECRET, // Secret client
  'https://developers.google.com/oauthplayground' // Redirection URL
);

oauth2Client.setCredentials({
  refresh_token: process.env.OAUTH_REFRESH_TOKEN,
});

const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Vérifier si une image a été téléchargée
    let profileImage = '';

    // Si un fichier est téléchargé, l'uploader sur Cloudinary
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path);
        profileImage = result.secure_url; // Utiliser l'URL sécurisé retourné par Cloudinary
      } catch (uploadError) {
        console.error('Error uploading image to Cloudinary:', uploadError);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    // Génération du code de confirmation
    const confirmationCode = crypto.randomBytes(2).toString('hex'); // 4 chiffres hexadécimaux

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      profileImage,
      confirmationCode,
    });
    
    console.log('Confirmation Code:', confirmationCode);

    // Obtenez un access token OAuth2
    const accessToken = await oauth2Client.getAccessToken();

    // Envoi de l'email avec le code de confirmation
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.OAUTH_CLIENT_ID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Account Confirmation Code',
      text: `Your confirmation code is: ${confirmationCode}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(201).json({
        message: 'User registered successfully, please check your email for the confirmation code',
        user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        token: generateToken(user._id),
      }
      });
    } catch (error) {
      console.error('Error sending email:', error);
     return res.status(400).json({ message: 'Server error' });
    }
  } catch (error) {
    console.error('Server error:', error);
   return res.status(500).json({ message: 'Server error', error: err.message || 'An unknown error occurred' });
  }
});

const confirmUser = asyncHandler(async (req, res) => {
  console.log('Confirmation endpoint hit');

  try {
  const { email, confirmationCode } = req.body;

  if (!email || !confirmationCode) {
    console.log('Email or confirmation code missing');
    return res.status(400).json({ message: 'Email and confirmation code are required' });
  }

  console.log('Received email:', email);
  console.log('Received confirmation code:', confirmationCode);

  const user = await User.findOne({ email });

  if (!user) {
    console.log('User not found');
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.confirmationCode.trim().toLowerCase() === confirmationCode.trim().toLowerCase()) {
    user.isConfirmed = true;
    user.confirmationCode = ''; // Clear the confirmation code after successful confirmation
    await user.save();
    console.log('User confirmed successfully');
    return res.status(200).json({ message: 'Account confirmed successfully' });
  } else {
    console.log('Invalid confirmation code');
    return res.status(400).json({ message: 'Invalid confirmation code' });
  } 
 } catch (error) {
    console.error('Error during confirmation:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt:', { email });

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    console.log('User found:', { userId: user._id });

  // Vérifier si le mot de passe est correct
  if (!(await user.matchPassword(password))) {
    console.log('Incorrect password');
    return res.status(401).json({ message: 'Mot de passe incorrect' });
  }

    // Générer un token
    const token = generateToken(user._id);

    res.json({
      user: { 
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      },
      token,
    });
});

const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'User logged out successfully' });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  
  if (user) {
    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      profileImage: user.profileImage,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    if (req.body.password) {
      user.password = req.body.password;
    }

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path);
        user.profileImage = result.secure_url; // Mettre à jour l'image de profil
      } catch (uploadError) {
        console.error('Error uploading image to Cloudinary:', uploadError);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      profileImage: updatedUser.profileImage,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = { registerUser, loginUser, logoutUser, getUserProfile, updateUserProfile, confirmUser };
