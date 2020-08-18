/* eslint-disable no-console */
const QrCode = require("../models/qrCode");
const { controllerHelper } = require("../utils/simpleControllerFactory");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { paymentProcessor } = require("./payment");

const { read, update, remove, byId, list } = controllerHelper(
  QrCode,
  "qrCode",
  true
);

exports.create = async (req, res) => {
  const { body, order, profile } = req;
  const { amount } = body;

  try {
    const newQrCode = await generatePaymentQrCode(amount, order, profile);
    res.json(newQrCode);
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
      code: d + profile._id + "%." + order._id + "$$1",
    };

    const qrCode = new QrCode(data);

    qrCode.save(async (err, newQrCode) => {
      if (err) {
        console.log("canot genere new code");

        reject(err);
      }

      if (!err) {
        try {
          await performSetOrderAndPayment(payment, order, profile, qrCode);
          resolve(newQrCode);
        } catch (error) {
          console.log("canot set order and payment from qrCode");
          reject(err);
        }
      }
    });
  });

const performSetOrderAndPayment = async (payment, order, profile, qrCode) =>
  new Promise(async (resolve, reject) => {
    const { amount, method_title } = payment;

    try {
      const validPayment = await generePaymentFromQrCode(profile, {
        method_title,
        qrCode,
        order,
        amount,
      });

      order.payment.push(validPayment._id);
      order.save((error) => {
        if (error) {
          console.log("canot push new qrCode");
          reject(error);
        }

        resolve(true);
      });
    } catch (error) {
      reject(error);
    }
  });

const generePaymentFromQrCode = async (
  profile,
  { method_title, qrCode, order, amount }
) => {
  const data = {
    method_title,
    qrCode: qrCode._id,
    order,
    amount,
    status: {
      id: "pending",
      label: "en attente de paiement",
      rank: 2,
    },
    method: "localPayment",
  };

  return paymentProcessor(profile, data);
};

exports.generatePaymentQrCode = generatePaymentQrCode;
exports.update = update;
exports.read = read;
exports.remove = remove;
exports.qrCodeById = byId;
exports.list = list;
