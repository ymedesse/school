/* eslint-disable no-console */
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { ObjectId } = mongoose.Schema;

const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);

const SchoolSchema = new mongoose.Schema(
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
      index: true,
    },
    address: {
      type: String,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      index: true,
    },
    mail: {
      type: String,
      trim: true,
      index: true,
    },

    image: {
      type: String,
      require: false,
    },
    createBy: { type: ObjectId, ref: "User", required: true },
    updateBy: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true, typePojoToMixed: false }
);

SchoolSchema.plugin(mongoosePaginate);

SchoolSchema.virtual("discount").get(function () {
  console.log(this.createBy);
  return this.createBy;
});


SchoolSchema.index({
  slug: "text",
  phones: "text",
  address: "text",
});

SchoolSchema.index({ "slug": -1 });
SchoolSchema.index({ "phones": -1 });
SchoolSchema.index({ "address": -1 });
SchoolSchema.index({ "slug": 1 });
SchoolSchema.index({ "phones": 1 });
SchoolSchema.index({ "address": 1 });

module.exports = mongoose.model("School", SchoolSchema);
