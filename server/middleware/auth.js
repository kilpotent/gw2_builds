const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  // 1. Παίρνουμε το token από τα headers
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res
      .status(401)
      .json({ error: "Δεν υπάρχει token, μη εξουσιοδοτημένη πρόσβαση" });
  }

  // Το header έχει τη μορφή: "Bearer eyJhbGci..."
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Λάθος μορφή token" });
  }

  // 2. Επαλήθευση του token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // π.χ. { userId: 5, username: 'testuser' }
    next(); // 👈 όλα καλά, προχώρα στο επόμενο βήμα (το πραγματικό route)
  } catch (err) {
    return res.status(401).json({ error: "Μη έγκυρο ή ληγμένο token" });
  }
}

module.exports = requireAuth;
