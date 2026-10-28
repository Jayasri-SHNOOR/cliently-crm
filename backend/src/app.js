const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    message: "CRM backend is running",
  });
});

// Module routes get mounted here in the next step

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CRM backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Startup failed:", err.message);
    process.exit(1);
  });