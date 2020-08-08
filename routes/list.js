const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { listValidator } = require("../validator");

const {
  requireSignin,
  isAdmin,
  isAuth,
  isSupUser,
} = require("../controllers/auth");

const {
  byId: schoolById,
  bySlug: schoolBySlug,
} = require("../controllers/school");

const { bySlug: classeBySlug } = require("../controllers/classe");

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
  getFourniture,
  getClassesFromSchool,
  getFournitureBySchoolAndClasse,
} = require("../controllers/list");

module.exports = routeHelper(
  "list",
  "lists",
  undefined,
  read,
  remove,
  update,
  undefined,
  byId,
  listValidator,
  router,
  () => {
    router.post(
      "/list/create/:userId",
      requireSignin,
      isAuth,
      isSupUser || isAdmin,
      listValidator,
      check,
      create
    );

    router.put(
      "/list/:listId/:userId",
      requireSignin,
      isAuth,
      isSupUser || isAdmin,
      listValidator,
      check,
      update
    );

    router.get("/school-fournitures/:listId", getFourniture);
    router.get(
      "/school-fournitures/:schoolSlug/:classeSlug",
      getFournitureBySchoolAndClasse
    );
    router.get("/classes-by-school-id/:schoolId", getClassesFromSchool);
    router.get("/classes-by-school-slug/:schoolSlug", getClassesFromSchool);

    router.get("/lists/prices-ranges", pricesRangesBySearch);
    router.get("/lists", list);
    router.get("/lists/search", listSearch);
    router.get("/lists/prices-ranges", pricesRangesBySearch);
    router.get("/lists/partial-search", listPartialSearch);

    router.param("schoolId", schoolById);
    router.param("schoolSlug", schoolBySlug);
    router.param("classeSlug", classeBySlug);
    // router.put("/lists/:userId", requireSignin, isAdmin, isAuth, updateMany);
  },
  removeMany
);
