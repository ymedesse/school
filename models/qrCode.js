/* eslint-disable no-console */
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const QrCodeSchema = new mongoose.Schema(
  {
    createdBy: {
      type: ObjectId,
      ref: "User",
    },
    code: {
      type: String,
      required: true,
    },
    dateExpire: Date,
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: Object,
      enum: [
        {
          id: "valid",
          label: "valide",
        },
        {
          id: "expired",
          label: "expiré",
        },
      ],
      default: {
        id: "valid",
        label: "valide",
      },
      require: true,
      index: true,
    },
    order: {
      type: ObjectId,
      ref: "Order",
      index: true,
    },
  },
  { timestamps: true, typePojoToMixed: false }
);

QrCodeSchema.index({
  slug: "text",
});

QrCodeSchema.virtual("expired").get(function() {
  return this.dateExpire < Date.now();
});

QrCodeSchema.set("toJSON", { virtuals: true });
module.exports = mongoose.model("QrCode", QrCodeSchema);
