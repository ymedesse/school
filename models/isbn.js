/* eslint-disable no-console */
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const IsbnSchema = new mongoose.Schema(
  {
    isbn: {
      type: String,
      trim: true,
      unique: true,
      required: true,
      maxlength: 254,
    },
    content: {
      type: ObjectId,
      require: true,
      refPath: "model",
    },

    model: {
      type: String,
      require: true,
    },
    // name, price
  },
  { timestamps: true, typePojoToMixed: false }
);

IsbnSchema.index({
  slug: "text",
});

// populate({ path: 'conversation', model: Conversation }).

IsbnSchema.index({ "isbn": -1 });
IsbnSchema.index({ "isbn": -1 });

module.exports = mongoose.model("Isbn", IsbnSchema);
