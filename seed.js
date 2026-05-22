require('dotenv').config();
const sql = require('./db');

const seedProducts = [
  // T-Shirts
  {
    name: 'Premium Heavyweight Boxy Tee',
    description: 'An oversized fit t-shirt crafted from 240 GSM heavy cotton. Highlights drop-shoulder silhouettes and tight mock neck stitching.',
    price: 1499.00,
    original_price: 1999.00,
    category: 'tshirts',
    stock: 120,
    active: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Vintage Black', 'Desert Sand'],
    color_images: {
      'Vintage Black': {
        image1: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=75'
      },
      'Desert Sand': {
        image1: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=75'
      }
    },
    features: ['240 GSM organic cotton', 'Thick 1.2-inch ribbed collar', 'Relaxed boxy silhouette', 'Pre-shrunk fabric']
  },
  {
    name: 'Vintage Slate Oversized Tee',
    description: 'Garment-dyed heavyweight cotton tee, washed for a unique vintage shade and extremely soft luxury hand-feel.',
    price: 1599.00,
    original_price: 2199.00,
    category: 'tshirts',
    stock: 85,
    active: true,
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Slate Grey', 'Olive Green'],
    color_images: {
      'Slate Grey': {
        image1: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=75'
      },
      'Olive Green': {
        image1: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=75'
      }
    },
    features: ['100% Ring-spun cotton', 'Vintage mineral wash', 'Drop shoulder cut', 'Reinforced shoulder-to-shoulder taping']
  },

  // Shirts
  {
    name: 'Sage Green Resort Linen Shirt',
    description: 'Ultralight, breathable French linen shirt featuring a relaxed camp collar and elegant pearl button details. Ideal for resort layering.',
    price: 2499.00,
    original_price: 3499.00,
    category: 'shirts',
    stock: 90,
    active: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Sage Green', 'Off-White'],
    color_images: {
      'Sage Green': {
        image1: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=600&q=75'
      },
      'Off-White': {
        image1: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=75'
      }
    },
    features: ['100% Premium French linen', 'Relaxed camp collar', 'Breathable and sweat-wicking structure', 'Genuine mother-of-pearl buttons']
  },

  // Track Pants
  {
    name: 'Slate Heavy Fleece Jogger',
    description: 'Premium heavyweight fleece jogger styled with elastic waistband, custom thick cotton drawstrings, and side zipper pockets.',
    price: 2299.00,
    original_price: 2999.00,
    category: 'track pants',
    stock: 75,
    active: true,
    sizes: ['M', 'L', 'XL'],
    colors: ['Slate Grey', 'Jet Black'],
    color_images: {
      'Slate Grey': {
        image1: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=600&q=75'
      },
      'Jet Black': {
        image1: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=75'
      }
    },
    features: ['380 GSM ultra-heavy fleece', 'Hidden zipper side pockets', 'Signature thick flat drawstrings', 'Ribbed elastic ankle cuffs']
  },

  // Pants
  {
    name: 'Tailored Sand Cotton Chino',
    description: 'Structured premium cotton twill trousers designed with flat-front styling and a slight taper towards the ankle for a clean silhouette.',
    price: 3299.00,
    original_price: 4299.00,
    category: 'pants',
    stock: 60,
    active: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Sand Chino', 'Charcoal Chino'],
    color_images: {
      'Sand Chino': {
        image1: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=75'
      },
      'Charcoal Chino': {
        image1: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=75'
      }
    },
    features: ['Heavyweight cotton twill', 'Tailored slim-tapered fit', 'Dual double-welt back pockets', 'Premium YKK metal zip-fly']
  },

  // Sweatshirts
  {
    name: 'Heavyweight Oversized Crewneck',
    description: 'Extremely plush, thick french terry crewneck sweatshirt designed with a draped boxy silhouette and micro-ribbed finishes.',
    price: 2699.00,
    original_price: 3499.00,
    category: 'sweatshirts',
    stock: 55,
    active: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Vintage Grey', 'Forest Green'],
    color_images: {
      'Vintage Grey': {
        image1: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=600&q=75'
      },
      'Forest Green': {
        image1: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=600&q=75'
      }
    },
    features: ['420 GSM ultra-dense French Terry', 'Tight double-needle coverstitched seams', 'Relaxed dropped shoulders', 'Ribbed side gussets']
  },

  // Hoodies
  {
    name: 'Signature Heavyweight Hoodie',
    description: 'Double-lined hood with a heavy crossover neckline. Made from a dense cotton fleece blend that holds its boxy shape perfectly.',
    price: 3299.00,
    original_price: 4499.00,
    category: 'hoodies',
    stock: 65,
    active: true,
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Slate', 'Off-White'],
    color_images: {
      'Slate': {
        image1: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=75'
      },
      'Off-White': {
        image1: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=75',
        image2: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=75',
        image3: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=600&q=75'
      }
    },
    features: ['450 GSM organic cotton-polyester blend', 'Double-layered structured hood', 'No drawstrings for a clean, minimal look', 'Spandex-reinforced cuffs and hem']
  }
];

async function runSeed() {
  try {
    console.log('Resetting products database table...');
    // Delete existing products
    await sql`DELETE FROM products`;
    console.log('Cleared existing product records.');

    for (const p of seedProducts) {
      console.log(`Inserting: ${p.name}...`);
      const firstColor = p.colors[0];
      const image_url = firstColor ? p.color_images[firstColor].image1 : null;

      await sql`
        INSERT INTO products (
          name, description, price, original_price, image_url, category, stock, active, sizes, colors, color_images, features
        ) VALUES (
          ${p.name}, ${p.description}, ${p.price}, ${p.original_price}, ${image_url}, ${p.category}, ${p.stock}, ${p.active},
          ${JSON.stringify(p.sizes)}, ${JSON.stringify(p.colors)}, ${JSON.stringify(p.color_images)}, ${JSON.stringify(p.features)}
        )
      `;
    }

    console.log('Database successfully seeded with optimized premium Lovito products!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
}

runSeed();
