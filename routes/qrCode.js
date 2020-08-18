const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { qrCodeValidator } = require("../validator");
const { orderById } = require("../controllers/order");
const { userById } = require("../controllers/user");

const { requireSignin, /*isAdmin,*/ isAuth } = require("../controllers/auth");

const {
  create,
  read,
  list,
  // removeMany,
  qrCodeById,
} = require("../controllers/qrCode");

module.exports = routeHelper(
  "qrCode",
  "qrCodes",
  undefined,
  read,
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
      create
    );

    router.get("/qrCodes/", list);
    router.param("orderId", orderById);
    router.param("userId", userById);
  }
);
