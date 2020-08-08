/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const User = require("../models/user");
const {
  errorHandler,
  checkErrorFromDataBase,
} = require("../helpers/dbErrorHandler");

const { validationResult } = require("express-validator");

exports.controllerHelper = (
  Collection,
  docName,
  mustValidate,
  idField = "_id"
) => {
  const create = async (req, res, next) => {
    const user = req.profile;
    if (mustValidate) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg;
        return res.status(400).json({ error: firstError });
      }
    }

    let docValue = new Collection(req.body);

    if (!req.body.user) {
      docValue.user = user._id;
    }

    saveCollection(res, docValue, (val) => {
      next ? next(val) : res.json({ [`${docName}`]: val });
    });
  };

  const byId = (req, res, next, id) => {
    Collection.findOne({ [`${idField}`]: id }).exec((err, docValue) => {
      if (err | !docValue) {
        return res.status(400).json({
          error: `${docName} not found`,
        });
      }
      req[`${docName}`] = docValue;

      next();
    });
  };

  const read = (req, res) => {
    return res.json({ [`${docName}`]: req[`${docName}`] });
  };

  const update = (req, res, next) => {
    const docValue = req[`${docName}`];

    if (mustValidate) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg;
        return res.status(400).json({ error: firstError });
      }
    }

    for (let [key, value] of Object.entries(req.body)) {
      docValue[key] = req.body[key];
    }

    saveCollection(res, docValue, (val) => {
      next ? next(val) : res.json({ [`${docName}`]: val });
    });
  };

  const remove = (req, res) => {
    const docValue = req[`${docName}`];
    docValue.remove((err, instance) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }

      res.json({
        message: "Suppression  avec succès",
      });
    });
  };

  const removeMany = (req, res) => {
    const { ids } = req.body;

    Collection.deleteMany({ [`${idField}`]: { $in: ids } }).exec(
      (err, result) => {
        if (err) {
          return res.json.status(400).json({ err });
        }
        res.json(" suppression avec succès");
      }
    );
  };

  const list = (req, res) => {
    Collection.find()
      .populate("user")
      .select("-createdAt -updatedAt")
      .exec((err, instances) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        res.json(instances);
      });
  };

  const saveCollection = (res, colValue, next) => {
    colValue.save((err, newCollection) => {
      if (err) {
        console.log({ error: err });
        return res.status(400).json({
          error: errorHandler(err),
          model: docName,
        });
      } else
        next
          ? next(newCollection)
          : res.json({ [`${docName}`]: newCollection });
    });
  };

  const updateUpsertCollection = (res, colValue, next) => {
    let p = new Collection({ ...colValue });

    Collection.findOneAndUpdate(
      { [`${idField}`]: p[`${idField}`] },
      { $set: p },
      { upsert: true, new: true, setDefaultsOnInsert: true },
      (err, val) => {
        if (err) {
          return res.status(400).json(err);
        } else {
          next(val);
        }
      }
    );
  };

  return {
    create,
    read,
    update,
    remove,
    byId,
    list,
    saveCollection,
    updateUpsertCollection,
    removeMany,
  };
};
