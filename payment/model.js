/* eslint-disable no-console */
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { ObjectId } = mongoose.Schema;

const PaymentSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: false,
    },
    method: {
      type: String,
      enum: ["local", "momo", "bankTransfer"],
    },
    date_paid: {
      type: Date,
      require: true,
      default: Date.now(),
      index: 1,
    },
    amount: {
      type: Number,
      require: true,
      default: 0,
      index: true,
    },
    method_title: String,
    user: {
      type: ObjectId,
      ref: "User",
    },
    customerData: {
      type: {
        lastName: String,
        firstName: String,
        phone: String,
      },
    },
    order: {
      type: ObjectId,
      ref: "Order",
    },
    createddBy: {
      type: ObjectId,
      ref: "User",
      required: true,
      default: this.updateBy,
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
    transaction_id: String,
    transaction: Object,
  },
  { timestamps: true, typePojoToMixed: false }
);

PaymentSchema.set("toJSON", { virtuals: true });

PaymentSchema.plugin(mongoosePaginate);

PaymentSchema.index({
  number: "text",
  id: "text",
  "customerData.lastName": "text",
  "customerData.firstName": "text",
  "customerData.phone": "text",
});

PaymentSchema.index({ "customerData.phone": -1 });
PaymentSchema.index({ "customerData.phone": 1 });
PaymentSchema.index({ "customerData.firstName": -1 });
PaymentSchema.index({ "customerData.firstName": 1 });
PaymentSchema.index({ "createAt": -1 });
PaymentSchema.index({ "createAt": 1 });
PaymentSchema.index({ "amount": -1 });

const Order = mongoose.model("Payment", PaymentSchema);

module.exports = { Order };

// eslint-disable-next-line no-unused-vars
