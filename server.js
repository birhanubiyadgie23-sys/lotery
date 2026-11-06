const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Ticket = require('./models/Ticket');
const Prize = require('./models/Prize');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// የዳታቤዝ ግንኙነት
mongoose.connect('mongodb://127.0.0.1:27017/ethio_lottery')
  .then(() => console.log('MongoDB ዳታቤዝ ተገናኝቷል'))
  .catch(err => console.log('የዳታቤዝ ስህተት:', err));

// 1. ቲኬት መግዛት
app.post('/api/buy-ticket', async (req, res) => {
  try {
    const { fullName, phone, paymentMethod, transactionId } = req.body;
    if (!fullName || !phone || !transactionId) {
      return res.status(400).json({ success: false, message: 'እባክዎን ሁሉንም መረጃዎች ይሙሉ' });
    }

    const ticketNumber = 'ETH-' + Math.floor(100000 + Math.random() * 900000);
    const newTicket = new Ticket({ fullName, phone, paymentMethod, transactionId, ticketNumber });
    await newTicket.save();

    res.json({ success: true, ticket: newTicket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ይህ የትራንዛክሽን ቁጥር ቀድሞ ጥቅም ላይ ውሏል!' });
  }
});

// 2. የተረጋገጡ ቲኬቶች
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find({ status: 'Approved' }).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. የሽልማቶች ዝርዝር ማምጣት
app.get('/api/prizes', async (req, res) => {
  try {
    const prizes = await Prize.find().sort({ createdAt: -1 });
    res.json({ success: true, prizes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. አድሚን - አዲስ ሽልማት መመዝገብ
app.post('/api/admin/add-prize', async (req, res) => {
  try {
    const { prizeName, amount, description } = req.body;
    const newPrize = new Prize({ prizeName, amount, description });
    await newPrize.save();
    res.json({ success: true, message: 'ሽልማቱ ተመዝግቧል' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. ተጠቃሚው በስልክ ቁጥር መፈለጊያ
app.get('/api/my-tickets/:phone', async (req, res) => {
  try {
    const tickets = await Ticket.find({ phone: req.params.phone }).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. አድሚን - ሁሉንም ቲኬቶች ማየት
app.get('/api/admin/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. አድሚን - ቲኬት ማጽደቅ
app.post('/api/admin/approve/:id', async (req, res) => {
  try {
    await Ticket.findByIdAndUpdate(req.params.id, { status: 'Approved' });
    res.json({ success: true, message: 'ቲኬቱ ጸድቋል' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. የቀጥታ ዕጣ ማውጫ (Live Draw)
app.post('/api/draw-winner', async (req, res) => {
  try {
    const approvedTickets = await Ticket.find({ status: 'Approved', isWinner: false });
    if (approvedTickets.length === 0) {
      return res.status(400).json({ success: false, message: 'ለዕጣ የሚሆን የጸደቀ ቲኬት የለም' });
    }

    const randomIndex = Math.floor(Math.random() * approvedTickets.length);
    const winner = approvedTickets[randomIndex];

    winner.isWinner = true;
    winner.prizeWon = req.body.prize || '1,000,000 ብር';
    await winner.save();

    res.json({ success: true, winner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(5000, () => {
  console.log('ሰርቨሩ በ http://localhost:5000 ላይ እየሰራ ነው');
});