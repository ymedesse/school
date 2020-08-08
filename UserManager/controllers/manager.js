const User = require("../../models/user");
const { errorHandler } = require("../../helpers/dbErrorHandler");

exports.userToManageById = (req, res, next, id) => {
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User to manage not found",
      });
    }
    req.user = user;

    next();
  });
};

exports.read = (req, res) => {
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  return res.json(req.profile);
};

exports.userInfo = (req, res) => {
  const { user } = req;
  user.history = undefined;
  user.hashed_password = undefined;
  user.salt = undefined;
  populateRole(user, (val) => res.json({ user: val }));
};

exports.list = (req, res) => {
  User.find()
    .select(
      "lastName firstName isConnected nomAfficher phone address email lastActive connectCount  rolesLabel additionalPermissions.access additionalPermissions.level supUser"
    )
    .populate([
      {
        path: "roles",
        select: "name permissions",
        populate: [{ path: "permissions.access", select: "_id name id" }],
      },
      { path: "additionalPermissions.access", select: "id name" },
    ])
    .exec(async (err, users) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
          file: "User",
        });
      }

      let finalUser = [];
      for (let i = 0; i < users.length; i++) {
        const item = users[i];
        finalUser.push({
          ...item._doc,
          rolesLabel: await getRoleLabel(item.roles),
        });
      }

      res.json({ count: users.length, results: finalUser });
    });
};

const getRoleLabel = async (roles) => {
  let roleLabel = await roles.map((item) => item.name).join(", ");
  return roleLabel;
};

exports.updateRole = (req, res) => {
  const { user, body } = req;
  const { roles, additionalPermissions } = body;

  User.findOneAndUpdate(
    { _id: user._id },
    { $set: { roles, additionalPermissions } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
    (err, val) => {
      if (err) {
        return res.status(400).json(err);
      } else {
        val.salt = undefined;
        val.hashed_password = undefined;
        val.__v = undefined;
        val.history = undefined;
        return populateRole(val, (v) => res.json(v));
      }
    }
  );
};

const getAllaccess = async (roles, additionalPermissions) => {
  let access = {};

  const copyAccess = (permission) => {
    const id = permission.access.id;
    const value = permission.level.id;
    access = { ...access, [`${id}`]: value === 0 ? undefined : value };
  };

  for (let i = 0; i < roles.length; i++) {
    for (let y = 0; y < roles[i].permissions.length; y++) {
      copyAccess(roles[i].permissions[y]);
    }
  }
  for (let i = 0; i < additionalPermissions.length; i++) {
    copyAccess(additionalPermissions[i]);
  }

  return access;
};

const populateRole = (user, next) => {
  user.populate(
    [
      {
        path: "roles",
        select: "name permissions",
        populate: [{ path: "permissions.access", select: "_id name id" }],
      },
      { path: "additionalPermissions.access", select: "id name" },
    ],
    async (err, result) => {
      if (err) return res.status(400).json(err);

      !err &&
        next({
          ...result._doc,
          accesses: await getAllaccess(
            result.roles,
            result.additionalPermissions
          ),
        });
    }
  );
};

exports.initalizePassword = (req, res) => {
  const { user, body } = req;
  const { role = 0 } = body;
  User.findOneAndUpdate(
    { _id: user._id },
    { $set: { role: role } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
    (err, val) => {
      if (err) {
        return res.status(400).json(err);
      } else {
        res.json(val);
      }
    }
  );
};

exports.deconnectUser = (req, res) => {
  const { user } = req;
  user.isConnected = false;
  user.save((err, result) => {
    if (err) res.clearCookie("t");
    res.json({ message: "Signout success" });
  });
};

exports.remove = (req, res) => {
  const { ids } = req.body;

  User.deleteMany({ _id: { $in: ids } }).exec((err) => {
    if (err) {
      return res.json.status(400).json({ err });
    }
    res.json({ success: "suppression avec succès" });
  });
};
