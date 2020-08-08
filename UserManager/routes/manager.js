const express = require("express");
const router = express.Router();
const { userUpdateProfileValidator } = require("../../validator");

// permet d'attribuer un tooken au profil courant reccuperable dans la req
// isAuth vérifie si il y a un profile et qu'il y ait aussi un tooken et ensuite on vérifie si ils ont
// même id

const { requireSignin, isAuth, isSupUser } = require("../../controllers/auth");

const { userById } = require("../../controllers/user");

const {
  list,
  userToManageById,
  updateRole,
  remove,
    userInfo,
  deconnectUser,
} = require("../controllers/manager");

// paramètre dans la route
router.param("userId", userById);
router.param("userToManage", userToManageById);

router.get("/users/:userId", requireSignin, isAuth, isSupUser, list);

router.put(
  "/user/update-role/:userToManage/:userId",
  userUpdateProfileValidator,
  requireSignin,
  isSupUser,
  updateRole
);

router.get(
  "/user/:userToManage/:userId",
  userUpdateProfileValidator,
  requireSignin,
  isSupUser,
  userInfo
);

router.delete(
  "/user/:userId",
  userUpdateProfileValidator,
  requireSignin,
  isSupUser,
  remove
);

router.get("/user/signout/:userToManage/:userId", deconnectUser);

module.exports = router;
