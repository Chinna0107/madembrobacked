const express = require('express');
const jwt = require('jsonwebtoken');
const sql = require('../db');

const router = express.Router();

// Init orders table
sql`
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_details JSONB DEFAULT '{}',
    items JSONB NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    tax NUMERIC(10,2) NOT NULL,
    shipping NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
  )
`.catch(console.error);

// Optional auth — works for guests too
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch {}
  }
  next();
};

const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ message: 'Forbidden' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /api/orders?email= — fetch orders by email (guest or logged-in)
router.get('/', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    const orders = await sql`
      SELECT * FROM orders
      WHERE LOWER(customer_email) = LOWER(${email})
      ORDER BY created_at DESC`;
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/lookup — public, lookup order by email to verify phone
router.get('/lookup', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    const [order] = await sql`
      SELECT customer_name, customer_phone FROM orders
      WHERE LOWER(customer_email) = LOWER(${email})
      ORDER BY created_at DESC LIMIT 1`;
    if (!order) return res.status(404).json({ message: 'No orders found for this email' });
    res.json({ customer_name: order.customer_name, customer_phone: order.customer_phone });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/orders — place order (guest or logged-in user)
router.post('/', optionalAuth, async (req, res) => {
  const {
    customer_name, customer_email, customer_phone,
    shipping_address, payment_method, payment_details,
    items, subtotal, tax, shipping, total
  } = req.body;

  if (!customer_name || !customer_email || !shipping_address || !payment_method || !items?.length) {
    return res.status(400).json({ message: 'Missing required order fields' });
  }

  try {
    const user_id = req.user?.id || null;
    const [order] = await sql`
      INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, shipping_address,
        payment_method, payment_details, items, subtotal, tax, shipping, total, status)
      VALUES (${user_id}, ${customer_name}, ${customer_email}, ${customer_phone || null},
        ${shipping_address}, ${payment_method}, ${JSON.stringify(payment_details || {})},
        ${JSON.stringify(items)}, ${subtotal}, ${tax}, ${shipping}, ${total}, 'pending')
      RETURNING id, status, total, created_at`;
    res.status(201).json({ order_id: order.id, status: order.status, total: order.total });
  } catch (err) {
    console.error('Place order error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// --- Admin routes ---

// GET /api/orders/admin — all orders
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const orders = status && status !== 'all'
      ? await sql`SELECT * FROM orders WHERE status = ${status} ORDER BY created_at DESC`
      : await sql`SELECT * FROM orders ORDER BY created_at DESC`;
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/admin/:id — single order detail
router.get('/admin/:id', adminAuth, async (req, res) => {
  try {
    const [order] = await sql`SELECT * FROM orders WHERE id = ${req.params.id}`;
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/admin/:id — update status
router.put('/admin/:id', adminAuth, async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
  try {
    const [order] = await sql`
      UPDATE orders SET status = ${status} WHERE id = ${req.params.id} RETURNING id, status`;
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/orders/admin/:id
router.delete('/admin/:id', adminAuth, async (req, res) => {
  try {
    await sql`DELETE FROM orders WHERE id = ${req.params.id}`;
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
