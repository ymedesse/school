/* eslint-disable no-console */
const IsbnData = require("../models/isbn");
const { controllerHelper } = require("../utils/simpleControllerFactory");
const { bulkUpdateModelValues } = require("../utils");

const { create, read, update, remove, byId, list } = controllerHelper(
  IsbnData,
  "isbnData",
  true
);

exports.checks = async (req, res, next) => {
  const { isbns = [] } = req;
  req.isbnsExists = await checkExistingsFunc(isbns);
  next();
};

exports.check = async (req, res, next) => {
  const { isbn } = req.body;
  if (isbn === "") {
    next();
  } else {
    const resultat = await checkExistingsFunc([isbn]);
    if (resultat.length > 0) {
      return res
        .status(400)
        .json({ error: " ce code isbn existe deja", resultat });
    }
    next();
  }
};

const checkExistingsFunc = (isbns) => {
  return new Promise((resolve, reject) => {
    IsbnData.find({ isbn: { $in: isbns } })
      .select("slug")
      .exec((error, res) => {
        if (error) reject(error);
        resolve(res);
      });
  });
};

/**
 *
 * @param {array} isbns {isbn, model, content}
 */
exports.insertIsbns = async (isbns) => {
  console.log({ isbns });
  try {
    const resultat = await bulkUpdateModelValues(IsbnData, isbns, "content");
    console.log("isbns updated cussess", resultat);
  } catch (error) {
    console.log("isbns updated error", error);
  }
};

exports.removeManyIsbns = (isbns) => {
  // eslint-disable-next-line no-unused-vars
  IsbnData.deleteMany({ isbn: { $in: isbns } }).exec((error, result) => {
    if (error) {
      console.log("remove in isbn data", error);
    }
  });
};

exports.checkExistingFunc = checkExistingsFunc;

exports.create = create;
exports.update = update;
exports.read = read;
exports.remove = remove;
exports.IsbnById = byId;
exports.list = list;


