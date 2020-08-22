/* eslint-disable no-console */
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const PaymentSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [
        () => {
          return this.method === "momo";
        },
        "user phone is required",
      ],
    },
    method: {
      type: String,
      enum: ["localPayment", "momo", "bankTransfer"],
    },

    status: {
      type: Object,
      enum: [
        {
          id: "validated",
          label: "valide",
          rank: 1,
        },
        {
          id: "pending",
          label: "en attente de paiement",
          rank: 2,
        },
        {
          id: "refunded",
          label: "Remboursée",
          rank: 0,
        },
      ],
      default: {
        id: "validated",
        label: "valide",
        rank: 1,
      },
      require: true,
      index: true,
    },

    datePaid: Date,

    order: {
      type: ObjectId,
      ref: "Order",
    },

    qrCode: {
      type: ObjectId,
      ref: "QrCode",
      required: [
        () => {
          return this.method === "localPayment";
        },
        "qr-code is required",
      ],
      unique: true,
      sparse: true,
    },

    confirmation: {
      type: ObjectId,
      ref: "Confirmation",
      required: [
        () => {
          return this.method === "localPayment";
        },
        "confirmation is required",
      ],
    },

    customerData: {
      type: {
        lastName: String,
        firstName: String,
        phone: String,
        email: String,
        id: String,
      },
    },

    payerData: {
      type: {
        lastName: String,
        firstName: String,
        phone: String,
        email: String,
      },

      required: [
        () => {
          return this.method === "localPayment";
        },
        "payer data is required",
      ],
    },

    amount: {
      type: Number,
      require: true,
      default: 0,
    },

    method_title: String,
    transaction_id: String,
    transaction: Object,
    user: { type: ObjectId, ref: "User", required: true },
    cashier: { type: ObjectId, ref: "User", required: false },
    updatedBy: { type: ObjectId, ref: "User", required: true },
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
