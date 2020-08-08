const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);
mongoose.Schema.Types.String.set("trim", true);

const FileSchema = new mongoose.Schema(
  {
    img: {
      data: Buffer,
      contentType: String,
    },
    name: {
      type: String,
      required: false,
    },
    id: {
      type: String,
      slug: "name",
      slug_padding_size: 1,
      unique: true,
      index: true,
      sparse: true,
    },
    size: {
      type: Number,
      required: false,
    },
    type: { type: String, required: true, default: "img" },
    user: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);


FileSchema.index({ "slug": -1 });
FileSchema.index({ "name": -1 });

FileSchema.index({ "slug": 1 });
FileSchema.index({ "name": 1 });
const File = mongoose.model("File", FileSchema);

module.exports = File;
