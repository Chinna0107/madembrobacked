require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', require('./Routes/auth'));
app.use('/api/admin', require('./Routes/AdminRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Madembro API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
