/* eslint-disable no-console */
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { ObjectId } = mongoose.Schema;

const CustomerSchema = new mongoose.Schema(
  {
    id: {
      type: String,
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
    email: String,
    first_name: String,
    last_name: String,
    role: String,
    username: String,
    avatar_url: String,
    details: Object,

    updateBy: { type: ObjectId, ref: "User", required: true },
    createBy: {
      type: ObjectId,
      ref: "User",
      required: true,
      default: this.updateBy,
    },
  },
  { timestamps: true, typePojoToMixed: false }
);

CustomerSchema.plugin(mongoosePaginate);

CustomerSchema.index({
  email: "text",
  id: "text",
  first_name: "text",
  last_name: "text",
  username: "text",
});

CustomerSchema.index({ "email": 1 });
CustomerSchema.index({ "id": 1 });
CustomerSchema.index({ "first_name": 1 });
CustomerSchema.index({ "last_name": 1 });
CustomerSchema.index({ "username": 1 });
CustomerSchema.index({ "email": -1 });
CustomerSchema.index({ "id": -1 });
CustomerSchema.index({ "first_name": -1 });
CustomerSchema.index({ "last_name": -1 });
CustomerSchema.index({ "username": -1 });

const Customer = mongoose.model("Customer", CustomerSchema);

const extractableFields = [
  "id",
  "date_created",
  "date_created_gmt",
  "date_modified",
  "date_modified_gmt",
  "email",
  "first_name",
  "last_name",
  "role",
  "username",
  "avatar_url",
];
module.exports = { extractableFields, Customer };
