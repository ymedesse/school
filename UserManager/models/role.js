const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const levelShema = new mongoose.Schema(
  {
    id: Number,
    label: {
      type: String,
      enum: [
        "désactiver",
        "lecture",
        "lecture, écriture",
        "lecture, écriture et suppression",
      ],
      default: function() {
        return [
          "désactiver",
          "lecture",
          "lecture, écriture",
          "lecture, écriture et suppression",
        ][this.id];
      },
    },
  },
  { timestamps: false, typePojoToMixed: false, _id: false }
);

const roleShema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    permissions: [
      {
        access: {
          type: ObjectId,
          ref: "Access",
        },
        level: levelShema,
      },
    ],

    createBy: { type: ObjectId, ref: "User", required: true },
    updateBy: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true, typePojoToMixed: false }
);

const Role = mongoose.model("Role", roleShema);

module.exports = { Role, levelShema };
