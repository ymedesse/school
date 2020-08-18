/* eslint-disable no-console */
const Payment = require("../models/payment");
const { controllerHelper } = require("../utils/simpleControllerFactory");

const { errorHandler } = require("../helpers/dbErrorHandler");

const { read, update, remove, byId, list } = controllerHelper(
  Payment,
  "payment",
  true
);

exports.create = async (req, res) => {
  const { profile, body } = req;
  try {
    const payment = await paymentProcessor(profile, body);
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.linkPaymentToOrder = (payment, order) =>
  new Promise((resolve, reject) => {
    payment.order = order._id;

    payment.save((err) => {
      err && reject(err);
      !err && resolve(true);
    });
  });

/**
 *
 * @param {Object} profile
 * @param {*} param1  phone, method, status, order, qrCode, confirmation, customerData, payerData, amount, method_title, transaction_id,transaction}
 */

const paymentProcessor = async (profile, { method, ...data }) =>
  new Promise(async (resolve, reject) => {
    const isMomo = method === "momo";
    data.customerData = await formatUser(profile);
    data.payerData = isMomo ? data.customerData : data.payerData;

    data.updatedBy = profile;
    data.user = profile;

    data.method = method;
    const payment = new Payment(data);

    try {
      const newPayment = await paymentSaver(
        payment // sendNewOrderPaymentEmail
      );
      resolve(newPayment);
    } catch (error) {
      reject(error);
    }
  });

const paymentSaver = (payment, mailSender) =>
  new Promise((resolve, reject) => {
    payment.save(async (err, newPayment) => {
      err && reject(err);
      if (!err) {
        mailSender && (await mailSender(newPayment));
        resolve(newPayment);
      }
    });
  });

const formatUser = async (user = {}) => {
  const { lastName, firstName, phone, email, id } = user;
  return { lastName, firstName, phone, email, id };
};

exports.checkPayment = (req, res, next) => {
  const { payment } = req.body;
  if (payment.method === "momo") {
    Payment.findById(payment._id).exec((err, paymentData) => {
      if (err) return res.status(400).json({ error: "Invalid payment" });
      req.body.payment = paymentData;
      next();
    });
  } else next();
};

exports.paymentsByOrder = (req, res) => {
  const { order, profile } = req;
  const { totalAmount, amountPaid } = order;
  Payment.find({ order, user: profile })
    .populate({ path: "qrCode", select: "code amount expired" })
    .exec(async (err, payment) => {
      if (err) {
        return res.status(400).json({ error: errorHandler(err) });
      }
      const leftToPay =
        (parseInt(totalAmount) || 0) - (parseInt(amountPaid) || 0);
      const paymentsSorted = await sortPaymentList(payment);
      res.json({
        ...order._doc,
        payment: paymentsSorted,
        leftToPay,
      });
    });
};

const sortPaymentList = (payment) => {
  return payment.sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};
exports.paymentsByUser = (req, res) => {
  const { profile } = req;
  Payment.find({ user: profile }).exec((err, payments) => {
    if (err) {
      return res.status(400).json({ error: errorHandler(err) });
    }
    res.json(payments);
  });
};

exports.paymentProcessor = paymentProcessor;
exports.update = update;
exports.read = read;
exports.remove = remove;
exports.paymentById = byId;
exports.list = list;
