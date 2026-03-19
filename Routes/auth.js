const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('../db');

const router = express.Router();

// Create users table and add is_admin if not exists
sql`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
  )
`.then(() =>
  sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`
).catch(console.error);

router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [user] = await sql`
      INSERT INTO users (first_name, last_name, email, password)
      VALUES (${firstName}, ${lastName}, ${email}, ${hashed})
      RETURNING id, first_name, last_name, email
    `;

    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: false }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { firstName: user.first_name, lastName: user.last_name, email: user.email, role: 'user' } });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.is_admin ? 'admin' : 'user' } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
