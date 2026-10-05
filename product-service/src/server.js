const express = require("express");
const { Pool } = require("pg");
const { createClient } = require("redis");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3001;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on("error", (error) => {
  console.error("Redis error:", error);
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      stock INTEGER NOT NULL
    )
  `);

  const result = await pool.query(
    "SELECT COUNT(*) FROM products"
  );

  if (Number(result.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO products (name, price, stock)
      VALUES
        ('Laptop', 999.99, 10),
        ('Keyboard', 49.99, 25),
        ('Mouse', 29.99, 40)
    `);
  }
}

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "healthy",
      service: "product-service"
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      service: "product-service"
    });
  }
});

app.get("/products", async (req, res) => {
  try {
    const cachedProducts = await redisClient.get("products");

    if (cachedProducts) {
      console.log("Returning products from Redis cache");
      return res.json(JSON.parse(cachedProducts));
    }

    const result = await pool.query(
      "SELECT * FROM products ORDER BY id"
    );

    await redisClient.setEx(
      "products",
      60,
      JSON.stringify(result.rows)
    );

    console.log("Returning products from PostgreSQL");

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to retrieve products"
    });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to retrieve product"
    });
  }
});

async function startServer() {
  await initializeDatabase();

  await redisClient.connect();

  app.listen(PORT, () => {
    console.log(`Product service running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start product service:", error);
  process.exit(1);
});
