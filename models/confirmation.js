/* eslint-disable no-console */
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const ConfirmationSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },

    user: {
      type: ObjectId,
      res: "User",
    },

    subject: {
      type: ObjectId,
    },
    // name, price
  },
  { timestamps: true, typePojoToMixed: false }
);

module.exports = mongoose.model("Isbn", ConfirmationSchema);
