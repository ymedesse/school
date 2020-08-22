/* eslint-disable no-console */
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { autoIncrement } = require("../connexion");

const { ObjectId } = mongoose.Schema;
const { shippingDescription } = require("./cart");

const productItemSchema = new mongoose.Schema(
  {
    id: {
      type: ObjectId,
      ref: "Product",
    },
    slug: String,
    name: String,
    price: Number,
    sale_price: Number,
    order_price: Number,
    isbn: String,
    tva: Number,
    discount: Number,
    ht: Number,
    assets: Object,
    quantity: {
      type: Number,
      require: true,
    },
  },
  { timestamps: true, _id: false, typePojoToMixed: false }
);

const orderShippingShema = new mongoose.Schema(
  {
    ...shippingDescription,
    address: Object,
  },
  { timestamps: true, _id: false, typePojoToMixed: false }
);

const orderContentItemSchema = new mongoose.Schema(
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
      type: {
        id: {
          type: ObjectId,
          ref: "Classe",
        },
        name: String,
        code: String,
      },
    },

    school: {
      type: {
        id: {
          type: ObjectId,
          ref: "School",
        },
        name: String,
        slug: String,
      },
    },

    total: { type: Number, default: 0 },
    products: [productItemSchema],
  },
  { timestamps: true, _id: false, typePojoToMixed: false }
);

// const paymentSchema = new mongoose.Schema(
//   {
//     phone: {
//       type: String,
//       required: false,
//     },
//     method: {
//       type: String,
//       enum: ["localPayment", "momo", "bankTransfer"],
//     },
//     status: {
//       type: Object,
//       enum: [
//         {
//           id: "validated",
//           label: "valide",
//           rank: 1,
//         },
//         {
//           id: "pending",
//           label: "En attente",
//           rank: 1,
//         },
//         {
//           id: "refunded",
//           label: "Remboursée",
//           rank: 0,
//         },
//       ],
//       default: {
//         id: "validated",
//         label: "valide",
//         rank: 1,
//       },
//       require: true,
//       index: true,
//     },
//     date_paid: {
//       type: Date,
//       require: true,
//       index: 1,
//     },
//     amount: {
//       type: Number,
//       require: true,
//       default: 0,
//     },
//     paymentId: {
//       type: ObjectId,
//       ref: "Payment",
//     },
//     method_title: String,
//     transaction_id: String,
//     transaction: Object,
//   },
//   { timestamps: true, typePojoToMixed: false }
// );

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
    },
    shipping: orderShippingShema,
    contents: {
      type: [orderContentItemSchema],
      require: true,
      default: [],
    },

    cart: {
      type: {
        id: {
          type: ObjectId,
          ref: "Cart",
        },
        tva: Number,
        price: Number,
        sale_price: Number,
        ht: Number,
        discount: Number,
        count: Number,
        total: Number,
      },
    },

    commande: {
      type: {
        id: {
          type: ObjectId,
          ref: "Commande",
        },
        tva: Number,
        price: Number,
        sale_price: Number,
        ht: Number,
        discount: Number,
        count: Number,
        total: Number,
      },
    },

    localStatus: {
      type: Object,
      enum: [
        {
          id: "pending",
          label: "En attente de préparation",
          rank: 0,
        },

        {
          id: "preparation",
          label: "En cours de préparation",
          rank: 1,
        },
        {
          id: "prepare",
          label: "Préparée",
          rank: 1,
        },
      ],
      default: {
        id: "pending",
        label: "En attente de préparation",
        rank: 0,
      },
      require: true,
      index: true,
    },

    completedDate: Date,
    status: {
      type: Object,
      enum: [
        {
          id: "processing",
          label: "en traitement",
          rank: 1,
        },
        {
          id: "pending",
          label: "En attente de paiement",
          rank: 0,
        },
        {
          id: "shipped",
          label: "Expédiée",
          rank: 3,
        },
        {
          id: "delivered",
          label: "Livrée",
          rank: 3,
        },
        {
          id: "refunded",
          label: "Remboursée",
          rank: 0,
        },
        {
          id: "failed",
          label: "Echouée",
          rank: 0,
        },
        {
          id: "trash",
          label: "Supprimée",
          rank: 0,
        },
        {
          id: "cancelled",
          label: "Annulée",
          rank: 3,
        },
      ],
      default: {
        id: "processing",
        label: "en traitement",
        rank: 0,
      },
      require: true,
      index: true,
    },
    payment: {
      type: [
        {
          type: ObjectId,
          ref: "Payment",
        },
      ],
      default: [],
    },

    customerData: {
      type: {
        lastName: String,
        firstName: String,
        phone: String,
        email: String,
        id: String,
      },
    },
    amountPaid: Number,
    totalAmount: {
      type: Number,
      require: true,
      default: 0,
    },
    updatedBy: { type: ObjectId, ref: "User", required: true },
    notes: [String],
    count: Number,
    type: {
      type: String,
      enum: ["achat", "commande"],
      default: "achat",
      require: true,
    },
    createdBy: {
      type: ObjectId,
      ref: "User",
      required: true,
      default: this.updateBy,
    },
    expireAt: {
      type: Date,
      required: true,
      default: function() {
        // 60 seconds from now
        console.log(" exoitre *****", this);
        return new Date(Date.now() + 60 * 60 * 24);
      },
    },
  },
  { timestamps: true, typePojoToMixed: false }
);

OrderSchema.index(
  { expireAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { "status.id": "pending" } }
);

OrderSchema.plugin(autoIncrement.plugin, {
  model: "Order",
  field: "id",
  startAt: 0,
});

OrderSchema.virtual("leftToPay").get(function() {
  const { totalAmount, amountPaid } = this;
  const val = (parseInt(totalAmount) || 0) - (parseInt(amountPaid) || 0);
  return val;
});

OrderSchema.virtual("paymentsCount").get(function() {
  return (this.payment || []).length;
});

OrderSchema.virtual("cancellable").get(function() {
  const { status, amountPaid } = this;
  return status.id === "pending" && (parseInt(amountPaid) || 0) === 0;
});

OrderSchema.virtual("isCancelled").get(function() {
  const { status } = this;
  return status.id === "cancelled";
});

OrderSchema.set("toJSON", { virtuals: true });

OrderSchema.plugin(mongoosePaginate);

OrderSchema.virtual("qrCodes", {
  ref: "QrCode", // The model to use
  localField: "_id", // Find people where `localField`
  foreignField: "order", // is equal to `foreignField`
  justOne: false,
});

OrderSchema.index({
  number: "text",
  id: "text",
  "customerData.lastName": "text",
  "customerData.firstName": "text",
  "customerData.phone": "text",
  "shipping.firstName": "text",
  "shipping.lastName": "text",
});

OrderSchema.index({ "total": -1 });
OrderSchema.index({ "total": 1 });
OrderSchema.index({ "shipping.firstName": 1 });
OrderSchema.index({ "shipping.lastName": -1 });
OrderSchema.index({ "customerData.phone": -1 });
OrderSchema.index({ "customerData.phone": 1 });
OrderSchema.index({ "customerData.firstName": -1 });
OrderSchema.index({ "customerData.firstName": 1 });
OrderSchema.index({ "createAt": -1 });
OrderSchema.index({ "createAt": 1 });

const Order = mongoose.model("Order", OrderSchema);

module.exports = { Order };

// eslint-disable-next-line no-unused-vars
