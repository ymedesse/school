const mongoose = require("mongoose");
const crypto = require("crypto");
const uuidv1 = require("uuid/v1");
const { ObjectId } = mongoose.Schema;
const { levelShema } = require("../UserManager/models/role");
const { autoIncrement } = require("../connexion");

const UserHistoryItem = new mongoose.Schema(
  {
    bags: {
      type: Array,
      default: [],
    },
    orders: {
      type: Array,
      default: [],
    },
    addressesDropped: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true, _id: false }
);

// const UserHistory = mongoose.model("UserHistory", UserHistoryItem);

const userSchema = new mongoose.Schema(
  {
    lastName: {
      type: String,
      trim: true,
      required: true,
      maxlength: 254,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: 254,
    },
    nomAfficher: {
      type: String,
      trim: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 254,
    },
    address: {
      type: ObjectId,
      ref: "Address",
      required: false,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    hashed_password: {
      type: String,
      required: false,
    },
    lastActive: {
      type: Date,
    },
    connectCount: {
      type: Number,
      default: 0,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },

    about: {
      type: String,
      trim: true,
    },
    localId: {
      type: String,
      trim: true,
    },
    imageUrl: String,
    salt: String,
    supUser: Boolean,
    roles: [{ type: ObjectId, ref: "Role" }],

    additionalPermissions: [
      {
        access: {
          type: ObjectId,
          ref: "Access",
        },
        level: levelShema,
      },
    ],

    store: {
      type: {
        count: {
          type: Number,
          default: 1,
        },
        defaultStore: {
          type: ObjectId,
          ref: "store",
          required: true,
        },
        stores: [
          {
            type: ObjectId,
            ref: "store",
          },
        ],
      },

      required: false,
    },

    googleData: Object,
    isAdmin: Boolean,
    history: {
      type: UserHistoryItem,
      default: {},
    },

    isOnlyExternal: Boolean, // to know if is user used only external auth to connect
    isNewUser: Boolean, // if this user is created by admin and not update by user self
    id: Number,
  },
  { timestamps: true, typePojoToMixed: false }
);

userSchema.plugin(autoIncrement.plugin, {
  model: "User",
  field: "id",
  startAt: 0,
});

// virtual field
userSchema
  .virtual("password")
  .set(function(password) {
    this._password = password;
    this.salt = uuidv1();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

userSchema.methods = {
  // permet de verifier si le mot de pass entrer par l'utilisateur correspond à celui dans la base

  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  encryptPassword: function(password) {
    if (!password) return "";

    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },
};

module.exports = mongoose.model("User", userSchema);
