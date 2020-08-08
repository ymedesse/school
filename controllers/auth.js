/* eslint-disable no-console */
const User = require("../models/user");
const Setting = require("../models/setting");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { validationResult, body } = require("express-validator");
const jwt = require("jsonwebtoken"); // to generate signed token
const expressJwt = require("express-jwt"); // for authaurization chek
const { getAllaccess } = require("./user");

exports.signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return rejectErros(res, errors);
  }

  try {
    const data = await performSaveUser(res, req.body);
    res.json({ ...data });
  } catch (error) {
    return rejectError(res, error, "in signup");
  }
};

const performSaveUser = (res, body) =>
  new Promise((resolve, reject) => {
    const nomAfficher = body.name || `${body.firstName} ${body.lastName}`;
    const userBody = { ...body, nomAfficher };

    const user = new User(userBody);

    user.lastActive = Date.now();
    user.connectCount++;
    user.isConnected = true;

    user.save(async (err, user) => {
      if (err) {
        console.log("save user");
        return reject(err);
      }

      const token = await getNewToken(res, user);
      user.hashed_password = undefined;
      user.salt = undefined;
      resolve({ user, token });
    });
  });

// connection
exports.signin = async (req, res) => {
  const { email, password } = req.body.user;

  User.findOne({ email }, async (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "Il n'existe aucun utilisateur correspondant à ce email ",
      });
    }

    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "L'email ou mot de passe non valide",
      });
    }

    try {
      let token;
      let data = await performSignin(res, user);
      if (data) token = data.token;
      if (data) user = data.user;
      if (user.isAdmin) data = await setUserSignedEnvSetting(user, token);
      else user.roles = [];

      res.json(data);
    } catch (error) {
      console.log({ error });
      rejectError(res, error, "in signin");
    }
  });
};

const performSignin = async (res, user) =>
  new Promise((resolve, reject) => {
    user.lastActive = Date.now();
    user.connectCount++;
    user.isConnected = true;

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.cookie("t", token, { expire: new Date() + 999 });

    user.save((error, result) => {
      if (error) {
        console.log("error whene performsign");
        reject(error);
      }
      !error && resolve({ user: result, token });
    });
  });

const setUserSignedEnvSetting = async (user, token) =>
  new Promise(async (resolve, reject) => {
    await user.populate([
      {
        path: "roles",
        select: "name permissions",
        populate: [{ path: "permissions.access", select: "_id name id" }],
      },
      { path: "additionalPermissions.access", select: "id name" },
    ]);
    await user.execPopulate();

    const { roles, additionalPermissions } = user;
    try {
      const accesses = await getAllaccess(roles, additionalPermissions);
      const woocommerceApi = await getSettingData();
      resolve({
        token,
        user: { ...user._doc, accesses },
        woocommerceApi,
      });
    } catch (error) {
      reject(error);
    }
  });

const getSettingData = () =>
  new Promise((resolve, reject) => {
    Setting.findOne({ name: "woocommerceApi" })
      .select("content")
      .exec((err, woocommerceApi) => {
        err && reject(err);
        resolve(woocommerceApi ? woocommerceApi.content : {});
      });
  });

exports.externalAuth = async (req, res) => {
  const { body } = req;
  const { email, imageUrl, familyName, givenName, googleId } = body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    rejectErros(res, errors);
  }

  User.findOne({ email }, async (err, user) => {
    if (err) {
      console.log({ error: err });
      return res.status(400).json({ error: errorHandler(err) });
    }
    let token, data;

    const mbody = {
      email,
      imageUrl,
      lastName: familyName,
      firstName: givenName,
      googleId,
    };

    try {
      if (!user || user === null) {
        const val = body.googleId
          ? { ...mbody, googleData: body }
          : { ...body };

        data = await performSaveUser(res, val);
      } else {
        if (body.googleId) user.googleData = body;
        user.imageUrl = imageUrl;
        data = await performSignin(res, user);
      }

      if (data) token = data.token;
      if (data) user = data.user;
      if (user.isAdmin) data = await setUserSignedEnvSetting(user, token);
      else user.roles = [];

      res.json(data);
    } catch (error) {
      rejectError(res, error, "performsignin");
    }
  });
};

const getNewToken = async (res, user) => {
  //generate a signed token with user id and secret
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  //persit the token as 't' in cookie with expiry date
  res.cookie("t", token, { expire: new Date() + 999 });
  res.cookie("u", user._id, { expire: new Date() + 999 });
  return token;
};

// avec cette méthode il risque de se déconnecté sur tout les différent naviguateur
// donc y ajouter l'id de la ssesion
exports.signout = (req, res) => {
  const { profile } = req;
  profile.isConnected = false;

  profile.save((err, result) => {
    if (err) res.clearCookie("t");
    res.json({ message: "Signout success" });
  });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: "auth",
});

// controler l'accès aux information d'autruit
exports.isAuth = (req, res, next) => {
  // on verifie si il existe un profile ( issue de :userId )
  //en cours et une authorisation ( requireSignin ) et que les deux entité ont le même id
  // si non on refuse l'accès

  let user = req.profile && req.auth && req.profile._id == req.auth._id;

  if (!user) {
    return res.status(403).json({
      error: "Access refusé",
    });
  }
  next();
};

// verifie critère admin
exports.isAdmin = (req, res, next) => {
  const { profile } = req;
  if (!profile.isAdmin && !profile.supUser) {
    return res.status(403).json({
      error: "Droit d'accès backend! Accès refusé",
    });
  }
  next();
};

exports.isSupUser = (req, res, next) => {
  if (req.profile.supUser !== true) {
    return res.status(403).json({
      error: "Droit de super utilisateur! Accès refusé",
    });
  }
  next();
};

const checkPasswordChangement = (body, user) =>
  new Promise(async (resolve, reject) => {
    if (body.password && !(user.isOnlyExternal || user.isNewUser)) {
      const { newPassword, password } = body;

      !user.authenticate(password) &&
        reject("Le mot de passe saisi n'est pas valide");

      body.password = newPassword;
    }
    resolve(body);
  });

const checkOnlyExternalPasswordChange = async (body, user) =>
  new Promise((resolve, reject) => {
    if (user.isOnlyExternal && body.newPassword) {
      console.log("in external");
      body.password = body.newPassword;
      body.isOnlyExternal = false;
    }
    resolve(body);
  });

const checkOnlyExternalSetting = async (body, user) => {
  if (user.isNewUser && body.password) {
    body.password = body.newPassword;
    user.isNewUser = false;
  }
};

exports.update = async (req, res) => {
  let { body, profile: user } = req;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return rejectErros(res, errors);
  }

  try {
    await checkValidPassWordField(body, user);
    await checkPasswordChangement(body, user);
    await checkOnlyExternalPasswordChange(body, user);
  } catch (error) {
    return res.status(400).json({ error });
  }

  for (let [key, value] of Object.entries(req.body)) {
    user[key] = req.body[key];
  }

  user.save((err, newUser) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    newUser.salt = undefined;
    user.hashed_password = undefined;
    const { _id, lastName, email, phone, role, address, store } = newUser;

    res.json({
      user: { _id, lastName, email, phone, role, address, store },
      profile: newUser,
    });
  });
};

const rejectError = (res, error, comment) => {
  // console.log(error);
  return res.status(400).json({
    error: errorHandler(error),
    comment,
  });
};

const rejectErros = (res, errors) => {
  const firstError = errors.array()[0].msg;
  return res.status(400).json({ error: firstError });
};





const isValid = (val) => (val === "" || !val ? false : true);

const checkValidPassWordField = (body, user) =>
  new Promise(async (resolve, reject) => {
    const { newPassword, password, confirmation } = body;
    const { isNewUser, isOnlyExternal } = user;

    const mustCheck =
      (!(isNewUser || isOnlyExternal) && password) ||
      ((isNewUser || isOnlyExternal) && newPassword)
        ? true
        : false;

    console.log({ mustCheck, isNewUser, isOnlyExternal, newPassword });

    if (mustCheck) {
      if (!isValid(newPassword)) {
        reject("Vous devez saisir un nouveau mot de passe");
      }
      if (password === newPassword) {
        reject("Le nouveau mot de passe doit être différent de l'ancien ");
      }
      if (!newPassword.match(/\d/)) {
        reject("Le nouveau mot de passe doit contenir au moins un chiffre ");
      }
      if (!isValid(confirmation)) {
        reject("Vous devez saisir le mot de passe de confirmation");
      }
      if (newPassword !== confirmation) {
        reject("Le nouveau mot de passe doit être conforme à la confimiation");
      }
    }

    resolve(true);
  });
