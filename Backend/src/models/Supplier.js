const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplier_id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  lead_time_days: { type: Number }, 
  quality_rating: { type: Number } 
});

module.exports = mongoose.model('Supplier', supplierSchema);