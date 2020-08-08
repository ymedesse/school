const Access = require("../models/access");
const { controllerHelper } = require("../../utils/simpleControllerFactory");
const { errorHandler } = require("../../helpers/dbErrorHandler");

const { create, read, update, remove, byId, removeMany } = controllerHelper(
  Access,
  "access",
  true
);
const { bulkUpdateModelValues } = require("../../utils");

exports.updateMany = (req, res) => {
  console.log("iiiii");
  const { accesses } = req.body;
  saveMany(res, accesses, "id", (data) => {
    res.json({ data });
  });
};

const saveMany = (res, values, key = "id", next) => {
  console.log("iisqsqsqsiii");

  bulkUpdateModelValues(Access, values, key)
    .then(async (idArray) => {
      !next && res.json({ idArray });
      next && next(idArray);
    })
    .catch((error) => {
      res.status(400).json({ error: errorHandler(error) });
    });
};

exports.emptyAccess = (req, res) => {
  Access.deleteMany({}, (error) => {
    return error
      ? res.status(400).json({ error: errorHandler(error), file: "access" })
      : res.json("Suppression avec succès");
  });
};

exports.create = create;
exports.update = (req, res) => update(req, res);
exports.read = read;
exports.remove = remove;
exports.accessById = byId;
exports.list = (req, res) => {
  Access.find({})
    .select("id name depreciated")
    .exec((err, resultat) => {
      return err
        ? res.status(400).json({ error: errorHandler(err), file: "access" })
        : res.json(resultat);
    });
};
exports.removeMany = removeMany;
