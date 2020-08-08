const express = require("express");
const router = express.Router();

const { requireSignin, /* isAdmin, */ isAuth } = require("../controllers/auth");

const {
  read,
  customerById,
  listSearch,
  listPartialSearch,
} = require("../controllers/wooCustomer");

router.get("/customers/search", listSearch);
router.get("/customers/partial-search", listPartialSearch);
router.get("/user/:customerId", requireSignin, isAuth, read);
router.param("customerId", customerById);

module.exports = router;
