/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const Address = require("../models/address");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { validationResult } = require("express-validator");
const { getInfoUser } = require("./user");
const city = require("../models/city");
const { bulkUpdateModelValues } = require("../utils");

// crea1tion
exports.create = async (req, res) => {
  const user = req.profile;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  let address = new Address(req.body);

  if (!req.body.user) {
    address.user = user._id;
  }

  saveAddress(res, address, (newAddress) => {
    updateUserDefaultAddress(req, res, newAddress, async (newUser) => {
      try {
        const val = await getInfoUser(newUser);
        res.json(val);
      } catch (error) {
        res.status(400).json({ error: "une erreur s'est produite" });
      }
    });
  });
};

exports.update = (req, res) => {
  const address = req.address;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: errorHandler(firstError) });
  }

  for (let [key, value] of Object.entries(req.body)) {
    address[key] = req.body[key];
  }
  saveAddress(res, address, (newAddress) => {
    res.json({ address: newAddress });
  });
};

exports.upsertAddressFromShipping = (req, res, next) => {
  const { profile, body } = req;
  const { shipping: { address, method = "" } = {} } = body;

  if (!address)
    return res.status(400).json({ error: "Vous devez spécifier une adresse" });

  if (method === "local") return next();
  else {
    const sendAddress = async (err, val) => {
      if (err) {
        console.log({ err });
        return res.status(400).json({
          err,
          error:
            "une erreur s'est produite lors de l'enregistrement de l'adresse définie. Veuillez réessayer!",
        });
      }

      val.populate({ path: "city", select: "-createBy -updateBy" });
      await val.execPopulate();
      body.shipping.address = val;
      body.shipping.total = val.city.cost;
      next();
    };

    if (!address._id) {
      const newAdd = new Address(address);
      newAdd.user = profile;
      newAdd.save(sendAddress);
    } else {
      Address.findOneAndUpdate(
        { _id: address._id },
        { ...address, user: profile },
        { upsert: true, new: true, setDefaultsOnInsert: true },
        sendAddress
      );
    }
  }
};

const updateUserDefaultAddress = (req, res, newAddress, next) => {
  const user = req.profile;

  user.address = newAddress._id;
  user.save((err, newUser) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }
    //   console.log({ user, newUser, newAddress});
    next(newUser);
  });
};

exports.updateUserDefaultAddress = updateUserDefaultAddress;

exports.addressById = (req, res, next, id) => {
  Address.findById(id).exec((err, address) => {
    if (err | !address) {
      return res.status(400).json({
        error: "Adress not found",
      });
    }
    req.address = address;
    next();
  });
};

exports.read = (req, res) => {
  return res.json({ address: req.address });
};

exports.remove = (req, res) => {
  const address = req.address;
  const user = req.profile;
  address.remove((err, newAddress) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    checkUserAdress(() => {
      res.json({
        message: "L'address a été supprimé avec succès",
      });
    });
  });

  const checkUserAdress = (next) => {
    if (user.address.toString() === address._id.toString()) {
      user.address = undefined;
    }
    let addressesDropped = user.history.addressesDropped
      ? [...user.history.addressesDropped, address]
      : [address];

    user.history = { ...user.history, addressesDropped };

    user.save((err, newUser) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      next();
    });
  };
};

exports.list = (req, res) => {
  Address.find()
    .populate("user")
    .exec((err, addresses) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json(addresses);
    });
};

exports.getLocalAddresses = async (req, res) => {
  try {
    const addresses = await findLocalAddress();
    res.json(addresses);
  } catch (error) {
    res.status(400).json({
      error: errorHandler(error),
    });
  }
};

const findLocalAddress = () => {
  return new Promise((resolve, reject) => {
    Address.find({ local: true })
      .populate({ path: "city", select: "name cost code" })
      .exec((err, addresses) => {
        err && reject(err);
        resolve(addresses);
      });
  });
};

exports.findLocalAddress = findLocalAddress;

exports.addressesByUser = (req, res) => {
  Address.find({ user: req.profile }).exec((err, addresses) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json(addresses);
  });
};

const performCreate = (req, res, user, addressFields) => {
  let address = new Address(addressFields);

  if (!req.body.user) {
    address.user = user._id;
  }

  saveAddress(res, address, (newAddress) => {
    user.address = newAddress.id;
    user.save((err, newUser) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json({ user: newUser, address: newAddress });
    });
  });
};

const saveAddress = (res, address, next) => {
  address.save(async (err, newAddress) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    address.populate({ path: "city", select: "name cost slug code" });
    await address.execPopulate();
    next(newAddress);
  });
};
