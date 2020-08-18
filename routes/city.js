const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { cityValidator } = require("../validator");

const { requireSignin, isAdmin, isAuth } = require("../controllers/auth");

const {
  create,
  read,
  remove,
  update,
  list,
  removeMany,
  listSearch,
  listPartialSearch,
  byId,
  costRange,
} = require("../controllers/city");

module.exports = routeHelper(
  "city",
  "cities",
  create,
  read,
  remove,
  update,
  list,
  byId,
  cityValidator,
  router,

  () => {
    router.delete(
      "/cities/:userId",
      requireSignin,
      isAuth,
      isAdmin,
      removeMany
    );
    router.get("/cities/search", listSearch);
    router.get("/cities/min-cost", costRange);
    router.get("/cities/partial-search", listPartialSearch);
    router.get("/cities/", list);
  }
);
