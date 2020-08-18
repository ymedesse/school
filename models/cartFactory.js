const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
// const { calculPourcentage } = "../utils.js";

const productItemSchema = new mongoose.Schema(
  {
    product: {
      type: ObjectId,
      ref: "Product",
    },
    quantity: {
      type: Number,
      require: true,
    },
  },
  { timestamps: true, _id: false, typePojoToMixed: false }
);

const shippingDescription = {
  method: {
    type: String,
    required: true,
    enum: ["local", "remote"],
    default: "local",
  },
  method_title: {
    type: String,
    required: [true, "Vous devez définir une méthode de livraison"],
    trim: true,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  address: {
    type: ObjectId,
    ref: "Address",
  },
  note: String,
};

const shippingShema = new mongoose.Schema(
  { ...shippingDescription },
  { timestamps: true, _id: false, typePojoToMixed: false }
);

const contentItemSchema = new mongoose.Schema(
  {
    list: {
      type: ObjectId,
      ref: "List",
      required: false,
    },
    names: {
      type: {
        firstName: String,
        lastName: String,
        birthday: Date,
      },
    },
    classe: {
      type: ObjectId,
      ref: "Classe",
    },
    school: {
      type: ObjectId,
      ref: "School",
    },
    total: { type: Number, default: 0 },
    products: [productItemSchema],
  },
  { timestamps: true, typePojoToMixed: false }
);

/***** */
const factory = (collectionName = "Cart") => {
  contentItemSchema.virtual("totalDetail").get(function async() {
    let tva = 0,
      price = 0,
      sale_price = 0,
      order_price = 0,
      ht = 0,
      count = 0,
      total = 0,
      total_order = 0;

    const { products = [] } = this;
    for (let i = 0; i < products.length; i++) {
      const element = products[i];
      const { product = {}, quantity = 0 } = element;
      const {
        tva: itva = 0,
        price: iprice = 0,
        sale_price: isaleprice = 0,
        order_price: iorderPrice = 0,
        ht: iht = 0,
      } = product;

      tva += itva * quantity;
      price += quantity * iprice;
      sale_price += quantity * isaleprice;
      order_price += quantity * iorderPrice;
      ht += quantity * iht;
      count += quantity;
      total += quantity * isaleprice;
      total_order += quantity * iorderPrice;
    }

    const discount =
      collectionName === "cart"
        ? calculDiscountMontant(sale_price, price, tva)
        : 0;
    const val = {
      tva,
      price,
      sale_price,
      order_price,
      ht,
      count,
      total,
      total_order,
      discount,
    };

    // console.log({ val });
    return val;
  });

  contentItemSchema.set("toJSON", { virtuals: true });

  const cartSchema = new mongoose.Schema(
    {
      contents: [contentItemSchema],
      session: String,
      count: Number,
      total: { type: Number },
      status: {
        type: String,
        default: "active",
        enum: ["active", "unactive", "complete"], // enum means string objects
      },
      user: { type: ObjectId, ref: "User" },
      shipping: shippingShema,
    },
    { timestamps: true }
  );

  cartSchema.virtual("totalDetail").get(function() {
    const totals = this.contents.map((item) => item.totalDetail);

    let tva = 0,
      price = 0,
      sale = 0,
      ht = 0,
      count = 0,
      total = 0;

    // total: 10000,
    // products: [Array],
    // _id: 5f0afc0d9aa8332210bf4d5d,
    // createdAt: 2020-07-12T12:03:26.130Z,
    // updatedAt: 2020-07-14T11:49:01.357Z } ] }

    const isCommande = collectionName === "Commande";
    const field = isCommande ? "order_price" : "sale_price";

    for (let i = 0; i < totals.length; i++) {
      const element = totals[i];
      tva += element.tva;
      price += element.price;
      sale += element[`${field}`] || 0;

      ht += element.ht;
      count += element.count;
      total += element[`${field}`] || 0;
    }

    const discount =
      collectionName === "cart" ? calculDiscountMontant(sale, price, tva) : 0;

    return {
      tva,
      price: isCommande ? sale : price,
      [`${field}`]: sale,
      ht,
      discount,
      count,
      total,
    };
  });

  cartSchema.virtual("totalAmount").get(function() {
    const { total, shipping = {} } = this;
    const val = (parseInt(total) || 0) + (parseInt(shipping.total) || 0);
    return val;
  });

  // cartSchema.virtual("products").get(function () {
  //   const { contents } = this;
  //   const all = [];
  //   for (let i = 0; i < contents.length; i++) {
  //     const content = contents[i];
  //     const { products } = content;
  //     for (let i = 0; i < products.length; i++) {
  //       const element = products[i];
  //       all.push(element);
  //     }
  //   }
  //   return all;
  // });

  cartSchema.set("toJSON", { virtuals: true });

  const Cart = mongoose.model(collectionName, cartSchema);

  //   module.exports = { Cart, shippingDescription, cartSchema };

  const calculDiscountMontant = (sale, price, tva) => {
    const sp = parseInt(sale);
    const p = parseInt(price);
    const t = parseInt(tva);
    const mount = p + t - sp;
    return Math.round(mount);
  };

  return { Cart, cartSchema };
};

module.exports = { factory, shippingDescription };
