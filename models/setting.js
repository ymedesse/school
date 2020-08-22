const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const crypto = require("crypto");
const uuidv1 = require("uuid/v1");

const settingShema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      trim: true,
      required: true,
    },
    name: {
      type: String,
      unique: true,
      trim: true,
      required: true,
    },
    value: String,
    content: Object,
    createBy: { type: ObjectId, ref: "User", required: true },
    updateBy: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingShema);

settingShema.methods = {
  // permet de verifier si le mot de pass entrer par l'utilisateur correspond à celui dans la base

  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  encryptPassword: function(password) {
    if (!password) return "";

    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },
};

const m = {
  "name": "shipping",
  "content": {
    "address": "5ef7d48759fa3f38d02a6555",
    "otherCost": 1000,
  },
};
