const mongoose = require('mongoose');

const saleOrderSchema = new mongoose.Schema({
  order_id: { type: String, unique: true, required: true }, 
  product_id: { type: String, required: true },
  quantity: { type: Number, required: true }, 
  price: { type: Number, required: true }, 
  order_date: { type: Date, required: true }, 
  return_status: { type: Boolean, default: false },
  discount_applied: { type: Number, default: 0 }, 
  customer_id: { type: String } 
}, { timestamps: true });

module.exports = mongoose.model('SaleOrder', saleOrderSchema);