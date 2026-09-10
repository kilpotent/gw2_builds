const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// Όλα τα routes εδώ μέσα χρειάζονται login
router.use(requireAuth);

// GET /api/characters -> όλοι οι χαρακτήρες ΤΟΥ συνδεδεμένου χρήστη
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, profession, created_at FROM characters WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.userId],
    );
    res.json({ characters: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Κάτι πήγε στραβά" });
  }
});

// POST /api/characters -> δημιουργία νέου χαρακτήρα
router.post("/", async (req, res) => {
  try {
    const { name, profession } = req.body;

    if (!name || !profession) {
      return res.status(400).json({ error: "Λείπει name ή profession" });
    }

    const result = await pool.query(
      `INSERT INTO characters (user_id, name, profession) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, profession, created_at`,
      [req.user.userId, name, profession],
    );

    res.status(201).json({ character: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Κάτι πήγε στραβά" });
  }
});

// DELETE /api/characters/:id -> διαγραφή χαρακτήρα (μόνο του δικού σου!)
router.delete("/:id", async (req, res) => {
  try {
    const characterId = req.params.id;

    const result = await pool.query(
      "DELETE FROM characters WHERE id = $1 AND user_id = $2 RETURNING id",
      [characterId, req.user.userId],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Ο χαρακτήρας δεν βρέθηκε ή δεν σου ανήκει" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Κάτι πήγε στραβά" });
  }
});

module.exports = router;
