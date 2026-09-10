const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Έλεγχος ότι όλα τα πεδία στάλθηκαν
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Λείπουν στοιχεία (username, email, password)" });
    }

    // 2. Έλεγχος αν υπάρχει ήδη χρήστης με το ίδιο username/email
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email],
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "Το username ή το email χρησιμοποιείται ήδη" });
    }

    // 3. Κρυπτογράφηση του password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Αποθήκευση του νέου χρήστη στη βάση
    const newUser = await pool.query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash],
    );

    // 5. Επιστροφή απάντησης (ΧΩΡΙΣ το password_hash!)
    res.status(201).json({ user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Κάτι πήγε στραβά κατά την εγγραφή" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Λείπουν στοιχεία (username, password)" });
    }

    // 1. Βρίσκουμε τον χρήστη
    const result = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE username = $1",
      [username],
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Λάθος στοιχεία σύνδεσης" });
    }

    // 2. Σύγκριση password με το αποθηκευμένο hash
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Λάθος στοιχεία σύνδεσης" });
    }

    // 3. Δημιουργία JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // 4. Επιστροφή token + βασικά στοιχεία χρήστη
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Κάτι πήγε στραβά κατά τη σύνδεση" });
  }
});
module.exports = router;
