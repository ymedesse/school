/* eslint-disable no-console */
const Wished = require("../models/wished");
const { validationResult } = require("express-validator");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { controllerHelper } = require("../utils/simpleControllerFactory");

const { create, update, remove, byId, removeMany } = controllerHelper(
  Wished,
  "wished",
  false
);

exports.updateInsert = (req, res) => {
  let { wished, profile, body } = req;
  const { liste: value } = body;

  if (!value) return sendError(res, "vous devez définir une liste");
  wished.updatedBy = profile;
  wished.listes = performSetListeInWishedListe(wished.listes, value);

  saveWished(res, wished);
};

exports.wishedByUser = (req, res, next) => {
  const { profile } = req;
  Wished.findOne({ user: profile, status:"pending" })
    .populate({ path: "listes.classe" })
    .exec((err, resultat) => {
      if (err || resultat === null) {
        console.log(" in whishByUser ", err);
        sendError(res, "liste non trouvée", { code: "-1" });
      }

      req.wished = resultat === null ? undefined : resultat;
      next();
    });
};

exports.readByUser = (req, res) => {
  res.json(req.wished);
};

exports.checkWishedFromUser = (req, res, next) => {
  const { profile } = req;
  Wished.findOne({ user: profile }).exec(async (err, resultat) => {
    if (err) {
      console.log("in checkWishedFromUser", err);
      return res.status(400).json({ error: errorHandler(err) });
    }

    try {
      req.wished = await performChekWishedNotFound(req, res, resultat);
    } catch (error) {
      console.log("in checked", error);
      return sendError(res, error);
    }

    next();
  });
};

const performChekWishedNotFound = (req, res, resultat) =>
  new Promise((resolve, reject) => {
    const { profile, body } = req;

    if (!resultat || resultat === null) {
      body.phone = body.phone || profile.phone;
      if (!body.phone) reject("Vous devez définir un numéro de téléphone");

      resolve(
        new Wished({
          phone: body.phone,
          listes: [],
          user: profile,
        })
      );
    } else resolve(resultat);
  });

exports.updateInfo = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  let { wished, profile, body } = req;
  const { phone } = body;
  wished.phone = phone;
  wished.updateBy = profile;
  saveWished(res, wished);
};


exports.removeOneListe = (req, res) => {
  let { wished, profile, body } = req;
  const { liste } = body;
  if (!liste) sendError(res, " liste is required in body");

  const { listes } = wished;
  const index = listes.findIndex(
    (item) => item._id.toString() === body.liste._id
  );

  if (index === -1) return sendError(res, "liste  introuvable");

  listes.splice(index, 1);

  wished.updatedBy = profile;
  saveWished(res, wished);
};

exports.list = (req, res) => {
  Wished.find()
    .populate([{ path: "listes.classe", select: "code" }, {
      path:"user", select:"firstName lastName imageUrl nomAfficher"
    }])
    .exec(async (err, results) => {
      if (err) sendError(res, err, { message: "find error" });

      res.json({ results: await getAllWished(results) });
    });
};

const getAllWished = async (values) => {
  const allListes = [];
  for (let i = 0; i < values.length; i++) {
    const { _id, listes, ...rest } = values[i];
    for (let y = 0; y < (listes || []).length; y++) {
      const list = listes[y];
      const m = { ...rest._doc };
      delete m.listes;
      allListes.push({ ...list._doc, wished: { _id, ...m } });
    }
  }
  return allListes;
};


exports.read = async (req, res) => {
  const { wished } = req;
  wished.populate({ path: "listes.classe", select: "code" });
  await wished.execPopulate();
  res.json(wished);
};

const saveWished = (res, wished) => {
  wished.save(async (error, newWished) => {
    if (error) {
      console.log("on saving", error);
      return sendError(res, error);
    }

    newWished.populate({ path: "listes.classe", select: "code" });
    await newWished.execPopulate();
    res.json(newWished);
  });
};

const performSetListeInWishedListe = (listes = [], value = {}) => {
  const index = listes.findIndex((item) => item._id.toString() === value._id);
  if (index !== -1) copieData(value, listes[index]);
  else index === -1 && listes.push(value);
  return listes;
};

const copieData = (source, destination) => {
  for (let [key, value] of Object.entries(source)) {
    destination[key] = value;
  }
};

const sendError = (res, message, additional = {}) => {
  const eType = typeof message;
  return res.status(400).json({
    error: eType === "string" ? message : errorHandler(message),
    ...additional,
  });
};

exports.create = create;
exports.update = update;
exports.remove = remove;
exports.wishedById = byId;
exports.removeMany = removeMany;
