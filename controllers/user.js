/* eslint-disable no-console */
const User = require("../models/user");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { performReadLite: readLiteCart } = require("./cart");
const { performReadLite: readLiteCmde } = require("./commande");
const { getCostRange } = require("./city");

exports.userById = (req, res, next, id) => {
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    req.profile = user;
    next();
  });
};

exports.read = (req, res) => {
  const { profile } = req;
  profile.hashed_password = undefined;
  profile.salt = undefined;
  if (!profile.isAdmin) {
    delete profile.additionalPermissions;
    profile.roles = [];
  }

  return res.json(profile);
};

exports.info = async (req, res) => {
  try {
    const val = await getInfoUser(req.profile);
    return res.json(val);
  } catch (error) {
    console.log("error on fecth in user", { error });
    res.status(400).json({ error: "Une erreur s'est produite" });
  }
};

const getInfoUser = async (profile) => {
  return new Promise(async (resolve, reject) => {
    const auteur = { user: profile };

    let cart = {};
    let commande = {};
    let range = [];
    try {
      cart = await readLiteCart(auteur);
      commande = await readLiteCmde(auteur);
    } catch (error) {
      console.log("fetchCartInUser", { error });
    }

    try {
      range = await getCostRange();
    } catch (error) {
      console.log("fetchCityRange", { error });
    }

    populateRole(profile, async (user) => {
      const {
        _id,
        lastName,
        email,
        phone,
        address,
        store,
        roles,
        isConnected,
        rolesLabel,
        supUser,
        additionalPermissions,
        isAdmin,
        imageUrl,
        isOnlyExternal,
      } = user;

      let accesses;
      if (isAdmin) accesses = await getAllaccess(roles, additionalPermissions);

      const val = {
        _id,
        lastName,
        email,
        phone,
        address,
        store,
        rolesLabel,
        isConnected,
        supUser,
        accesses,
        imageUrl,
        isOnlyExternal,
        isAdmin,
      };

      resolve({ user: val, cart, commande, shippingRange: range[0] });
    });
  });
};
exports.getInfoUser = getInfoUser;

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
    (err, result) => {
      next(result);
    }
  );
};

exports.getAllaccess = getAllaccess;
exports.populateRole = populateRole;

exports.addOrderToUserHistory = (req, res, next) => {
  let history = [];

  req.body.order.bags.forEach((item) => {
    history.push({
      id: item.id,
      bag: item.bag,
      isbn: item.isbn,
      variant: item.variant,
      name: item.name,
      quantity: item.quantity,
      transaction_id: req.body.order.transaction_id,
      amount: req.body.order.amount,
    });
  });

  userPushToHistory(res, req.profile._id, { "bags": [...history] }, () =>
    next()
  );
};

const userPushToHistory = (res, userId, newHistory, next) => {
  const key = Object.keys(newHistory)[0];
  User.findOneAndUpdate(
    { _id: userId },
    { $push: { [`history.${key}`]: newHistory[key] } },
    { new: true },
    (error) => {
      if (error) {
        return res.status(400).json({
          error: errorHandler(error),
        });
      }
      next();
    }
  );
};
