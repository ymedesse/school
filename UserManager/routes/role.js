const express = require("express");
const router = express.Router();
const { routeHelper } = require("../../utils/simpleRouteHelper");
const { roleValidator } = require("../../validator");
const { requireSignin, isSupUser, isAuth } = require("../../controllers/auth");
// const { userById } = require("../../controllers/user");

const {
  create,
  read,
  remove,
  update,
  list,
  roleById,
  emptyRoles,
  removeMany,
  updateMany,
} = require("../controllers/role");

module.exports = routeHelper(
  "role",
  "roles",
  create,
  read,
  remove,
  update,
  list,
  roleById,
  roleValidator,
  router,
  () => {
    router.delete(
      "/roles-empty/:userId",
      requireSignin,
      isAuth,
      isSupUser,
      emptyRoles
    );
  },
  removeMany,
  updateMany,
  isSupUser
);
