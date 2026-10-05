const express = require("express");
const { Pool } = require("pg");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3002;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      status VARCHAR(50) NOT NULL
    )
  `);
}

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "healthy",
      service: "order-service"
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      service: "order-service"
    });
  }
});

app.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders ORDER BY id"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to retrieve orders"
    });
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Order not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to retrieve order"
    });
  }
});

app.post("/orders", async (req, res) => {
  const { customerId, productId, quantity } = req.body;

  if (!customerId || !productId || !quantity) {
    return res.status(400).json({
      error: "customerId, productId and quantity are required"
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO orders
        (customer_id, product_id, quantity, status)
      VALUES
        ($1, $2, $3, $4)
      RETURNING *
      `,
      [customerId, productId, quantity, "pending"]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to create order"
    });
  }
});

async function startServer() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`Order service running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start order service:", error);
  process.exit(1);
});
