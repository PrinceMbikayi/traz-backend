// models/reportModel.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  documentName: { type: String, required: true },
  otherDocumentName: { type: String, required: false },
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  city: { type: String, required: true },
  imageUrl: { type: String },
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
