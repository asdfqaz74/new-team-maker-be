const express = require("express");
const router = express.Router();
const userRoutes = require("./user.routes");

// Example route
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date(),
  });
});

router.use("/users", userRoutes);

module.exports = router;
