const express = require("express");
const router = express.Router();
const { userById } = require("../controllers/user");

const { requireSignin, /* isAdmin, */ isAuth } = require("../controllers/auth");

const {
  read,
  orderById,
  listSearch,
  pricesRangesBySearch,
  listPartialSearch,
  getStatusValues,
  getLocalStatusValues,
  updateLocalStatus,
  update,
} = require("../controllers/wooOrder");

router.get("/woo-orders/search/:userId", requireSignin, isAuth, listSearch);
router.put("/woo-order/:wooOrderId/:userId", requireSignin, isAuth, update);

router.get(
  "/woo-orders/partial-search/:userId",
  requireSignin,
  isAuth,
  listPartialSearch
);
router.get(
  "/woo-orders/prices-ranges/:userId",
  requireSignin,
  isAuth,
  pricesRangesBySearch
);
router.get(
  "/woo-orders/status/:userId",
  requireSignin,
  isAuth,
  getStatusValues
);
router.get(
  "/woo-orders/local-status/:userId",
  requireSignin,
  isAuth,
  getLocalStatusValues
);
router.post(
  "/woo-order/status/:wooOrderId/:userId",
  requireSignin,
  isAuth,
  updateLocalStatus
);

router.get("/woo-order/:wooOrderId/:userId", requireSignin, isAuth, read);

router.param("wooOrderId", orderById);
router.param("userId", userById);
module.exports = router;
