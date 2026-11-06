CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    fullName TEXT NOT NULL,
    phone TEXT NOT NULL,
    paymentMethod TEXT NOT NULL,
    transactionId TEXT UNIQUE NOT NULL,
    ticketNumber TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Pending',
    isWinner BOOLEAN DEFAULT FALSE,
    prizeWon TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
