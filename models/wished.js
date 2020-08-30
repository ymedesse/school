const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const wListeSchema = new mongoose.Schema(
  {
    school: {
      type: String,
      required: true,
    },

    classe: {
      type: ObjectId,
      ref: "Classe",
      required: [true, "Vous devez définir une classe"],
    },

    status: {
      type: String,
      default: "pending",
      enum: ["processed", "pending", "canceled"],
    },
    address: String,
    phone: {
      type: String,
      required: true,
    },
    mail: String,
  },
  { timestamps: true }
);

const wishedSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
    },

    phone: {
      type: String,
      required: true,
    },

    listes: {
      type: [wListeSchema],
      default: [],
    },

    updatedBy: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true, typePojoToMixed: false }
);

wishedSchema.index(
  { "listes.classe": 1, "listes.school": 1 },
  { unique: true }
);

wishedSchema.virtual("pendingListes").get(function() {
  const { listes } = this;
  return listes.find((item) => item.status === "pending");
});

module.exports = mongoose.model("Wished", wishedSchema);
