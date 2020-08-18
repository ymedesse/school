const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { paymentValidator } = require("../validator");
const { requireSignin, isAuth } = require("../controllers/auth");

const { orderById } = require("../controllers/order");

const {
  create,
  update,
  read,
  remove,
  paymentById,
  list,
  paymentsByOrder,
  paymentsByUser,
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
    router.get(
      "/order/payments/:orderId/:userId",
      requireSignin,
      isAuth,
      paymentsByOrder
    );

    router.get("/user/payments/:userId", requireSignin, isAuth, paymentsByUser);
    router.param("orderId", orderById);
  },

  undefined,
  undefined
);
