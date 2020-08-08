const { factory, shippingDescription } = require("./cartFactory");

const { Cart: Commande, cartSchema } = factory("Commande", "order_price");
module.exports = { Commande, cartSchema, shippingDescription };
