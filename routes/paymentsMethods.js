const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { paymentMethodValidator } = require("../validator");

const {
  create,
  read,
  remove,
  update,
  list,
  paymentMethodById,
  // listByType,
  removeMany,
} = require("../controllers/paymentMethod");

module.exports = routeHelper(
  "paymentMethod",
  "paymentMethods",
  create,
  read,
  remove,
  update,
  list,
  paymentMethodById,
  paymentMethodValidator,
  router,
  () => {},
  undefined,
  removeMany
);

const m = {
  "name": "Chèque",
  "details": [
    { "label": "Banque", "id": "bank" },
    { "label": "N° du chèque", "id": "chequeId" },
    { "label": "Intutilé du compte", "id": "account" },
    { "label": "montant", "id": "amount" }
  ]
};
