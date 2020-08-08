const express = require("express");
const router = express.Router();
const { userById } = require("../controllers/user");
const { requireSignin, isAdmin, isAuth } = require("../controllers/auth");

const {
  read,
  orderById,
  listSearch,
  pricesRangesBySearch,
  listPartialSearch,
  getStatusValues,
  submitOrder,
  submitInstallmentPayment,
  listInstallPaymentByUser,
  getLocalStatusValues,
  updateLocalStatus,
  updateStatus,
  cancel,
  update,
  listByUser,
} = require("../controllers/order");

router.post("/order/submit/:userId", requireSignin, isAuth, submitOrder);

router.get(
  "/order/payments/:orderId/:userId",
  requireSignin,
  isAuth,
  listInstallPaymentByUser
);

router.post("/order/cancel/:orderId/:userId", requireSignin, isAuth, cancel);
router.post(
  "/order/submit-installment/:orderId/:userId",
  requireSignin,
  isAuth,
  submitInstallmentPayment
);

router.get(
  "/orders/search/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  listSearch
);

router.get(
  "/orders/local-status/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  getLocalStatusValues
);
router.get("/orders/status/:userId", requireSignin, isAuth, getStatusValues);

router.post(
  "/order/local-status/:orderId/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  updateLocalStatus
);

router.post(
  "/order/status/:orderId/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  updateStatus
);

router.put("/order/:orderId/:userId", requireSignin, isAuth, isAdmin, update);

router.get(
  "/orders/partial-search/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  listPartialSearch
);

router.get(
  "/orders/prices-ranges/:userId",
  requireSignin,
  isAuth,
  pricesRangesBySearch
);

router.get("/orders/byuser/:userId", requireSignin, isAuth, listByUser);

router.get("/order/:orderId/:userId", requireSignin, isAuth, read);
router.param("orderId", orderById);
router.param("userId", userById);
module.exports = router;
