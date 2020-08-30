/* eslint-disable no-console */
const User = require("../models/user");
const Setting = require("../models/setting");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { validationResult, body } = require("express-validator");
const jwt = require("jsonwebtoken"); // to generate signed token
const expressJwt = require("express-jwt"); // for authaurization chek
const { getAllaccess } = require("./user");
const { PASSWORD_RESET_URL } = require("../constants");
const { mailerApi } = require("../mail/api");

const usePasswordHashToMakeToken = ({
  password: passwordHash,
  _id: userId,
  createdAt,
}) => {
  const secret = passwordHash + "-" + createdAt;
  const token = jwt.sign({ userId }, secret, {
    expiresIn: 3600, // 1 hour
  });

  return token;
};

exports.sendPasswordResetEmail = async (req, res) => {
  const { email, settings } = req.params;

  const link =
    (settings.find((item) => item.code === PASSWORD_RESET_URL) || {}).value ||
    "https://librairielbu.net/changement-mot-de-pass";

  let user;
  try {
    user = await User.findOne({ email }).exec();
  } catch (err) {
    res.status(404).json("No user with that email");
  }

  const token = usePasswordHashToMakeToken(user);

  const url = link + "/" + token + "/" + user._id;

  const emailTemplate = resetPasswordTemplate(user, url);

  const sendEmail = () => {
    transporter.sendMail(emailTemplate, (err, info) => {
      if (err) {
        res.status(500).json("Error sending email");
      }
      console.log("** Email sent **", info.response);
    });
  };
  sendEmail();
};

exports.receiveNewPassword = (req, res) => {
  const { userId, token } = req.params;
  const { password } = req.body;
  // highlight-start
  User.findOne({ _id: userId })
    .then((user) => {
      const secret = user.password + "-" + user.createdAt;
      const payload = jwt.decode(token, secret);
      if (payload.userId === user.id) {
        bcrypt.genSalt(10, function(err, salt) {
          // Call error-handling middleware:
          if (err) return;
          bcrypt.hash(password, salt, function(err, hash) {
            // Call error-handling middleware:
            if (err) return;
            User.findOneAndUpdate({ _id: userId }, { password: hash })
              .then(() => res.status(202).json("Password changed accepted"))
              .catch((err) => res.status(500).json(err));
          });
        });
      }
    })
    // highlight-end
    .catch(() => {
      res.status(404).json("Invalid user");
    });
};

const sendResetEmail = async (user, url) => {
  const {  } = user;
  const data = {
    to: user.email,
    subject: "Votre commande",
    html: newOrderMail(order),
    text: "Votre commande sur le site lbu school à été reçue",
    from: "\"Librairie LBU - Zéro Stress\" <yvon.medesse@gmail.com>",
  };
  try {
    await mailerApi(data);
  } catch (error) {
    console.log("send new order mail ", { error });
  }
};


