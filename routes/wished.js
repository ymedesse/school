const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { userById } = require("../controllers/user");
const { requireSignin, isAuth } = require("../controllers/auth");
const { whishValidator } = require("../validator");

const {
  updateInsert,
  wishedByUser,
  checkWishedFromUser,
  updateInfo,
  create,
  read,
  remove,
  removeMany,
  update,
  list,
  wishedById,
  removeOneListe,
  readByUser,
} = require("../controllers/wished");

module.exports = routeHelper(
  "wished",
  "wisheds",
  create,
  read,
  remove,
  update,
  list,
  wishedById,
  whishValidator,
  router,
  () => {
    router.get(
      "/wished-list/:userId",
      requireSignin,
      isAuth,
      wishedByUser,
      readByUser
    );

    router.post(
      "/wished-list/:userId",
      requireSignin,
      isAuth,
      checkWishedFromUser,
      updateInsert
    );

    router.post(
      "/wished-list/remove/:userId",
      requireSignin,
      isAuth,
      wishedByUser,
      removeOneListe
    );

    router.post(
      "/wished-list/info/:userId",
      requireSignin,
      isAuth,
      wishedByUser,
      updateInfo
    );

    router.param("userId", userById);
  },
  removeMany,
  undefined
);
