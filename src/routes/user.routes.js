const express = require("express");
const userController = require("../controllers/user.controller");

const router = express.Router();

// POST /api/users/register
router.post("/register", userController.register);

// POST /api/users/login
router.post("/login", userController.login);

// PUT /api/users/:userId
router.put("/:userId", userController.updateUser);

module.exports = router;
