const express = require("express");
const router = express.Router();
const { requireSignin, isAdmin, isAuth } = require("../controllers/auth");
const { userById } = require("../controllers/user");
const { sendTestEmail } = require("./controller");

// pour creer une catégorie il faut que l'utilisateur soit connecté et soit admin

router.post(
  "/email/test/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  sendTestEmail
);

// paramètre dans la route
router.param("userId", userById);
module.exports = router;
