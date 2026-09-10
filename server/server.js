require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const authRoutes = require("./routes/auth");
const characterRoutes = require("./routes/characters");
const buildRoutes = require("./routes/builds");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/builds", buildRoutes);

app.get("/api/health", (req, res) => {
  res.json({ message: "Ο server δουλεύει!" });
});

// 👇 νέο route, μόνο για test
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ dbTime: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
