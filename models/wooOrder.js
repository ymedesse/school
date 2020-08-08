/* eslint-disable no-console */
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { ObjectId } = mongoose.Schema;

const wooOrderSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      require: true,
    },
    number: Number,
    customer_note: String,
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "on-hold",
        "completed",
        "cancelled",
        "refunded",
        "failed",
        "trash",
      ],
      default: "pending",
      require: true,
      index: true,
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
        {
          id: "dispatch",
          label: "Expédiée",
          rank: 3,
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

    date_created: {
      type: Date,
      require: true,
      index: 1,
    },
    date_created_gmt: {
      type: Date,
      require: true,
    },
    date_modified: Date,
    date_modified_gmt: Date,
    line_items: { type: [Object], default: [] },
    customer: {
      type: ObjectId,
      ref: "Customer",
    },
    itemsCount: {
      type: Number,
      default: 0,
    },
    customer_data: {
      first_name: String,
      last_name: String,
      email: String,
    },
    discount_total: {
      type: Number,
      require: true,
      default: 0,
    },
    shipping_total: {
      type: Number,
      default: 0,
      require: true,
    },
    shipping_tax: Number,
    cart_tax: Number,
    total: {
      type: Number,
      require: true,
      index: 1,
    },
    shipping_lines: [Object],
    total_tax: Number,
    prices_include_tax: Number,
    customer_id: {
      type: Number,
      require: true,
      default: 0,
    },
    customer_ip_address: String,
    billing: {
      type: {
        first_name: String,
        last_name: String,
        company: String,
        address_1: String,
        address_2: String,
        city: String,
        state: String,
        postcode: String,
        country: String,
        email: String,
        phone: String,
      },
    },
    shipping: {
      type: {
        first_name: String,
        last_name: String,
        company: String,
        address_1: String,
        address_2: String,
        city: String,
        state: String,
        postcode: String,
        country: String,
      },
      require: true,
    },
    payment_method: String,
    payment_method_title: String,
    transaction_id: Number,
    date_paid: Date,
    date_paid_gmt: Date,
    date_completed: Date,
    date_completed_gmt: Date,
    details: Object,
    createBy: {
      type: ObjectId,
      ref: "User",
      required: true,
      default: this.updateBy,
    },
    updateBy: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true, typePojoToMixed: false }
);

wooOrderSchema.set("toJSON", { virtuals: true });

wooOrderSchema.plugin(mongoosePaginate);

wooOrderSchema.index({
  number: "text",
  id: "text",
  "customer_data.last_name": "text",
  "customer_data.first_name": "text",
  "billing.email": "text",
  "billing.phone": "text",
  "shipping.first_name": "text",
  "shipping.last_name": "text",
});

wooOrderSchema.index({ "total": -1 });
wooOrderSchema.index({ "total": 1 });
wooOrderSchema.index({ "shipping.first_name": 1 });
wooOrderSchema.index({ "shipping.last_name": -1 });
wooOrderSchema.index({ "billing.phone": -1 });
wooOrderSchema.index({ "billing.phone": 1 });
wooOrderSchema.index({ "billing.first_name": 1 });
wooOrderSchema.index({ "billing.last_name": 1 });
wooOrderSchema.index({ "date_created": -1 });
wooOrderSchema.index({ "date_created": 1 });

const Order = mongoose.model("wooOrder", wooOrderSchema);

const extractableFields = [
  "id",
  "number",
  "status",
  "line_items",
  "date_created",
  "date_created_gmt",
  "date_modified",
  "date_modified_gmt",
  "discount_total",
  "shipping_total",
  "shipping_tax",
  "cart_tax",
  "total",
  "total_tax",
  "shipping_lines",
  "prices_include_tax",
  "customer_id",
  "customer_ip_address",
  "customer_user_agent",
  "customer_note",
  "billing",
  "shipping",
  "payment_method",
  "payment_method_title",
  "transaction_id",
  "date_paid",
  "date_paid_gmt",
  "date_completed",
  "date_completed_gmt",
];
module.exports = { extractableFields, Order };

// eslint-disable-next-line no-unused-vars
