const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);
mongoose.Schema.Types.String.set("trim", true);

const AssetsSchema = new mongoose.Schema(
  {
    featuredImage: String,
    images: [String],
  },
  { timestamps: false, _id: false }
);

const productSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      slug: "name",
      slug_padding_size: 1,
      unique: true,
      index: true,
      sparse: true,
    },

    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 254,
    },
    description: {
      type: String,
      maxlength: 2000,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      trim: true,
      maxlength: 32,
    },
    sale_price: {
      type: Number,
      required: true,
      trim: true,
      maxlength: 32,
    },
    order_price: {
      type: Number,
      required: true,
      trim: true,
      maxlength: 32,
    },
    assets: { type: AssetsSchema, default: {} },

    stock: {
      type: Number,
      default: 0,
    },

    stock_ordered: {
      type: {
        ordered: { type: Number, default: 0 },
        placed: { type: Number, default: 0 }, // commander chez les fournisseur
      },
    },

    // stock occasion
    usedStock: {
      type: Number,
      default: 0,
    },
    // vendu
    sold: {
      type: Number,
      default: 0,
    },

    image: [String],

    classes: [
      {
        classe: { type: ObjectId, ref: "Classe" },
        code: {
          type: String,
          default: "",
        },
      },
    ],

    schools: [
      {
        school: { type: ObjectId, ref: "School" },
        name: {
          type: String,
          default: "",
        },
      },
    ],

    status: {
      type: String,
      default: "publish",
      enum: ["publish", "draft", "pending", "private"],
    },
    type: {
      type: String,
      default: "root",
      enum: ["root", "variation", "package"],
    },
    isbn: {
      type: String,
      trim: true,
      maxlength: 254,
    },
    tva: {
      type: Number,
      required: true,
      default: 0,
      trim: true,
      maxlength: 32,
    },

    history: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true, typePojoToMixed: false }
);

productSchema.set("toJSON", { virtuals: true });

productSchema.virtual("useByListes", {
  ref: "List", // The model to use
  localField: "_id", // Find people where `localField`
  foreignField: "products.product", // is equal to `foreignField`
  justOne: false,
  match: { "status": "publish" },
});

productSchema.virtual("currentCommande", {
  ref: "Order", // The model to use
  localField: "_id", // Find people where `localField`
  foreignField: "contents.products.id", // is equal to `foreignField`
  justOne: false,
  match: {
    "status.id": "processing",
    type: "commande",
  },
});

productSchema.virtual("currentAchat", {
  ref: "Order", // The model to use
  localField: "_id", // Find people where `localField`
  foreignField: "contents.products.id", // is equal to `foreignField`
  justOne: false,
  match: {
    "status.id": "processing",
    type: "achat",
  },
});

productSchema.virtual("discount").get(function() {
  return calculPourcentage(this.sale_price, this.price, this.tva);
});

productSchema.virtual("ht").get(function() {
  return calculHt(this.price, this.tva);
});

productSchema.plugin(mongoosePaginate);
productSchema.index({
  slug: "text",
  name: "text",
  isbn: "text",
});

productSchema.index({ "slug": -1 });
productSchema.index({ "name": -1 });
productSchema.index({ "isbn": -1 });
productSchema.index({ "slug": 1 });
productSchema.index({ "name": 1 });
productSchema.index({ "isbn": 1 });

module.exports = mongoose.model("Product", productSchema);

const calculPourcentage = (sale_price, price, tva) => {
  const sp = parseInt(sale_price);
  const p = parseInt(price);
  const t = parseInt(tva);
  const pourc = 100 - ((sp - t) * 100) / (p - t);
  return Math.round(pourc);
};

const calculHt = (price, tva) => {
  const p = parseInt(price);
  const t = parseInt(tva);
  return p - t;
};
