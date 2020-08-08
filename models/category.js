const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const categoryShema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: false,
      trim: true,
      unique: true,
      sparse: true
    },
    name: {
      type: String,
      trim: true
    },

    content: {
      type: Object,
      require: true,
      default: {}
    },
    createBy: { type: ObjectId, ref: "User", required: true },
    updateBy: { type: ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);


module.exports = mongoose.model("Category", categoryShema);
