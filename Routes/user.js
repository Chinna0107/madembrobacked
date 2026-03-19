const express = require('express');
const jwt = require('jsonwebtoken');
const sql = require('../db');

const router = express.Router();

const userAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /api/user/profile — derived from most recent order
router.get('/profile', userAuth, async (req, res) => {
  console.log("Fetching profile");
  try {
    const [order] = await sql`
      SELECT customer_name, customer_email, customer_phone, shipping_address
      FROM orders WHERE user_id = ${req.user.id} ORDER BY created_at DESC LIMIT 1`;
    if (!order) return res.status(404).json({ message: 'No orders found' });
    const nameParts = (order.customer_name || '').split(' ');
    res.json({
      firstName: nameParts[0] || '',
      lastName:  nameParts.slice(1).join(' ') || '',
      email:     order.customer_email || '',
      phone:     order.customer_phone || '',
      address:   order.shipping_address || '',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/user/orders — orders for logged-in user
router.get('/orders', userAuth, async (req, res) => {
  try {
    const orders = await sql`
      SELECT * FROM orders WHERE user_id = ${req.user.id} ORDER BY created_at DESC`;
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
