const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { qrCodeValidator } = require("../validator");
const { orderById } = require("../controllers/order");
const { userById } = require("../controllers/user");

const {
  requireSignin,
  /*isAdmin,*/ isAuth,
  isAdmin,
} = require("../controllers/auth");

const {
  create,
  read,
  list,
  // removeMany,
  qrCodeById,
} = require("../controllers/qrCode");

const { setSimpleNewCodeToOrderPayment } = require("../controllers/payment");

module.exports = routeHelper(
  "qrcode",
  "qrcodes",
  undefined,
  undefined,
  undefined,
  undefined,
  list,
  qrCodeById,
  qrCodeValidator,
  router,
  () => {
    router.post(
      "/qrcode/create/:orderId/:userId",
      requireSignin,
      isAuth,
      qrCodeValidator,
      create,
      setSimpleNewCodeToOrderPayment
    );

    router.get("/qrcode/:code/:userId", requireSignin, isAuth, isAdmin, read);

    router.get("/qrCodes/", list);
    router.param("orderId", orderById);
    router.param("userId", userById);
  }
);
