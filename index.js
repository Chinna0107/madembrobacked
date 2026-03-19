require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'https://madembro.vercel.app',
].filter(Boolean);
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)) }));
app.use(express.json());

app.use('/api/auth', require('./Routes/auth'));
app.use('/api/admin', require('./Routes/AdminRoutes'));
app.use('/api/orders', require('./Routes/orders'));
app.use('/api/user', require('./Routes/user'));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Madembro API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
