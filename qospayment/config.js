const MTNWAY = "mtn";
const prefixeMTN = ["97", "96", "67", "66", "61", "62", "69", "90", "91"];
const prefixeMOOV = ["99", "98", "95", "94", "68", "65", "64", "63", "60"];
const MtnClientId = "GroupGMD46";
const MtnClientUserName = "QSUSR129";
const MtnClientPassword = "9Ga3P1u5p03aDod5o6uP";
const mtnTestUrlRequest =
  "http://74.208.84.251/QosicBridge/QosicBridge/user/requestpayment";
const mtnProductionUrlRequest =
  "http://74.208.84.251/prod/QosicBridge/user/requestpayment";
const testStatusUrl =
  "http://74.208.84.251/QosicBridge/QosicBridge/user/gettransactionstatus";
const productionStatusUrl =
  "http://74.208.84.251/prod/QosicBridge/user/gettransactionstatus";

const MOOVWAY = "moov";
const MoovClientId = "GroupGMDMV";
const MoovClientUserName = "QSUSR129";
const MoovClientPassword = "9Ga3P1u5p03aDod5o6uP";
const moovTestUrlRequest =
  "http://74.208.84.251:8221/QosicBridge/user/requestpaymentmv";
const moovProductionUrlRequest =
  "http://74.208.84.251/prod/QosicBridge/user/requestpaymentmv";

const settings = {
  mtn: {
    clientId: MtnClientId,
    userName: MtnClientUserName,
    password: MtnClientPassword,
    requestUrl: mtnProductionUrlRequest,
    transactionStatus: productionStatusUrl,
  },

  mtn_test: {
    clientId: MtnClientId,
    userName: MtnClientUserName,
    password: MtnClientPassword,
    requestUrl: mtnTestUrlRequest,
    transactionStatus: testStatusUrl,
  },

  moov: {
    clientId: MoovClientId,
    userName: MoovClientUserName,
    password: MoovClientPassword,
    requestUrl: moovProductionUrlRequest,
    transactionStatus: productionStatusUrl,
  },

  moov_test: {
    clientId: MoovClientId,
    userName: MoovClientUserName,
    password: MoovClientPassword,
    requestUrl: moovTestUrlRequest,
    transactionStatus: testStatusUrl,
  },
};

const getCurrentConfig = (away) => {
  return away === MTNWAY ? settings.mtn : settings.moov;
};

const checkNetworApiFromPhone = (phone = "") => {
  const code = phone.substring(0, 2);
  if (prefixeMOOV.indexOf(code) !== -1) return MOOVWAY;
  if (prefixeMTN.indexOf(code) !== -1) return MTNWAY;
  return undefined;
};

exports.checkNetworApiFromPhone = checkNetworApiFromPhone;
exports.getCurrentConfig = getCurrentConfig;
