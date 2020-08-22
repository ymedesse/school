/* eslint-disable no-console */
const Setting = require("../models/setting");
const settingsCode = require("../constants");
const { validationResult } = require("express-validator");

const { controllerHelper } = require("../utils/simpleControllerFactory");

const { create, read, update, remove, byId, list } = controllerHelper(
  Setting,
  "setting",
  true
);

exports.create = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }
  const { profile } = req;
  req.body.updateBy = profile;
  req.body.createBy = profile;
  create(req, res, (setting) =>
    res.json({ setting: setting.depopulate("createBy").depopulate("updateBy") })
  );
};

exports.update = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }
  const { profile } = req;
  req.body.updateBy = profile;
  req.body.createBy = profile;
  update(req, res, (setting) =>
    res.json({ setting: setting.depopulate("createBy").depopulate("updateBy") })
  );
};

exports.read = read;
exports.remove = remove;
exports.settingById = byId;
exports.list = list;

exports.settingList = (req, res, next) => {
  Setting.find().exec((error, resultat) => {
    if (error) {
      console.log({ error });
      return res.status(400).json({ error: "can not read settings" });
    }
    req.settings = resultat;
    next();
  });
};

exports.getAllsettingsCode = (req, res) => {
  res.json(settingsCode);
};
