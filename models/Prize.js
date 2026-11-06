CREATE TABLE prizes (
    id SERIAL PRIMARY KEY,
    prizeName TEXT NOT NULL,
    amount TEXT NOT NULL,
    description TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
