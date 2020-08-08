const { factory, shippingDescription } = require("./cartFactory");

const { Cart, cartSchema } = factory("cart", "sale_price");

module.exports = { Cart, cartSchema, shippingDescription };
