/* eslint-disable no-console */
const QrCode = require("../models/qrCode");
const { controllerHelper } = require("../utils/simpleControllerFactory");
const { errorHandler } = require("../helpers/dbErrorHandler");

const { update, remove, byId, list } = controllerHelper(QrCode, "qrCode", true);

exports.create = async (req, res, next) => {
  const { body, order, profile } = req;
  const { payment } = body;

  try {
    const newQrCode = await generatePaymentQrCode(payment, order, profile);
    req.qrCode = newQrCode;
    req.order = order;
    next();
  } catch (error) {
    console.log({ error });
    res.status(400).json({ error: errorHandler(error) });
  }
};

const generatePaymentQrCode = (payment, order, profile) =>
  new Promise((resolve, reject) => {
    const { amount } = payment;

    var d = new Date(Date.now());
    d.setDate(d.getDate() + 1);
    const data = {
      createdBy: profile,
      amount,
      order,
      dateExpire: d,
    };

    const qrCode = new QrCode(data);
    qrCode.code = order._id + qrCode._id;

    qrCode.save(async (err, newQrCode) => {
      if (err) {
        console.log("canot genere new code");

        reject(err);
      }
      resolve(newQrCode);
    });
  });

exports.read = (req, res) => {
  const { code } = req.params;
  if (!code) return res.status(400).json({ error: "code not found" });

  QrCode.findOne({ code })
    .populate({
      path: "order",
      select: " id totalAmount leftToPay  amountPaid status isCancelled",
    })
    .exec((err, resultat) => {
      if (err) return res.status(400).json({ error: errorHandler(err) });
      if (resultat === null || !resultat)
        return res.status(400).json({ error: "qrcode not found" });

      res.json(resultat);
    });
};

exports.generatePaymentQrCode = generatePaymentQrCode;
exports.update = update;
exports.remove = remove;
exports.qrCodeById = byId;
exports.list = list;
