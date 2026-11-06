const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema({
  prizeName: { type: String, required: true }, // ምሳሌ፡ 1ኛ ደረጃ - 1,000,000 ብር
  amount: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prize', prizeSchema);