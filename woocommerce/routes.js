const express = require("express");
const router = express.Router();
const { requireSignin, isAdmin, isAuth } = require("../controllers/auth");
const { userById } = require("../controllers/user");
const { synchronize } = require("./controller");

// pour creer une catégorie il faut que l'utilisateur soit connecté et soit admin

router.post(
  "/products/synchronize/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  synchronize
);

// paramètre dans la route
router.param("userId", userById);
module.exports = router;
