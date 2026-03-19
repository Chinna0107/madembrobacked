const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sql = require('../db');

const router = express.Router();

// Init OTPs table
sql`
  CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`.catch(console.error);

// Create users table
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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) return res.status(409).json({ message: 'Email already registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sql`DELETE FROM otps WHERE email = ${email.toLowerCase()}`;
    await sql`INSERT INTO otps (email, otp, expires_at) VALUES (${email.toLowerCase()}, ${otp}, ${new Date(Date.now() + 10 * 60 * 1000)})`;

    await transporter.sendMail({
      from: `"Madembro" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Your Madembro OTP',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:12px;">
          <h2 style="margin-bottom:8px;">Verify your email</h2>
          <p style="color:#aaa;font-size:14px;">Use the OTP below to complete your registration. It expires in 10 minutes.</p>
          <div style="font-size:36px;font-weight:900;letter-spacing:12px;text-align:center;margin:32px 0;color:#fff;">${otp}</div>
          <p style="color:#555;font-size:12px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: `OTP sent to ${email}` });
  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  try {
    const [record] = await sql`SELECT * FROM otps WHERE email = ${email.toLowerCase()} ORDER BY created_at DESC LIMIT 1`;
    if (!record) return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    if (new Date() > new Date(record.expires_at)) {
      await sql`DELETE FROM otps WHERE email = ${email.toLowerCase()}`;
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (record.otp !== otp.trim()) return res.status(400).json({ message: 'Invalid OTP' });
    res.json({ message: 'OTP verified' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) return res.status(409).json({ message: 'Email already registered' });

    // OTP must have been verified
    const [record] = await sql`SELECT * FROM otps WHERE email = ${email.toLowerCase()} ORDER BY created_at DESC LIMIT 1`;
    if (!record) return res.status(400).json({ message: 'Email not verified. Please verify OTP first.' });
    await sql`DELETE FROM otps WHERE email = ${email.toLowerCase()}`;

    const hashed = await bcrypt.hash(password, 10);
    const [user] = await sql`
      INSERT INTO users (first_name, last_name, email, password)
      VALUES (${firstName}, ${lastName}, ${email}, ${hashed})
      RETURNING id, first_name, last_name, email`;

    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: false }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { firstName: user.first_name, lastName: user.last_name, email: user.email, role: 'user' } });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  try {
    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.is_admin ? 'admin' : 'user' } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
