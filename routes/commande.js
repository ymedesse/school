const express = require("express");
const router = express.Router();

const { byId: productById } = require("../controllers/product");
const { userById } = require("../controllers/user");
const { requireSignin, isAuth } = require("../controllers/auth");
const {
  add,
  // addTemp,
  read,
  readLite,
  removeProductInCommande,
  setProductsQuantity,
  removeOneContentList,
  updateContentNames,
  updateShipping,
} = require("../controllers/commande");

const { upsertAddressFromShipping } = require("../controllers/address");

router.post("/commande/add/:productId/:userId", requireSignin, isAuth, add);

router.post(
  "/commande/remove/:commandeItemId/:userId",
  requireSignin,
  isAuth,
  removeProductInCommande
);

router.post(
  "/commande/remove-content/:userId",
  requireSignin,
  isAuth,
  removeOneContentList
);
router.post(
  "/commande/update-names/:userId",
  requireSignin,
  isAuth,
  updateContentNames
);
router.post(
  "/commande/update-shipping/:userId",
  requireSignin,
  isAuth,
  upsertAddressFromShipping,
  updateShipping
);

router.get("/commande/:userId", requireSignin, isAuth, read);
router.get("/commande/lite/:userId", requireSignin, isAuth, readLite);

router.post(
  "/commande/updatequantities/:userId",
  requireSignin,
  isAuth,
  setProductsQuantity
);

router.param("productId", productById);
router.param("userId", userById);

module.exports = router;
