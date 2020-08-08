/* eslint-disable no-console */
const fetch = require("node-fetch");

const qosRequest = async ({ config, body, tooken }) => {
  const { requestUrl } = config;
  return await fetch(requestUrl, {
    method: "post",
    body: JSON.stringify(body),
    ...configSetting(tooken),
    // signal: controller.signal,
  });
};

exports.qosCheckStatus = async ({ config, body, tooken }) => {
  const { transactionStatus } = config;
  return await fetch(transactionStatus, {
    method: "post",
    body: JSON.stringify(body),
    ...configSetting(tooken),
  });
};

const configSetting = (tooken) => ({
  timeout: 45000,
  redirection: "manual",
  httpversion: "1.0",
  sslverify: false,
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Basic " + tooken,
    "Access-Control-Allow-Origin": "*",
    "access-control-allow-credentials": true,
  },
});
exports.qosRequest = qosRequest;
