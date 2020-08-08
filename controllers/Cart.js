/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const { Cart } = require("../models/cart");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { Product } = require("../models/product");
const { findLocalAddress } = require("./address");

const { factory } = require("./cartFactory");

const {
  _add,
  _removeProductInCart,
  _removeOneContentList,
  _updateContentNames,
  _updateShipping,
  _setProductsQuantity,
  _read,
  _readLite,
  _complete,
  _getContent,
  _performReadLite,
} = factory(Cart, "cart", "sale_price");
exports.add = _add;
exports.removeProductInCart = _removeProductInCart;
exports.removeOneContentList = _removeOneContentList;
exports.updateContentNames = _updateContentNames;
exports.updateShipping = _updateShipping;
exports.setProductsQuantity = _setProductsQuantity;
exports.read = _read;
exports.readLite = _readLite;
exports.completeCart = _complete;
exports.performReadLite = _performReadLite;
exports.getContent = _getContent;
