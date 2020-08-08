/* eslint-disable no-unused-vars */
const File = require("../models/file");
const User = require("../models/user");
const formidable = require("formidable");
const { slug } = require("../utils");

const multiparty = require("multiparty");
const fs = require("fs");

const _ = require("lodash");

const { errorHandler } = require("../helpers/dbErrorHandler");

const { validationResult } = require("express-validator");
const { bulkUpdateModelValues } = require("../utils");

const { controllerHelper } = require("../utils/simpleControllerFactory");

const { remove, removeMany, byId, saveCollection } = controllerHelper(
  File,
  "file",
  true,
  "id"
);

// creation
exports.create = async (req, res) => {
  let form = new multiparty.Form();
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    const { name } = fields;

    // check if error
    if (err) {
      return res.status(400).json({
        error: "File can not be uploaded",
      });
    }

    const imgArray = files.photo;
    const fichiers = [];

    for (var i = 0; i < imgArray.length; i++) {
      var singleImg = imgArray[i];

      const { originalFilename, size } = singleImg;
      const pname = name && name[i] ? name[i] : originalFilename;
      if (size >= 1000000) {
        res.status(401).json({
          error: "File is Less then 1 MB",
        });
      }

      fichiers.push({
        name: pname,
        type: singleImg.headers["content-type"],
        user: req.profile._id,
        size,
        img: {
          data: fs.readFileSync(singleImg.path),
          originalFilename,
        },
      });
    }
    try {
      const allFiles = await saveMany(fichiers);
      res.json(allFiles);
    } catch (error) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
  });
};

exports.fileById = byId;

exports.photo = (req, res, next) => {
  if (req.file.img.data) {
    res.set("Content-Type", req.file.img.contentType);
    return res.send(req.file.img.data);
  }
  next();
};

exports.read = (req, res) => {
  req.file.img = undefined;
  return res.json({ file: req.file });
};

exports.update = (req, res) => {
  const file = req.file;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  for (let [key, value] of Object.entries(req.body)) {
    file[key] = req.body[key];
  }
  saveCollection(res, file, (file) => {
    file.img = undefined;
    // performRealTime("update", file);
    res.json({ file });
  });
};

exports.updateMany = (req, res) => {
  const files = req.body.files;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.name === "" || !file.name) {
      res.status(400).json("Vous devez saisir un nom pour les fichiers");
    }
  }

  bulkUpdateModelValues(File, res, files, "file", (idArray) => {
    File.find({ id: { $in: idArray } }, "-img", (err, newFiles) => {
      if (err) {
        return res.status(400).json({ error: errorHandler(err) });
      }
      // performRealTime("manyupdate", newFiles);
      res.json({ files: newFiles });
    });
  });
};

const saveOne = async (file) =>
  new Promise((resolve, reject) =>
    file.save((err, data) => {
      if (data) data.img = undefined;
      resolve({ error: err, data });
    })
  );

const saveMany = (values) =>
  new Promise(async (resolve, reject) => {
    const resultat = [];
    for (let i = 0; i < values.length; i++) {
      const element = values[i];

      const myFile = new File(element);
      const reslt = await saveOne(myFile);
      const { data, error } = reslt;

      if (error) return reject(error);
      else resultat.push(data);
    }

    resolve(resultat);
  });

exports.list = (req, res) => {
  File.find()
    .select("-img -user")
    .sort([["updatedAt", "desc"]])
    .exec((err, files) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json(files);
    });
};

exports.remove = remove;
exports.removeMany = removeMany;
