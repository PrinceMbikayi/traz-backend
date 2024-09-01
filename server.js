require('dotenv').config();
const connectDB = require('./config/db');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');

dotenv.config();
connectDB();

const app = express();

// Middleware pour le parsing des données JSON
app.use(express.json());

// Middleware pour le parsing des données URL-encoded
app.use(express.urlencoded({ extended: true }));

// Middleware pour gérer les requêtes CORS
app.use(cors());  // Si nécessaire pour gérer les requêtes cross-origin

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
