import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase, getPool } from "./db.js";
import { getFeaturedVideo, getLatestVideos, getProductVideos } from "./youtube.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[Backend] ${req.method} ${req.url}`);
  next();
});

// --- YOUTUBE PUBLIC ENDPOINTS ---

app.get("/api/youtube/featured", async (req, res) => {
  try {
    const pool = getPool();
    // Prioritize DB-configured featured video
    const [rows] = await pool.query(
      "SELECT * FROM youtube_videos WHERE section = 'featured' ORDER BY id DESC LIMIT 1"
    );
    if (rows.length > 0) {
      const v = rows[0];
      return res.json({
        id: v.video_id,
        title: v.title,
        description: v.description,
        thumbnail: v.thumbnail,
        channelTitle: v.channel_title,
        publishedAt: v.created_at,
      });
    }
    // Fallback to YouTube API / mock
    const video = await getFeaturedVideo();
    res.json(video);
  } catch (error) {
    console.error("Error in /api/youtube/featured:", error);
    res.status(500).json({ error: "Failed to fetch featured video" });
  }
});

app.get("/api/youtube/latest", async (req, res) => {
  try {
    const pool = getPool();
    // Prioritize DB-configured latest videos
    const [rows] = await pool.query(
      "SELECT * FROM youtube_videos WHERE section = 'latest' ORDER BY id DESC LIMIT 6"
    );
    if (rows.length > 0) {
      return res.json(rows.map((v) => ({
        id: v.video_id,
        title: v.title,
        description: v.description,
        thumbnail: v.thumbnail,
        channelTitle: v.channel_title,
        publishedAt: v.created_at,
      })));
    }
    // Fallback to YouTube API / mock
    const videos = await getLatestVideos();
    res.json(videos);
  } catch (error) {
    console.error("Error in /api/youtube/latest:", error);
    res.status(500).json({ error: "Failed to fetch latest videos" });
  }
});

app.get("/api/youtube/product", async (req, res) => {
  try {
    const productId = req.query.id || null;
    const productName = req.query.name || "";
    const pool = getPool();

    // Prioritize DB-configured product videos (by product_id first, then fallback)
    if (productId) {
      const [rows] = await pool.query(
        "SELECT * FROM youtube_videos WHERE section = 'product' AND product_id = ? ORDER BY id DESC",
        [productId]
      );
      if (rows.length > 0) {
        return res.json(rows.map((v) => ({
          id: v.video_id,
          title: v.title,
          description: v.description,
          thumbnail: v.thumbnail,
          channelTitle: v.channel_title,
          publishedAt: v.created_at,
        })));
      }
    }

    // Fallback to YouTube API / mock
    const videos = await getProductVideos(productName);
    res.json(videos);
  } catch (error) {
    console.error("Error in /api/youtube/product:", error);
    res.status(500).json({ error: "Failed to fetch product videos" });
  }
});

// --- YOUTUBE ADMIN MANAGEMENT ENDPOINTS ---

// GET all managed videos
app.get("/api/youtube/manage", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM youtube_videos ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching managed videos:", error);
    res.status(500).json({ error: "Database error fetching managed videos" });
  }
});

// POST add a new managed video
app.post("/api/youtube/manage", async (req, res) => {
  try {
    const { video_id, title, description, channel_title, thumbnail, section, product_id } = req.body;
    if (!video_id || !title || !section) {
      return res.status(400).json({ error: "video_id, title, and section are required" });
    }
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO youtube_videos (video_id, title, description, channel_title, thumbnail, section, product_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [video_id, title, description || "", channel_title || "", thumbnail || "", section, product_id || null]
    );
    const [newRows] = await pool.query("SELECT * FROM youtube_videos WHERE id = ?", [result.insertId]);
    res.status(201).json(newRows[0]);
  } catch (error) {
    console.error("Error adding managed video:", error);
    res.status(500).json({ error: "Database error adding video" });
  }
});

// PUT update a managed video
app.put("/api/youtube/manage/:id", async (req, res) => {
  try {
    const { video_id, title, description, channel_title, thumbnail, section, product_id } = req.body;
    const pool = getPool();
    await pool.query(
      `UPDATE youtube_videos SET video_id=?, title=?, description=?, channel_title=?, thumbnail=?, section=?, product_id=?
       WHERE id=?`,
      [video_id, title, description, channel_title, thumbnail, section, product_id || null, req.params.id]
    );
    const [rows] = await pool.query("SELECT * FROM youtube_videos WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Video not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Error updating managed video:", error);
    res.status(500).json({ error: "Database error updating video" });
  }
});

// DELETE a managed video
app.delete("/api/youtube/manage/:id", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT id FROM youtube_videos WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Video not found" });
    await pool.query("DELETE FROM youtube_videos WHERE id = ?", [req.params.id]);
    res.json({ success: true, id: parseInt(req.params.id) });
  } catch (error) {
    console.error("Error deleting managed video:", error);
    res.status(500).json({ error: "Database error deleting video" });
  }
});

// --- YOUTUBE FETCH DETAILS (Admin helper to auto-fill metadata) ---
app.get("/api/youtube/details", async (req, res) => {
  try {
    const videoId = req.query.videoId;
    if (!videoId) return res.status(400).json({ error: "videoId is required" });

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (YOUTUBE_API_KEY) {
      const { default: axios } = await import("axios");
      const ytRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: { part: "snippet", id: videoId, key: YOUTUBE_API_KEY },
      });
      const item = ytRes.data.items?.[0];
      if (item) {
        return res.json({
          video_id: videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          channel_title: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
        });
      }
    }
    // Fallback: return minimal object so admin can fill in manually
    res.json({
      video_id: videoId,
      title: "",
      description: "",
      channel_title: "",
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    });
  } catch (error) {
    console.error("Error fetching YouTube details:", error);
    res.status(500).json({ error: "Failed to fetch YouTube video details" });
  }
});


// --- PRODUCTS ENDPOINTS ---
app.get("/products", async (req, res) => {
  try {
    const pool = getPool();
    const [products] = await pool.query("SELECT * FROM products");
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Database error fetching products" });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const pool = getPool();
    const [products] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (products.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(products[0]);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Database error fetching product" });
  }
});


// --- USERS ENDPOINTS ---
app.get("/users", async (req, res) => {
  try {
    const pool = getPool();
    const [users] = await pool.query("SELECT id, name, lastname, email, password, role FROM users");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Database error fetching users" });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { name, lastname, email, password } = req.body;
    if (!name || !lastname || !email || !password) {
      return res.status(400).json({ error: "Missing required user fields" });
    }

    const pool = getPool();
    
    // Check if email already exists
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const [result] = await pool.query(
      "INSERT INTO users (name, lastname, email, password, role) VALUES (?, ?, ?, ?, 'user')",
      [name, lastname, email, password]
    );

    const newUser = { id: result.insertId, name, lastname, email, password, role: "user" };
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Database error registering user" });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const pool = getPool();
    const [users] = await pool.query("SELECT id, name, lastname, email, role FROM users WHERE id = ?", [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(users[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Database error fetching user profile" });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const { name, lastname, email, password } = req.body;
    const userId = req.params.id;
    const pool = getPool();

    if (password) {
      await pool.query(
        "UPDATE users SET name = ?, lastname = ?, email = ?, password = ? WHERE id = ?",
        [name, lastname, email, password, userId]
      );
    } else {
      await pool.query(
        "UPDATE users SET name = ?, lastname = ?, email = ? WHERE id = ?",
        [name, lastname, email, userId]
      );
    }

    res.json({ id: parseInt(userId), name, lastname, email });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Database error updating user profile" });
  }
});


// --- ORDERS ENDPOINTS ---
app.post("/orders", async (req, res) => {
  try {
    const { data, products, subtotal, user, orderStatus = "Processing", orderDate } = req.body;

    if (!data || !products || !Array.isArray(products) || subtotal === undefined) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    const pool = getPool();

    // Insert order into orders table
    const [orderResult] = await pool.query(
      `INSERT INTO orders (
        orderStatus, orderDate, subtotal, user_id, user_email,
        emailAddress, firstName, lastName, company, address,
        apartment, city, country, region, postalCode, phone,
        paymentType, cardNumber, nameOnCard, expirationDate, cvc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderStatus,
        orderDate || new Date().toISOString(),
        subtotal,
        user ? user.id : null,
        user ? user.email : null,
        data.emailAddress,
        data.firstName,
        data.lastName,
        data.company || null,
        data.address,
        data.apartment || null,
        data.city,
        data.country,
        data.region || null,
        data.postalCode,
        data.phone,
        data.paymentType,
        data.cardNumber || null,
        data.nameOnCard || null,
        data.expirationDate || null,
        data.cvc || null,
      ]
    );

    const orderId = orderResult.insertId;

    // Insert each order item
    for (const item of products) {
      let productId = item.id;
      
      const [prodRows] = await pool.query("SELECT id FROM products WHERE title = ?", [item.title]);
      if (prodRows.length > 0) {
        productId = prodRows[0].id;
      }

      await pool.query(
        `INSERT INTO order_items (
          order_id, product_id, image, title, category, price, quantity, size, color
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          productId,
          item.image,
          item.title,
          item.category,
          item.price,
          item.quantity,
          item.size,
          item.color,
        ]
      );

      // Decrement product stock
      await pool.query(
        "UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?",
        [item.quantity, productId]
      );
    }

    const createdOrder = {
      id: orderId,
      orderStatus,
      orderDate,
      subtotal,
      data,
      products,
      user: user || null,
    };

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Database error creating order" });
  }
});

app.get("/orders", async (req, res) => {
  try {
    const pool = getPool();
    const [orders] = await pool.query("SELECT * FROM orders ORDER BY id DESC");
    
    const formattedOrders = [];
    for (const order of orders) {
      const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
      
      formattedOrders.push({
        id: order.id,
        orderStatus: order.orderStatus,
        orderDate: order.orderDate,
        subtotal: order.subtotal,
        data: {
          emailAddress: order.emailAddress,
          firstName: order.firstName,
          lastName: order.lastName,
          company: order.company,
          address: order.address,
          apartment: order.apartment,
          city: order.city,
          country: order.country,
          region: order.region,
          postalCode: order.postalCode,
          phone: order.phone,
          paymentType: order.paymentType,
          cardNumber: order.cardNumber,
          nameOnCard: order.nameOnCard,
          expirationDate: order.expirationDate,
          cvc: order.cvc,
        },
        products: items.map(item => ({
          id: item.product_id + item.size + item.color,
          image: item.image,
          title: item.title,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        user: order.user_id ? {
          id: order.user_id,
          email: order.user_email,
        } : null,
      });
    }

    res.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Database error fetching orders" });
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const pool = getPool();
    const [orders] = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    const order = orders[0];
    const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
    
    const formattedOrder = {
      id: order.id,
      orderStatus: order.orderStatus,
      orderDate: order.orderDate,
      subtotal: order.subtotal,
      data: {
        emailAddress: order.emailAddress,
        firstName: order.firstName,
        lastName: order.lastName,
        company: order.company,
        address: order.address,
        apartment: order.apartment,
        city: order.city,
        country: order.country,
        region: order.region,
        postalCode: order.postalCode,
        phone: order.phone,
        paymentType: order.paymentType,
        cardNumber: order.cardNumber,
        nameOnCard: order.nameOnCard,
        expirationDate: order.expirationDate,
        cvc: order.cvc,
      },
      products: items.map(item => ({
        id: item.product_id + item.size + item.color,
        image: item.image,
        title: item.title,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      })),
      user: order.user_id ? {
        id: order.user_id,
        email: order.user_email,
      } : null,
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Database error fetching order details" });
  }
});


// Start server and initialize database
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`[Backend] Express server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server and initialize database:", error);
    process.exit(1);
  }
}

startServer();
