const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const methodsShema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      required: true,
    },
    details: {
      type: Object,
    },
    eneable: {
      type: Boolean,
      default: true,
    },
    createBy: { type: ObjectId, ref: "User", required: true },
    updateBy: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentMethod", methodsShema);
