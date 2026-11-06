const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// የ Supabase (PostgreSQL) የግንኙነት ማዋቀሪያ
// (ማስታወሻ፡ [YOUR-PASSWORD] በሚለው ቦታ ትክክለኛ የዳታቤዝ ፓስወርድዎን ያስገቡበት)
const pool = new Pool({
  connectionString: 'postgresql://postgres.mepkkaulyxdbllekzqvq:YOUR-PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

// የዳታቤዝ ሠንጠረዦችን በራስ-ሰር ማዘጋጀት
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        transaction_id VARCHAR(100) UNIQUE NOT NULL,
        ticket_number VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        is_winner BOOLEAN DEFAULT FALSE,
        prize_won VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS prizes (
        id SERIAL PRIMARY KEY,
        prize_name VARCHAR(255) NOT NULL,
        amount VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('ከ Supabase PostgreSQL ዳታቤዝ ጋር በተሳካ ሁኔታ ተገናኝቷል!');
  } catch (err) {
    console.error('የዳታቤዝ ማዋቀር ስህተት:', err);
  }
}
initDB();

// 1. ቲኬት መግዛት
app.post('/api/buy-ticket', async (req, res) => {
  try {
    const { fullName, phone, paymentMethod, transactionId } = req.body;
    if (!fullName || !phone || !transactionId) {
      return res.status(400).json({ success: false, message: 'እባክዎን ሁሉንም መረጃዎች ይሙሉ' });
    }

    const ticketNumber = 'ETH-' + Math.floor(100000 + Math.random() * 900000);
    const query = `
      INSERT INTO tickets (full_name, phone, payment_method, transaction_id, ticket_number) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const values = [fullName, phone, paymentMethod, transactionId, ticketNumber];
    const result = await pool.query(query, values);

    res.json({ success: true, ticket: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'ይህ የትራንዛክሽን ቁጥር ቀድሞ ጥቅም ላይ ውሏል!' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. የተረጋገጡ ቲኬቶች
app.get('/api/tickets', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tickets WHERE status = 'Approved' ORDER BY created_at DESC");
    res.json({ success: true, tickets: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. የሽልማቶች ዝርዝር ማምጣት
app.get('/api/prizes', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM prizes ORDER BY created_at DESC");
    res.json({ success: true, prizes: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. አድሚን - አዲስ ሽልማት መመዝገብ
app.post('/api/admin/add-prize', async (req, res) => {
  try {
    const { prizeName, amount, description } = req.body;
    await pool.query(
      "INSERT INTO prizes (prize_name, amount, description) VALUES ($1, $2, $3)",
      [prizeName, amount, description]
    );
    res.json({ success: true, message: 'ሽልማቱ ተመዝግቧል' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. ተጠቃሚው በስልክ ቁጥር መፈለጊያ
app.get('/api/my-tickets/:phone', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tickets WHERE phone = $1 ORDER BY created_at DESC", [req.params.phone]);
    res.json({ success: true, tickets: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. አድሚን - ሁሉንም ቲኬቶች ማየት
app.get('/api/admin/tickets', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tickets ORDER BY created_at DESC");
    res.json({ success: true, tickets: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. አድሚን - ቲኬት ማጽደቅ
app.post('/api/admin/approve/:id', async (req, res) => {
  try {
    await pool.query("UPDATE tickets SET status = 'Approved' WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: 'ቲኬቱ ጸድቋል' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. የቀጥታ ዕጣ ማውጫ (Live Draw)
app.post('/api/draw-winner', async (req, res) => {
  try {
    const approved = await pool.query("SELECT * FROM tickets WHERE status = 'Approved' AND is_winner = FALSE");
    if (approved.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'ለዕጣ የሚሆን የጸደቀ ቲኬት የለም' });
    }

    const randomIndex = Math.floor(Math.random() * approved.rows.length);
    const winner = approved.rows[randomIndex];
    const prize = req.body.prize || '1,000,000 ብር';

    await pool.query("UPDATE tickets SET is_winner = TRUE, prize_won = $1 WHERE id = $2", [prize, winner.id]);

    res.json({ success: true, winner: { ...winner, prizeWon: prize } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ሰርቨሩ በ http://localhost:${PORT} ላይ እየሰራ ነው`);
});
