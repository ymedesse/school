const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { productValidator } = require("../validator");

const {
  requireSignin,
  isAdmin,
  isAuth,
  isSupUser,
} = require("../controllers/auth");
const { check } = require("../controllers/isbn");
const {
  create,
  read,
  remove,
  update,
  list,
  byId,
  removeMany,
  listSearch,
  pricesRangesBySearch,
  listPartialSearch,
} = require("../controllers/product");

module.exports = routeHelper(
  "product",
  "products",
  undefined,
  read,
  remove,
  update,
  undefined,
  byId,
  productValidator,
  router,
  () => {
    router.post(
      "/product/create/:userId",
      requireSignin,
      isAuth,
      isSupUser || isAdmin,
      productValidator,
      check,
      create
    );

    router.put(
      "/product/:productId/:userId",
      requireSignin,
      isAuth,
      isSupUser || isAdmin,
      productValidator,
      check,
      update
    );
    router.get("/product/:productId", read);

    router.get("/products/prices-ranges", pricesRangesBySearch);
    router.get("/products", list);
    router.get("/products/search", listSearch);
    router.get("/products/prices-ranges", pricesRangesBySearch);
    router.get("/products/partial-search", listPartialSearch);

    // router.put("/products/:userId", requireSignin, isAdmin, isAuth, updateMany);
  },
  removeMany
);
