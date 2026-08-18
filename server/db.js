import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const {
  DB_HOST = "localhost",
  DB_PORT = 3306,
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "bagsdb",
} = process.env;

let pool;

export async function initializeDatabase() {
  console.log("Connecting to MySQL server to verify database...");
  
  // Connect to MySQL server first without selecting a database
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: parseInt(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
  });

  // Create database if not exists
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
  await connection.end();

  console.log(`Database "${DB_NAME}" verified. Establishing pool...`);

  // Establish connection pool to the database
  pool = mysql.createPool({
    host: DB_HOST,
    port: parseInt(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Create tables if they do not exist
  await createTables();
  await seedProducts();
  await seedAdminUser();
  await seedYoutubeVideos();
}

async function createTables() {
  console.log("Checking and creating tables if necessary...");

  // Products Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      image VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price INT NOT NULL,
      popularity INT NOT NULL,
      stock INT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Users Table (with role column)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      lastname VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Add role column if it doesn't exist (for existing installs)
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'`);
    console.log("Added 'role' column to users table.");
  } catch (err) {
    // Column already exists — ignore
  }

  // Orders Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderStatus VARCHAR(50) DEFAULT 'Processing',
      orderDate VARCHAR(100) NOT NULL,
      subtotal INT NOT NULL,
      user_id INT DEFAULT NULL,
      user_email VARCHAR(255) DEFAULT NULL,
      emailAddress VARCHAR(255) NOT NULL,
      firstName VARCHAR(100) NOT NULL,
      lastName VARCHAR(100) NOT NULL,
      company VARCHAR(100),
      address VARCHAR(255) NOT NULL,
      apartment VARCHAR(100),
      city VARCHAR(100) NOT NULL,
      country VARCHAR(100) NOT NULL,
      region VARCHAR(100),
      postalCode VARCHAR(50) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      paymentType VARCHAR(50) NOT NULL,
      cardNumber VARCHAR(50),
      nameOnCard VARCHAR(100),
      expirationDate VARCHAR(50),
      cvc VARCHAR(20)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Order Items Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id VARCHAR(50) NOT NULL,
      image VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price INT NOT NULL,
      quantity INT NOT NULL,
      size VARCHAR(10) NOT NULL,
      color VARCHAR(20) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // YouTube Videos Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS youtube_videos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      video_id VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      channel_title VARCHAR(150),
      thumbnail VARCHAR(500),
      section VARCHAR(50) NOT NULL COMMENT 'featured | latest | product',
      product_id VARCHAR(50) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log("Tables structure verified.");
}

async function seedAdminUser() {
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", ["admin@bagstore.com"]);
  if (existing.length > 0) {
    console.log("Admin user already exists.");
    return;
  }
  console.log("Seeding admin user...");
  await pool.query(
    "INSERT INTO users (name, lastname, email, password, role) VALUES (?, ?, ?, ?, ?)",
    ["Admin", "User", "admin@bagstore.com", "admin123", "admin"]
  );
  console.log("Admin user seeded: admin@bagstore.com / admin123");
}

async function seedYoutubeVideos() {
  const [rows] = await pool.query("SELECT COUNT(*) as count FROM youtube_videos");
  if (rows[0].count > 0) {
    console.log("YouTube videos table already seeded.");
    return;
  }

  console.log("Seeding YouTube videos...");

  const videos = [
    // Featured Hero
    {
      video_id: "LgdJ1x0u74Q",
      title: "The Ultimate Luxury Handbag Guide — Timeless Investment Bags",
      description: "Diving deep into the world of premium leather handbags, classic designer pieces, and functional totes. Find the perfect investment bag that fits your daily style and stands the test of time.",
      channel_title: "Luxe Fashion Guide",
      thumbnail: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800",
      section: "featured",
      product_id: null,
    },
    // Latest Trends — 6 videos
    {
      video_id: "2k9G3lH11xU",
      title: "Top 7 Handbag Trends to Watch This Season",
      description: "From canvas beach totes to mini evening clutches, here are the trending handbag styles taking over the fashion world right now.",
      channel_title: "Vogue Trends",
      thumbnail: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=800",
      section: "latest",
      product_id: null,
    },
    {
      video_id: "m0Qv3hW5hN8",
      title: "What's In My Bag? Everyday Leather Tote Essentials",
      description: "An honest walkthrough of what actually fits in a premium structured leather tote bag. Reviewing wear and tear, pocket utility, and overall storage.",
      channel_title: "Daily Chic",
      thumbnail: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800",
      section: "latest",
      product_id: null,
    },
    {
      video_id: "qgBq1oEw73U",
      title: "How to Clean and Care for Your Luxury Leather Bags",
      description: "Extend the life of your premium handbag with these simple maintenance, storage, and leather conditioning tips.",
      channel_title: "The Bag Care Specialist",
      thumbnail: "https://images.unsplash.com/photo-1598532187856-39597ff4a30e?auto=format&fit=crop&q=80&w=800",
      section: "latest",
      product_id: null,
    },
    {
      video_id: "Gs069dndIYk",
      title: "Crossbody Bags Reviewed: Best Options for Every Budget",
      description: "We compare entry-level to luxury crossbody bags — which one gives you the most value? Honest and unsponsored review.",
      channel_title: "Bag Report",
      thumbnail: "https://images.unsplash.com/photo-1566150905458-1bf1fc15aee9?auto=format&fit=crop&q=80&w=800",
      section: "latest",
      product_id: null,
    },
    {
      video_id: "9U5S_iVn0mY",
      title: "Unboxing a $400 Leather Tote — Worth It?",
      description: "We unbox and review a premium structured leather tote. First impressions, leather quality, hardware finish, and real wear test.",
      channel_title: "The Handbag Reviewer",
      thumbnail: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=800",
      section: "latest",
      product_id: null,
    },
    {
      video_id: "5J2Z4u-LzFw",
      title: "Summer Bag Styling Guide — Beach & Evening Looks",
      description: "How to style straw clutches, canvas totes and woven bags for every summer occasion. Light, chic and effortless.",
      channel_title: "Summer Edit",
      thumbnail: "https://images.unsplash.com/photo-1524498250077-3a9f0c578520?auto=format&fit=crop&q=80&w=800",
      section: "latest",
      product_id: null,
    },
    // Product-specific
    {
      video_id: "9U5S_iVn0mY",
      title: "Aurelia Leather Tote — Full Review & Unboxing",
      description: "Unboxing, leather quality check, and style guide for the Aurelia Leather Tote. Let's see if this structured tote lives up to the premium hype.",
      channel_title: "The Handbag Reviewer",
      thumbnail: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=800",
      section: "product",
      product_id: "1",
    },
    {
      video_id: "5J2Z4u-LzFw",
      title: "Ophelia Crossbody Bag Review — What Fits Inside?",
      description: "A close-up look at the quilted gold-chain crossbody bag. Testing the size with phone, cards, lipstick and everyday carry items.",
      channel_title: "Elegant Carry",
      thumbnail: "https://images.unsplash.com/photo-1566150905458-1bf1fc15aee9?auto=format&fit=crop&q=80&w=800",
      section: "product",
      product_id: "2",
    },
    {
      video_id: "Q2kG3lHx2yU",
      title: "Seraphina Shoulder Bag — Minimalist Wear Test",
      description: "Is the Seraphina Shoulder Bag comfortable for daily wear? Under-arm fit check, leather flexibility, and outfit ideas.",
      channel_title: "Styled By Sarah",
      thumbnail: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800",
      section: "product",
      product_id: "3",
    },
  ];

  for (const v of videos) {
    await pool.query(
      `INSERT INTO youtube_videos (video_id, title, description, channel_title, thumbnail, section, product_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [v.video_id, v.title, v.description, v.channel_title, v.thumbnail, v.section, v.product_id]
    );
  }

  console.log(`Successfully seeded ${videos.length} YouTube videos.`);
}

async function seedProducts() {
  const [rows] = await pool.query("SELECT COUNT(*) as count FROM products");
  if (rows[0].count > 0) {
    console.log("Products table already seeded.");
    return;
  }

  console.log("Seeding products...");
  const sampleProducts = [
    {
      id: "1",
      title: "Aurelia Leather Tote",
      image: "bag_tote.jpg",
      category: "luxury-collection",
      price: 350,
      popularity: 5,
      stock: 12,
    },
    {
      id: "2",
      title: "Ophelia Crossbody Bag",
      image: "bag_crossbody.jpg",
      category: "luxury-collection",
      price: 220,
      popularity: 4,
      stock: 18,
    },
    {
      id: "3",
      title: "Seraphina Shoulder Bag",
      image: "bag_shoulder.jpg",
      category: "luxury-collection",
      price: 280,
      popularity: 5,
      stock: 8,
    },
    {
      id: "4",
      title: "Solaria Straw Clutch",
      image: "bag_straw.jpg",
      category: "summer-edition",
      price: 120,
      popularity: 4,
      stock: 15,
    },
    {
      id: "5",
      title: "Isla Canvas Tote",
      image: "bag_canvas.jpg",
      category: "summer-edition",
      price: 95,
      popularity: 3,
      stock: 25,
    },
    {
      id: "6",
      title: "Nomad Roll-Top Backpack",
      image: "bag_backpack.jpg",
      category: "unique-collection",
      price: 150,
      popularity: 4,
      stock: 10,
    },
    {
      id: "7",
      title: "Vanguard Geometric Sling",
      image: "bag_sling.jpg",
      category: "unique-collection",
      price: 110,
      popularity: 3,
      stock: 14,
    },
    {
      id: "8",
      title: "Stella Sequin Minaudière",
      image: "bag_clutch.jpg",
      category: "special-edition",
      price: 180,
      popularity: 5,
      stock: 6,
    },
    {
      id: "9",
      title: "Regalia Velvet Envelope Bag",
      image: "bag_velvet.jpg",
      category: "special-edition",
      price: 210,
      popularity: 4,
      stock: 9,
    },
    {
      id: "10",
      title: "Classic Daily Satchel",
      image: "bag_satchel.jpg",
      category: "unique-collection",
      price: 175,
      popularity: 5,
      stock: 20,
    },
    {
      id: "11",
      title: "Athena Chain Hobo",
      image: "bag_hobo.jpg",
      category: "luxury-collection",
      price: 320,
      popularity: 4,
      stock: 7,
    },
    {
      id: "12",
      title: "Riviera Beach Pouch",
      image: "bag_pouch.jpg",
      category: "summer-edition",
      price: 85,
      popularity: 3,
      stock: 30,
    },
  ];

  for (const product of sampleProducts) {
    await pool.query(
      `INSERT INTO products (id, title, image, category, price, popularity, stock) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.title,
        product.image,
        product.category,
        product.price,
        product.popularity,
        product.stock,
      ]
    );
  }

  console.log("Successfully seeded 12 products in database.");
}

export function getPool() {
  if (!pool) {
    throw new Error("Pool has not been initialized. Call initializeDatabase first.");
  }
  return pool;
}
