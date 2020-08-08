/* eslint-disable no-console */
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { ObjectId } = mongoose.Schema;

const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);

const CitySchema = new mongoose.Schema(
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
    code: {
      type: String,
      trim: true,
      index: true,
    },
    cost: {
      type: Number,
      required: true,
      default: 0,
    },

    createBy: { type: ObjectId, ref: "User", required: true },
    updateBy: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true, typePojoToMixed: false }
);

CitySchema.plugin(mongoosePaginate);

CitySchema.index({
  slug: "text",
  code: "text",
});

CitySchema.index({ "slug": -1 });
CitySchema.index({ "code": -1 });

CitySchema.index({ "slug": 1 });
CitySchema.index({ "code": 1 });

module.exports = mongoose.model("City", CitySchema);
