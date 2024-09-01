// controllers/reportController.js
const Report = require('../models/reportModel');
const cloudinary = require('cloudinary').v2;

const createReport = async (req, res) => {
  console.log('Request Received:', req.body);
  console.log('File Uploaded:', req.file);

  const { documentName, otherDocumentName, fullName, phoneNumber, city } = req.body;
  const imageUrl = req.file ? req.file.path : null;

  try {
    const newReport = new Report({
      documentName,
      otherDocumentName: otherDocumentName || '',
      fullName,
      phoneNumber,
      city,
      imageUrl,
    });

    await newReport.save();

    res.status(201).json({ message: 'Report created successfully!', report: newReport });
  } catch (error) {
    console.error('Error in createReport:', error);
    res.status(500).json({ message: 'Error creating report', error: error.message });
  }
};

// Nouvelle fonction pour rechercher des rapports
const searchReports = async (req, res) => {
  const { query } = req.query; // Récupère la requête de recherche depuis les query params

  try {
    const reports = await Report.find({
      documentName: { $regex: query, $options: 'i' } // Cherche les documents dont le nom correspond à la requête
    });

    if (reports.length === 0) {
      return res.status(404).json({ message: 'Aucun rapport trouvé' });
    }

    res.json(reports); // Retourne les résultats au frontend
  } catch (error) {
    console.error('Erreur lors de la recherche des rapports:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { createReport, searchReports };
