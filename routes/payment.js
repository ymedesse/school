const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { paymentValidator } = require("../validator");
const {
  requireSignin,
  isAuth,
  isCasher,
  isAdmin,
} = require("../controllers/auth");

const {
  orderById,
  impactValidQrPaymentToOrder,
} = require("../controllers/order");
const { qrCodeById } = require("../controllers/qrCode");

const {
  create,
  update,
  read,
  remove,
  paymentById,
  list,
  paymentsByOrder,
  paymentsByUser,
  submitFromQrcode,
  finalisePaymentFromCode,
} = require("../controllers/payment");

module.exports = routeHelper(
  "payment",
  "payments",
  undefined,
  undefined,
  remove,
  update,
  list,
  paymentById,
  paymentValidator,
  router,
  () => {
    router.post("/payment/create/:userId", requireSignin, isAuth, create);
    router.get("/payment/:paymentId/:userId", requireSignin, isAuth, read);
    router.post(
      "/payment-by-qrcode/:qrcodeId/:orderId/:userId",
      requireSignin,
      isAuth,
      isAdmin,
      isCasher,
      submitFromQrcode,
      impactValidQrPaymentToOrder,
      finalisePaymentFromCode
    );
    router.get(
      "/order/payments/:orderId/:userId",
      requireSignin,
      isAuth,
      paymentsByOrder
    );

    router.get("/user/payments/:userId", requireSignin, isAuth, paymentsByUser);
    router.param("orderId", orderById);
    router.param("qrcodeId", qrCodeById);
  },

  undefined,
  undefined
);
