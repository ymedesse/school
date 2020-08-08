const express = require("express");
const router = express.Router();
const { routeHelper } = require("../utils/simpleRouteHelper");
const { fileValidator } = require("../validator");
const {
  create,
  read,
  photo,
  remove,
  removeMany,
  update,
  list,
  fileById,
  updateMany,
} = require("../controllers/file");

module.exports = routeHelper(
  "file",
  "files",
  create,
  read,
  remove,

  update,
  list,
  fileById,
  fileValidator,
  router,
  () => {
    router.get("/photo/:fileId", photo);
  },
  removeMany,
  updateMany
);
