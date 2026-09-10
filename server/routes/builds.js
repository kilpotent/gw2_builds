const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// GET /api/builds/public -> ΟΛΑ τα public builds, ΧΩΡΙΣ login (π.χ. σελίδα σαν metabattle)
router.get("/public", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT builds.id, builds.build_name, builds.game_mode, builds.data, builds.created_at,
              characters.name AS character_name, characters.profession
       FROM builds
       JOIN characters ON builds.character_id = characters.id
       WHERE builds.is_public = true
       ORDER BY builds.created_at DESC`,
    );
    res.json({ builds: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Κάτι πήγε στραβά" });
  }
});

// Από εδώ και κάτω, ΟΛΑ χρειάζονται login
router.use(requireAuth);

// GET /api/builds/character/:characterId -> τα builds ενός χαρακτήρα (μόνο του ιδιοκτήτη)
router.get("/character/:characterId", async (req, res) => {
  try {
    const { characterId } = req.params;

    // Πρώτα επιβεβαιώνουμε ότι ο χαρακτήρας ανήκει στον συνδεδεμένο χρήστη
    const charCheck = await pool.query(
      "SELECT id FROM characters WHERE id = $1 AND user_id = $2",
      [characterId, req.user.userId],
    );

    if (charCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Ο χαρακτήρας δεν βρέθηκε ή δεν σου ανήκει" });
    }

    const result = await pool.query(
      "SELECT * FROM builds WHERE character_id = $1 ORDER BY created_at DESC",
      [characterId],
    );

    res.json({ builds: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Κάτι πήγε στραβά" });
  }
});

// POST /api/builds -> δημιουργία νέου build
router.post("/", async (req, res) => {
  try {
    const { characterId, buildName, gameMode, data, isPublic } = req.body;

    if (!characterId || !buildName || !data) {
      return res.status(400).json({ error: "Λείπουν στοιχεία" });
    }

    // Επιβεβαίωση ιδιοκτησίας του character (κρίσιμο! αλλιώς κάποιος θα μπορούσε
    // να προσθέσει build σε ΑΛΛΟΥ χαρακτήρα απλά αλλάζοντας το characterId στο body)
    const charCheck = await pool.query(
      "SELECT id FROM characters WHERE id = $1 AND user_id = $2",
      [characterId, req.user.userId],
    );

    if (charCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Δεν έχεις δικαίωμα σε αυτόν τον χαρακτήρα" });
    }

    const result = await pool.query(
      `INSERT INTO builds (character_id, build_name, game_mode, data, is_public)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        characterId,
        buildName,
        gameMode || null,
        JSON.stringify(data),
        isPublic || false,
      ],
    );

    res.status(201).json({ build: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Κάτι πήγε στραβά" });
  }
});

// PUT /api/builds/:id -> ενημέρωση build (ΜΟΝΟ ο δημιουργός)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { buildName, gameMode, data, isPublic } = req.body;

    // Βρίσκουμε το build ΚΑΙ σε ποιον user ανήκει, μέσω του character του
    const ownerCheck = await pool.query(
      `SELECT builds.id, characters.user_id
       FROM builds
       JOIN characters ON builds.character_id = characters.id
       WHERE builds.id = $1`,
      [id],
    );

    const build = ownerCheck.rows[0];

    if (!build) {
      return res.status(404).json({ error: "Build δεν βρέθηκε" });
    }

    if (build.user_id !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Δεν έχεις δικαίωμα να το επεξεργαστείς" });
    }

    const result = await pool.query(
      `UPDATE builds 
       SET build_name = $1, game_mode = $2, data = $3, is_public = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        buildName,
        gameMode || null,
        JSON.stringify(data),
        isPublic || false,
        id,
      ],
    );

    res.json({ build: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Κάτι πήγε στραβά" });
  }
});

// DELETE /api/builds/:id -> διαγραφή (ΜΟΝΟ ο δημιουργός)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM builds 
       WHERE id = $1 
       AND character_id IN (SELECT id FROM characters WHERE user_id = $2)
       RETURNING id`,
      [id, req.user.userId],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Build δεν βρέθηκε ή δεν σου ανήκει" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Κάτι πήγε στραβά" });
  }
});

module.exports = router;
