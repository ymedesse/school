/* eslint-disable no-console */
const { qosRequest, qosCheckStatus } = require("./api");
var btoa = require("btoa");
const AbortController = require("abort-controller");
const { getCurrentConfig, checkNetworApiFromPhone } = require("./config");
const { paymentProcessor } = require("../controllers/payment");

const controller = new AbortController();
const timeout = setTimeout(() => {
  controller.abort();
}, 45000);

exports.payment = async (req, res) => {
  const { body, profile } = req;
  const { amount = "1", phone } = body;
  const away = checkNetworApiFromPhone(phone);
  if (!away) {
    return res.status(400).json({ error: " le Numéro mobile est invalide " });
  }

  const config = getCurrentConfig(away);
  const { clientId, userName, password } = config;
  const transref = Math.floor(Date.now() / 1000);
  const data = {
    msisdn: "229" + phone,
    amount,
    firstname: profile.lastName || "",
    lastname: profile.firstName || "",
    transref: clientId + transref,
    clientid: clientId,
  };

  const tooken = btoa(userName + ":" + password);

  try {
    let result = await qosRequest({ config, body: data, tooken, controller });
    result = await result.json();
    res.json(result);
  } catch (error) {
    console.log("error", error);
    res.status(400).json({ error });
  } finally {
    clearTimeout(timeout);
  }
};

const checkStatus = async (req, res) => {
  const { profile, body } = req;
  const { transref, phone, amount, method_title } = body;
  const away = checkNetworApiFromPhone(phone);
  if (!away) {
    return res.status(400).json({ error: " le Numéro mobile est invalide " });
  }

  const config = getCurrentConfig(away);
  const { clientId, userName, password } = config;
  const tooken = btoa(userName + ":" + password);
  const data = {
    transref: transref,
    clientid: clientId,
  };

  try {
    const date_paid = Date.now();
    let result = await qosCheckStatus({
      config,
      body: data,
      tooken,
      controller,
      date_paid,
    });

    result = await result.json();
    const { responsecode } = result;
    let payment;

    if (responsecode === "00") {
      payment = await savePayment(profile, result, {
        phone,
        amount,
        method_title,
      });
    }

    res.json({ ...result, payment });
  } catch (error) {
    let v = await error.json();
    res.status(400).json({ error: v });
  } finally {
    clearTimeout(timeout);
  }
};

const savePayment = async (profile, result, initdata) => {
  const { serviceref, responsecode } = result;
  const { phone, amount, method_title } = initdata;
  if (responsecode === "00") {
    try {
      const payment = await paymentProcessor(profile, {
        phone,
        method: "momo",
        amount,
        method_title,
        transaction_id: serviceref,
        transaction: result,
      });

      delete result.date_paid;
      delete result.serviceref;
      delete result.responsemsg;
      return payment;
    } catch (error) {
      console.log("error payment saving", error);
    }
  } else {
    return result;
  }
};
exports.checkStatus = checkStatus;
