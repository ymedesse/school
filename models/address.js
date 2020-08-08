const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const addressShema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      maxlength: 254,
    },
    lastName: {
      type: String,
      required: true,
      maxlength: 254,
    },
    description: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    city: {
      type: ObjectId,
      ref: "City",
      required: true,
    },
    postal: String,
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    local: Boolean,
    maps: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressShema);

// const m = {
//   "name": "PLM",
//   "description": " Vous ",
//   "phone": "33556699",
//   "city": {
//     "_id": "5efec8019da57008c4310c14",
//     "cost": 2000,
//     "name": "Bohicon",
//     "code": "Bo",
//     "slug": "bohicon",
//   },
// };
