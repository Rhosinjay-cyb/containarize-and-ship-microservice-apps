const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 8080;

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:3001";

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://localhost:3002";

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "api-gateway"
  });
});

app.get("/products", async (req, res) => {
  try {
    const response = await axios.get(
      `${PRODUCT_SERVICE_URL}/products`
    );

    res.json(response.data);
  } catch (error) {
    res.status(502).json({
      error: "Product service unavailable"
    });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `${PRODUCT_SERVICE_URL}/products/${req.params.id}`
    );

    res.json(response.data);
  } catch (error) {
    res.status(502).json({
      error: "Product service unavailable"
    });
  }
});

app.get("/orders", async (req, res) => {
  try {
    const response = await axios.get(
      `${ORDER_SERVICE_URL}/orders`
    );

    res.json(response.data);
  } catch (error) {
    res.status(502).json({
      error: "Order service unavailable"
    });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const response = await axios.post(
      `${ORDER_SERVICE_URL}/orders`,
      req.body
    );

    res.status(201).json(response.data);
  } catch (error) {
    res.status(502).json({
      error: "Order service unavailable"
    });
  }
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
