const express = require("express");
const router = express.Router();

const { userById } = require("../controllers/user");
const { requireSignin, isAuth } = require("../controllers/auth");
const { payment, checkStatus } = require("./controller");

router.post("/qos/payment/:userId", requireSignin, isAuth, payment);
router.post("/qos/checkstatus/:userId", requireSignin, isAuth, checkStatus);

router.param("userId", userById);
module.exports = router;
