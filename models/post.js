/* eslint-disable no-console */
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { ObjectId } = mongoose.Schema;

const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);

const PostSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: false,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      index: true,
    },
    fullPath: String,
    slug: {
      type: String,
      slug: "name",
      slug_padding_size: 4,
      unique: true,
      sparse: true,
    },

    content: {
      type: Object,
      require: true,
      default: {},
      index: true,
    },
    createBy: { type: ObjectId, ref: "User", required: true },
    updateBy: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true, typePojoToMixed: false }
);

PostSchema.plugin(mongoosePaginate);
PostSchema.index({
  id: "text",
  // slug: "text",
  "content.name": "text",
  "content.sku": "text",
  "content.id": "text",
  "content.ugs": "text",
  // "content.short_description": "text",
  // "content.categories": "text",
  // "content.regular_price": "text",
  // "content.sale_price": "text"
});

PostSchema.index({ "name": -1 });
PostSchema.index({ "name": 1 });
PostSchema.index({ "id": -1 });
PostSchema.index({ "content.regular_price": 1 });
PostSchema.index({ "content.regular_price": -1 });
PostSchema.index({ "content.stock_quantity": -1 });
PostSchema.index({ "content.stock_quantity": 1 });
PostSchema.index({ "content.stock_status": -1 });
PostSchema.index({ "content.stock_status": 1 });
PostSchema.index({ "content.instock": -1 });
PostSchema.index({ "content.instock": 1 });
PostSchema.index({ "content.status": 1 });
PostSchema.index({ "content.status": -1 });
PostSchema.index({ "name": -1 });
PostSchema.index("content.categories");

// PostSchema.post("validate", function(doc) {
//   console.log({ doc });
// });

PostSchema.post("save", function(doc) {
  const slug = doc.get("slug");
  const id = doc.get("id");
  if (!id) {
    console.log({ id, slug });
    doc.set("id", slug);
  }
});

module.exports = mongoose.model("Post", PostSchema);

// req.body.slug = newSlug;
// req.body.id = newSlug;
// req.body.content.id = newSlug;
