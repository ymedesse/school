/* eslint-disable no-console */
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const PaymentSchema = new mongoose.Schema(
  {
    panier: { type: Object, required: true },
    methods: [Object],
    payer: {
      type: Number,
      required: true,
    },
    relicat: {
      type: Number,
      default: 0,
    },
    ttc: {
      type: Number,
      required: true,
    },
    ht: {
      type: Number,
      required: true,
    },
    caisse: Number,
    remise: {
      type: Number,
      default: 0,
    },
    localId: String,
    type: {
      type: String,
      enum: ["in", "out"],
      default: "in",
    },
    status: {
      type: String,
      enum: ["valid", "removed", "canceled"],
      default: "valid",
    },
    count: {
      type: Number,
      default: 0,
    },
    userLocalId: String,
    createBy: { type: ObjectId, ref: "User", required: true },
    updateBy: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true, typePojoToMixed: false }
);

PaymentSchema.plugin(mongoosePaginate);
PaymentSchema.index({
  "type": "text",
  "localId": "text",
  "panier.client.tel": "text",
  "panier.client.nomClient": "text",
  "panier.client.type": "text",
  "panier.content.nomArticle": "text",
  "panier.content.codebare": "text",
  "panier.content.idOriginal": "text",
});

PaymentSchema.index({ "type": -1 });
PaymentSchema.index({ "type": 1 });
PaymentSchema.index({ "localId": -1 });
PaymentSchema.index({ "localId": 1 });

PaymentSchema.index({ "panier.client.tel": 1 });
PaymentSchema.index({ "panier.client.nomClient": 1 });
PaymentSchema.index({ "panier.client.type": 1 });
PaymentSchema.index({ "panier.content.nomArticle": 1 });
PaymentSchema.index({ "panier.content.codebare": 1 });
PaymentSchema.index({ "panier.content.idOriginal": 1 });

PaymentSchema.index({ "panier.client.tel": -1 });
PaymentSchema.index({ "panier.client.nomClient": -1 });
PaymentSchema.index({ "panier.client.type": -1 });
PaymentSchema.index({ "panier.content.nomArticle": -1 });
PaymentSchema.index({ "panier.content.codebare": -1 });
PaymentSchema.index({ "panier.content.idOriginal": -1 });
module.exports = mongoose.model("Payment", PaymentSchema);
