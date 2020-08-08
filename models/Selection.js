const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const SelectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    products: {
      type: [
        {
          type: ObjectId,
          ref: "Category",
          required: true
        }
      ],
      default: []
    },
    user: { type: ObjectId, ref: "User", required: true }
  },
  { timestamps: true, typePojoToMixed: false }
);

module.exports = mongoose.model("Selection", SelectionSchema);
