const express = require('express');
const jwt = require('jsonwebtoken');
const sql = require('../db');

const router = express.Router();

// Init tables
sql`
  CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    link TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
  )
`.catch(console.error);

sql`
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    original_price NUMERIC(10,2),
    image_url TEXT,
    category VARCHAR(100),
    stock INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    sizes JSONB DEFAULT '[]',
    colors JSONB DEFAULT '[]',
    color_images JSONB DEFAULT '{}',
    features JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
  )
`.then(() => Promise.all([
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'`,
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS color_images JSONB DEFAULT '{}'`,
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'`,
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'`,
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2)`
])).catch(console.error);

// Auth middleware
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

// Public routes (no auth)
router.get('/public/banners', async (req, res) => {
  try {
    const banners = await sql`SELECT * FROM banners WHERE active = true ORDER BY created_at DESC`;
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/public/products', async (req, res) => {
  try {
    const { category } = req.query;
    const products = category
      ? await sql`SELECT * FROM products WHERE active = true AND category = ${category} ORDER BY created_at DESC`
      : await sql`SELECT * FROM products WHERE active = true ORDER BY created_at DESC`;
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public orders by email (for guest users)
router.get('/public/orders', async (req, res) => {
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

// Dashboard stats
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [{ count: users }] = await sql`SELECT COUNT(*) FROM users`;
    const [{ count: products }] = await sql`SELECT COUNT(*) FROM products`;
    const [{ count: banners }] = await sql`SELECT COUNT(*) FROM banners`;
    const [{ count: orders }] = await sql`SELECT COUNT(*) FROM orders`;
    const [{ sum: revenue }] = await sql`SELECT COALESCE(SUM(total),0) AS sum FROM orders WHERE status != 'cancelled'`;
    res.json({ users: +users, products: +products, banners: +banners, orders: +orders, revenue: +revenue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Banners
router.get('/banners', adminAuth, async (req, res) => {
  const banners = await sql`SELECT * FROM banners ORDER BY created_at DESC`;
  res.json(banners);
});

router.get('/banners/:id', adminAuth, async (req, res) => {
  const [banner] = await sql`SELECT * FROM banners WHERE id=${req.params.id}`;
  if (!banner) return res.status(404).json({ message: 'Not found' });
  res.json(banner);
});

router.post('/banners', adminAuth, async (req, res) => {
  const { title, image_url, link, active } = req.body;
  const [banner] = await sql`
    INSERT INTO banners (title, image_url, link, active)
    VALUES (${title}, ${image_url}, ${link || null}, ${active ?? true})
    RETURNING *`;
  res.status(201).json(banner);
});

router.put('/banners/:id', adminAuth, async (req, res) => {
  const { title, image_url, link, active } = req.body;
  const [banner] = await sql`
    UPDATE banners SET title=${title}, image_url=${image_url}, link=${link || null}, active=${active}
    WHERE id=${req.params.id} RETURNING *`;
  res.json(banner);
});

router.delete('/banners/:id', adminAuth, async (req, res) => {
  await sql`DELETE FROM banners WHERE id=${req.params.id}`;
  res.json({ message: 'Deleted' });
});

// Products
router.get('/products', adminAuth, async (req, res) => {
  const products = await sql`SELECT * FROM products ORDER BY created_at DESC`;
  res.json(products);
});

router.get('/products/:id', adminAuth, async (req, res) => {
  const [product] = await sql`SELECT * FROM products WHERE id=${req.params.id}`;
  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json(product);
});

router.post('/products', adminAuth, async (req, res) => {
  const { name, description, price, original_price, category, stock, active, sizes, colors, color_images, features } = req.body;

  if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
  if (!price || isNaN(price) || Number(price) <= 0) return res.status(400).json({ message: 'Price must be a positive number' });

  try {
    const firstColor = colors?.[0];
    const image_url = firstColor ? color_images?.[firstColor]?.image1 || null : null;
    const [product] = await sql`
      INSERT INTO products (name, description, price, original_price, image_url, category, stock, active, sizes, colors, color_images, features)
      VALUES (${name.trim()}, ${description || null}, ${price}, ${original_price || null}, ${image_url},
              ${category || null}, ${stock ?? 0}, ${active ?? true},
              ${JSON.stringify(sizes || [])}, ${JSON.stringify(colors || [])},
              ${JSON.stringify(color_images || {})}, ${JSON.stringify(features || [])})
      RETURNING *`;
    res.status(201).json(product);
  } catch (err) {
    console.error('Create product error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.put('/products/:id', adminAuth, async (req, res) => {
  const { name, description, price, original_price, category, stock, active, sizes, colors, color_images, features } = req.body;

  if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
  if (!price || isNaN(price) || Number(price) <= 0) return res.status(400).json({ message: 'Price must be a positive number' });

  try {
    const firstColor = colors?.[0];
    const image_url = firstColor ? color_images?.[firstColor]?.image1 || null : null;
    const [product] = await sql`
      UPDATE products SET
        name=${name.trim()}, description=${description || null}, price=${price}, original_price=${original_price || null},
        image_url=${image_url}, category=${category}, stock=${stock ?? 0}, active=${active ?? true},
        sizes=${JSON.stringify(sizes || [])}, colors=${JSON.stringify(colors || [])},
        color_images=${JSON.stringify(color_images || {})}, features=${JSON.stringify(features || [])}
      WHERE id=${req.params.id} RETURNING *`;
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/products/:id', adminAuth, async (req, res) => {
  await sql`DELETE FROM products WHERE id=${req.params.id}`;
  res.json({ message: 'Deleted' });
});

// Users
router.get('/users', adminAuth, async (req, res) => {
  const users = await sql`SELECT id, first_name, last_name, email, is_admin, created_at FROM users ORDER BY created_at DESC`;
  res.json(users);
});

router.put('/users/:id', adminAuth, async (req, res) => {
  const { is_admin } = req.body;
  const [user] = await sql`UPDATE users SET is_admin=${is_admin} WHERE id=${req.params.id} RETURNING id, first_name, last_name, email, is_admin`;
  res.json(user);
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  await sql`DELETE FROM users WHERE id=${req.params.id}`;
  res.json({ message: 'Deleted' });
});

module.exports = router;
