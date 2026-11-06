const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  transactionId: { type: String, required: true, unique: true },
  ticketNumber: { type: String, required: true, unique: true },
  status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
  isWinner: { type: Boolean, default: false },
  prizeWon: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);