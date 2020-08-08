const express = require("express");
const router = express.Router();

const {
  signup,
  signin,
  signout,
  externalAuth,
} = require("../controllers/auth");
const { userSignupValidator } = require("../validator");
const { userById } = require("../controllers/user");

router.post("/signup", userSignupValidator, signup);

router.post("/signin", signin);
router.post("/external-signin", externalAuth);

router.get("/signout/:userId", signout);

// paramètre dans la route
router.param("userId", userById);

// router.get("/hello",requireSignin,(req,res)=>{
//     res.send("Bonjour tout le monde")
// })
module.exports = router;
