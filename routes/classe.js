const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { classeValidator } = require("../validator");

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
} = require("../controllers/classe");

module.exports = routeHelper(
  "classe",
  "classes",
  create,
  read,
  remove,
  update,
  list,
  byId,
  classeValidator,
  router,

  () => {
    router.delete(
      "/classes/:userId",
      requireSignin,
      isAuth,
      isAdmin,
      removeMany
    );
    router.get("/classes/search", listSearch);
    router.get("/classes/partial-search", listPartialSearch);
    router.get("/classes/", list);
  }
);
