const express = require("express");
const router = express.Router();

const { addressCreateValidator } = require("../validator");
const { requireSignin, isAdmin, isAuth } = require("../controllers/auth");

const { userById } = require("../controllers/user");
const {
  create,
  read,
  remove,
  update,
  list,
  addressById,
  addressesByUser,
  getLocalAddresses,
} = require("../controllers/address");

// pour creer une catégorie il faut que l'utilisateur soit connecté et soit admin
router.post(
  "/address/create/:userId",
  requireSignin,
  isAuth,
  addressCreateValidator,
  create
);
router.put(
  "/address/:addressId/:userId",
  requireSignin,
  isAuth,
  addressCreateValidator,
  update
);

router.delete("/address/:addressId/:userId", requireSignin, isAuth, remove);

router.get("/address/:addressId", read);
router.get("/local-addresses/", getLocalAddresses);
router.get("/addresses/", requireSignin, isAuth, isAdmin, list);
router.get("/addresses/:userId", requireSignin, isAuth, addressesByUser);

// paramètre dans la route
router.param("userId", userById);
router.param("addressId", addressById);
module.exports = router;
