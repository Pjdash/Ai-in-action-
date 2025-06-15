const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  category: { type: String }, 
  material: { type: String }, 
  description: { type: String }, 
  cost_price: { type: Number }, 
  selling_price: { type: Number }, 
  supplier_id: { type: String }, 
  current_stock: { type: Number, default: 0 }, 
  last_sold_date: { type: Date } 
}, { timestamps: true }); 
module.exports = mongoose.model('Product', productSchema);