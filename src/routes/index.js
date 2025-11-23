const express = require("express");
const router = express.Router();

// Example route
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date(),
  });
});

module.exports = router;
