const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// የ Supabase ግንኙነት ማዋቀሪያ
const supabaseUrl = 'https://mepkkaulyxdbllekzqvq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lcGtrYXVseGRiYmxla3p2cXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5NjI3OTEsImV4cCI6MjEwOTUzODc5MX0.0XdvgT4BRuF5n1Ys6-rmayp9XodfvcXizk2W6A3Io_4';
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. ቲኬት መግዛት
app.post('/api/buy-ticket', async (req, res) => {
  try {
    const { fullName, phone, paymentMethod, transactionId } = req.body;
    if (!fullName || !phone || !transactionId) {
      return res.status(400).json({ success: false, message: 'እባክዎን ሁሉንም መረጃዎች ይሙሉ' });
    }

    const ticketNumber = 'ETH-' + Math.floor(100000 + Math.random() * 900000);
    
    const { data, error } = await supabase
      .from('tickets')
      .insert([
        { 
          fullName: fullName, 
          phone: phone, 
          paymentMethod: paymentMethod, 
          transactionId: transactionId, 
          ticketNumber: ticketNumber,
          status: 'Pending',
          isWinner: false,
          prizeWon: null
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ success: false, message: 'ይህ የትራንዛክሽን ቁጥር ቀድሞ ጥቅም ላይ ውሏል!' });
      }
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, ticket: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. የተረጋገጡ ቲኬቶች
app.get('/api/tickets', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'Approved')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    res.json({ success: true, tickets: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. የሽልማቶች ዝርዝር ማምጣት
app.get('/api/prizes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('prizes')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    res.json({ success: true, prizes: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. አድሚን - አዲስ ሽልማት መመዝገብ
app.post('/api/admin/add-prize', async (req, res) => {
  try {
    const { prizeName, amount, description } = req.body;
    const { error } = await supabase
      .from('prizes')
      .insert([{ prizeName: prizeName, amount: amount, description: description }]);

    if (error) throw error;
    res.json({ success: true, message: 'ሽልማቱ ተመዝግቧል' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. ተጠቃሚው በስልክ ቁጥር መፈለጊያ
app.get('/api/my-tickets/:phone', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('phone', req.params.phone)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    res.json({ success: true, tickets: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. አድሚን - ሁሉንም ቲኬቶች ማየት
app.get('/api/admin/tickets', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    res.json({ success: true, tickets: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. አድሚን - ቲኬት ማጽደቅ
app.post('/api/admin/approve/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'Approved' })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'ቲኬቱ ጸድቋል' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. የቀጥታ ዕጣ ማውጫ (Live Draw)
app.post('/api/draw-winner', async (req, res) => {
  try {
    const { data: approvedTickets, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'Approved')
      .eq('isWinner', false);

    if (fetchError) throw fetchError;
    if (!approvedTickets || approvedTickets.length === 0) {
      return res.status(400).json({ success: false, message: 'ለዕጣ የሚሆን የጸደቀ ቲኬት የለም' });
    }

    const randomIndex = Math.floor(Math.random() * approvedTickets.length);
    const winner = approvedTickets[randomIndex];
    const prize = req.body.prize || '1,000,000 ብር';

    const { error: updateError } = await supabase
      .from('tickets')
      .update({ isWinner: true, prizeWon: prize })
      .eq('id', winner.id);

    if (updateError) throw updateError;

    res.json({ success: true, winner: { ...winner, isWinner: true, prizeWon: prize } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ሰርቨሩ በ http://localhost:${PORT} ላይ ከ Supabase ጋር እየሰራ ነው`);
});
