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
  removeProductInCart,
  setProductsQuantity,
  removeOneContentList,
  updateContentNames,
  updateShipping,
  // removeProductInCartTemp,
  // readTemp,
  // setProductsQuantityTemp,
  // combineSessionAndAuth,
} = require("../controllers/cart");

const { upsertAddressFromShipping } = require("../controllers/address");

router.post("/cart/add/:productId/:userId", requireSignin, isAuth, add);
// router.post("/cart/add/:productId", addTemp);

router.post(
  "/cart/remove/:cartItemId/:userId",
  requireSignin,
  isAuth,
  removeProductInCart
);

router.post(
  "/cart/remove-content/:userId",
  requireSignin,
  isAuth,
  removeOneContentList
);
router.post(
  "/cart/update-names/:userId",
  requireSignin,
  isAuth,
  updateContentNames
);
router.post(
  "/cart/update-shipping/:userId",
  requireSignin,
  isAuth,
  upsertAddressFromShipping,
  updateShipping
);

// router.post("/cart/remove/:cartItemId/", removeProductInCartTemp);

router.get("/cart/:userId", requireSignin, isAuth, read);
router.get("/cart/lite/:userId", requireSignin, isAuth, readLite);

// router.post("/cart/", readTemp);

router.post(
  "/cart/updatequantities/:userId",
  requireSignin,
  isAuth,
  setProductsQuantity
);

// router.put("/cart/complete/:userId", requireSignin, isAuth, completeCart);
// router.put("/cart/updatequantities", setProductsQuantityTemp);

// router.put(
//   "/cart/combinesessionauth/:userId",
//   requireSignin,
//   isAuth,
//   combineSessionAndAuth
// );

// paramètre dans la route

router.param("productId", productById);
router.param("userId", userById);
module.exports = router;
