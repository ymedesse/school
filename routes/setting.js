const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { settingValidator } = require("../validator");
const {
  requireSignin,
  /*isAdmin,*/ isAuth,
  isSupUser,
} = require("../controllers/auth");

const { userById } = require("../controllers/user");

const {
  create,
  read,
  remove,
  update,
  list,
  settingById,
  getAllsettingsCode,
  // listByType,
  removeMany,
} = require("../controllers/setting");

module.exports = routeHelper(
  "setting",
  "settings",
  create,
  read,
  remove,
  update,
  list,
  settingById,
  settingValidator,
  router,
  () => {
    router.get(
      "/settings/codes/:userId",
      requireSignin,
      isAuth,
      isSupUser,
      getAllsettingsCode
    );

    router.param("userId", userById);
  },
  undefined,
  removeMany
);
