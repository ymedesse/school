const { Role } = require("../models/role");
const { controllerHelper } = require("../../utils/simpleControllerFactory");
const { create, read, update, remove, byId, removeMany } = controllerHelper(
  Role,
  "role",
  true
);
const { bulkUpdateModelValues } = require("../../utils");
const { errorHandler } = require("../../helpers/dbErrorHandler");

exports.updateMany = async (req, res) => {
  const { roles } = req.body;
  const { profile } = req;
  let newRoles = [];
  for (let i = 0; i < roles.length; i++) {
    const element = await performRoles(roles[i], profile);
    newRoles.push(element);
  }

  saveMany(res, newRoles, "_id", (val) => {
    res.json({ val });
  });
};

const performRoles = async (role, user) => {
  role.createBy = role.createBy || user._id;
  role.updateBy = user._id;
  return role;
};

const saveMany = (res, values, key = "id", next) => {
  bulkUpdateModelValues(Role, values)
    .then(async (idArray) => {
      !next && res.json({ idArray });
      next && next(idArray);
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.emptyRoles = (req, res) => {
  Role.deleteMany({}, (error) => {
    return error
      ? res.status(400).json({ error, file: "role" })
      : res.json("Suppression avec succès");
  });
};

exports.create = async (req, res) => {
  const { profile } = req;
  await performRoles(req.body, profile);
  return create(req, res);
};

exports.update = async (req, res) => {
  const { profile } = req;
  await performRoles(req.body, profile);
  update(req, res);
};

exports.list = (req, res) => {
  Role.find({})
    .select("id name permissions")
    .populate({ path: "permissions.access", select: "id name" })
    .exec((err, resultat) => {
      return err
        ? res.status(400).json({ error: errorHandler(err), file: "access" })
        : res.json(resultat);
    });
};

exports.read = (req, res) => {
  const { role } = req;
  role
    .populate({ path: "permissions.access", select: "id name" },(err, resultat) => {
      return err
        ? res.status(400).json({ error: errorHandler(err), file: "access" })
        : res.json({ role: resultat });
    });
};

exports.remove = remove;
exports.roleById = byId;
exports.removeMany = removeMany;
