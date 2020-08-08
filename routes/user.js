const express = require("express");
const router = express.Router();
const { userUpdateProfileValidator } = require("../validator");

// permet d'attribuer un tooken au profil courant reccuperable dans la req
// isAuth vérifie si il y a un profile et qu'il y ait aussi un tooken et ensuite on vérifie si ils ont
// même id

const {
  requireSignin,
  isAuth,
  isAdmin
} = require("../controllers/auth");

const {
  userById,
  read,
  info
} = require("../controllers/user");

const { update } = require("../controllers/auth");

// paramètre dans la route
router.param("userId", userById);

router.get("/secret/:userId", requireSignin, isAuth, isAdmin, (req, res) => {
  res.json({
    user: req.profile,
    auth: req.auth,
  });
});


router.put(
  "/user/update/:userId",
  userUpdateProfileValidator,
  requireSignin,
  isAuth,
  update
);

router.get("/user/:userId", requireSignin, isAuth, read);
router.get("/user/info/:userId", requireSignin, isAuth, info);

module.exports = router;
