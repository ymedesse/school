const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const wooApi = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL,
  consumerKey: process.env.WOOCOMMERCE_KEY,
  consumerSecret: process.env.WOOCOMMERCE_SECRET,
  version: "wc/v3",
  queryStringAuth: true,
});

exports.wooApi = wooApi;
