/* eslint-disable no-console */
const Payment = require("../models/payment");
const { controllerHelper } = require("../utils/simpleControllerFactory");
const { setObjectArray } = require("../utils");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { convertStringNumber } = require("../utils");
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

    data.datePaid = Date.now();

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

exports.submitFromQrcode = async (req, res, next) => {
  const { qrCode, order, body, profile } = req;
  const { payerData, selfPayer, amount } = body;

  if (convertStringNumber(qrCode.amount) !== convertStringNumber(amount)) {
    return sendError(res, "Montant invalide");
  }

  if (!selfPayer && !payerData) {
    return sendError(res, "Vous devez spécifier la information du payeur");
  }

  if (!order)
    return sendError(res, "Aucune commande n'est liée au qrcode fourni");

  if (["processing", "pending"].indexOf(order.status.id) === -1)
    return sendError(
      res,
      "La commande concerné ne plus être sujet d'un quelconque paiement"
    );

  if (qrCode.expired || qrCode.status.id === "used") {
    return sendError(res, "Le Qrcode fournit n'est plus utilisable");
  }

  try {
    const payment = await getPaymentFormCode(qrCode);

    payment.status = {
      id: "validated",
      label: "valide",
      rank: 1,
    };

    payment.payerData = selfPayer ? { ...payment.customerData } : payerData;
    payment.updatedBy = profile;

    payment.datePaid = Date.now();
    payment.cashier = profile;
    qrCode.status = { id: "used", label: "utilisé" };

    const newPayment = await paymentSaver(
      payment /*, sendNewOrderPaymentEmail*/
    );

    req.payment = newPayment;
    req.order = order;
    req.qrCode = qrCode;

    next();
  } catch (error) {
    console.log({ error });
    return res.status(400).json({ error });
  }
};

exports.finalisePaymentFromCode = async (req, res) => {
  const { qrCode, order, payment } = req;
  try {
    qrCode.status = {
      id: "used",
      label: "utilisé",
    };

    const newQrCode = await saveQrcode(qrCode);

    res.json({
      success: "Paiement effectué avec succès",
      order,
      payment,
      qrCode: newQrCode,
    });
  } catch (error) {
    console.log({ error });
    sendError(res, errorHandler(error));
  }
};

const saveQrcode = (qrCode) =>
  new Promise((resolve, reject) =>
    qrCode.save((err, result) => {
      if (err) {
        console.log("error in starp save qrcode");
        reject(err);
      }
      !err && resolve(result);
    })
  );

const getPaymentFormCode = (qrCode) =>
  new Promise((resolve, reject) => {
    Payment.findOne({ qrCode: qrCode._id, "status.id": "pending" }).exec(
      (error, payment) => {
        if (error) {
          reject(errorHandler(error));
          console.log({ error });
        }

        if (!payment || payment === null) reject("Paiement invalide");
        resolve(payment);
      }
    );
  });

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
    .populate({ path: "qrCode", select: "code amount expired status" })
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
      order.payment = setObjectArray(order.payment);

      order.save((error) => {
        if (error) {
          console.log("canot push new qrCode");
          reject(error);
        }

        resolve({ order, payment: validPayment });
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

  return await paymentProcessor(profile, data);
};

exports.setSimpleNewCodeToOrderPayment = async (req, res) => {
  const { body, order, profile, qrCode } = req;
  const { payment } = body;

  try {
    await performSetOrderAndPayment(payment, order, profile, qrCode);
    res.json(qrCode);
  } catch (error) {
    console.log({ error });
    res.status(400).json({ error: errorHandler(error) });
  }
};
const sendError = (res, message) => {
  return res.status(400).json({
    error: message,
  });
};

exports.performSetOrderAndPayment = performSetOrderAndPayment;
exports.generePaymentFromQrCode = generePaymentFromQrCode;
exports.paymentProcessor = paymentProcessor;
exports.update = update;
exports.read = read;
exports.remove = remove;
exports.paymentById = byId;
exports.list = list;
