/* eslint-disable no-console */
const { qosRequest, qosCheckStatus } = require("./api");
var btoa = require("btoa");
const AbortController = require("abort-controller");
const { getCurrentConfig, checkNetworApiFromPhone } = require("./config");

const controller = new AbortController();
const timeout = setTimeout(() => {
  controller.abort();
}, 45000);

exports.payment = async (req, res) => {
  const { body, profile } = req;
  const { amount = "1", phone } = body;
  const away = checkNetworApiFromPhone(phone);
  if (!away) {
    return res.status(400).json({ errr: " le Numéro mobile est invalide " });
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
    console.log(result);
    res.json(result);
  } catch (error) {
    console.log("error", error);
    res.status(400).json({ error });
  } finally {
    clearTimeout(timeout);
  }
};

exports.checkStatus = async (req, res) => {
  const { transref, phone } = req.body;
  const away = checkNetworApiFromPhone(phone);
  if (!away) {
    return res.status(400).json({ errr: " le Numéro mobile est invalide " });
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
    res.json({ ...result, date_paid });
  } catch (error) {
    let v = await error.json();
    res.status(400).json({ error: v });
  } finally {
    clearTimeout(timeout);
  }
};
