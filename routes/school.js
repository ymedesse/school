const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { schoolValidator } = require("../validator");

const {
  requireSignin,
  isAdmin,
  isAuth,
  isSupUser,
} = require("../controllers/auth");

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
} = require("../controllers/school");

module.exports = routeHelper(
  "school",
  "schools",
  create,
  read,
  remove,
  update,
  list,
  byId,
  schoolValidator,
  router,

  () => {
    router.delete(
      "/schools/:userId",
      requireSignin,
      isAuth,
      isSupUser || isAdmin,
      removeMany
    );
    router.get("/schools/search", listSearch);
    router.get("/schools/partial-search", listPartialSearch);
    router.get("/schools/", list);
  }
);
