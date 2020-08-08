const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const listeSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      maxlength: 2000,
      trim: true,
    },

    products: [
      {
        product: {
          type: ObjectId,
          ref: "Product",
        },
        name: String,
        rank: { type: Number, default: 0 },
        price: Number,
        isbn: String,
      },
    ],

    school: {
      id: {
        type: ObjectId,
        ref: "School",
      },
      name: String,
    },

    classe: {
      id: {
        type: ObjectId,
        ref: "Classe",
      },
      code: String,
    },

    status: {
      type: String,
      default: "publish",
      enum: ["publish", "draft", "pending", "private"],
    },

    createBy: { type: ObjectId, ref: "User", required: true },
    updateBy: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true, typePojoToMixed: false }
);

listeSchema.virtual("amount").get(function () {
  const { products = [] } = this;
  let amount = 0;
  for (let i = 0; i < products.length; i++) {
    const element = products[i];
    amount += element.price;
  }
  return amount;
});

listeSchema.virtual("allProducts").get(function () {
  return (this.products || []).map((item) => item);
});

listeSchema.set("toJSON", { virtuals: true });

listeSchema.plugin(mongoosePaginate);
listeSchema.index({
  "classe.code": "text",
  "school.lastName": "text",
});

listeSchema.index({ "classe.id": 1, "school.id": 1 }, { unique: true });
module.exports = mongoose.model("List", listeSchema);
