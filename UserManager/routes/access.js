const express = require("express");
const router = express.Router();
const { routeHelper } = require("../../utils/simpleRouteHelper");
const { accessValidator } = require("../../validator");
const {
  requireSignin,
  //   isAdmin,
  isSupUser,
  isAuth,
} = require("../../controllers/auth");
// const { userById } = require("../../controllers/user");

const {
  create,
  read,
  remove,
  update,
  list,
  accessById,
  emptyAccess,
  removeMany,
  updateMany,
} = require("../controllers/access");

module.exports = routeHelper(
  "access",
  "accesses",
  create,
  read,
  remove,
  update,
  list,
  accessById,
  accessValidator,
  router,
  () => {
    router.delete(
      "/accesses/:userId",
      requireSignin,
      isAuth,
      isSupUser,
      emptyAccess
    );
  },
  removeMany,
  updateMany,
  isSupUser
);
