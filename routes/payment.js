const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { paymentValidator } = require("../validator");
const { requireSignin, isAuth } = require("../controllers/auth");

const {
  create,
  read,
  remove,
  update,
  list,
  paymentById,
  sendToCaisse,
  pricesRangesBySearch,
  listPartialSearch,
  // listByType,
  listSearch,
  removeMany,
} = require("../controllers/payment");

const { contentById } = require("../controllers/panier");
const {
  caisseByUser,
  completePayment,
  validatePanierPayment,
  verificationNivo1,
} = require("../controllers/localPayment");

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
    router.post(
      "/payment/create/:panierId/:userId",
      requireSignin,
      isAuth,
      caisseByUser,
      contentById,
      verificationNivo1,
      completePayment,
      validatePanierPayment,
      create
    );

    router.get("/payment/search/:userId", requireSignin, isAuth, listSearch);
    router.get(
      "/payment/prices-ranges/:userId",
      requireSignin,
      isAuth,
      pricesRangesBySearch
    );
    router.get(
      "/payment/partial-search/:userId",
      requireSignin,
      isAuth,
      listPartialSearch
    );

    router.post(
      "/payment-transfer/:paymentId/:userId",
      requireSignin,
      isAuth,
      sendToCaisse
    );

    router.get("/payment/:paymentId/:userId", requireSignin, isAuth, read);
  },
  undefined,
  removeMany
);
