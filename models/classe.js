/* eslint-disable no-console */
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { ObjectId } = mongoose.Schema;

const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);

const ClasseSchema = new mongoose.Schema(
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

    createBy: { type: ObjectId, ref: "User", required: true },
    updateBy: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true, typePojoToMixed: false }
);

ClasseSchema.plugin(mongoosePaginate);

ClasseSchema.index({
  slug: "text",
  code: "text",
});



ClasseSchema.index({ "slug": -1 });
ClasseSchema.index({ "code": -1 });

ClasseSchema.index({ "slug": 1 });
ClasseSchema.index({ "code": 1 });

module.exports = mongoose.model("Classe", ClasseSchema);
