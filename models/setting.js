const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const settingShema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      required: true
    },
    content: {
      type: Object
    },
    createBy: { type: ObjectId, ref: "User", required: true },
    updateBy: { type: ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingShema);


const m={
  "name":"shipping",
  "content":{
    "address":"5ef7d48759fa3f38d02a6555",
    "otherCost":1000,
  }
};