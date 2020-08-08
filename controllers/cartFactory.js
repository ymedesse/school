/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const { Cart } = require("../models/cart");
const { Commande } = require("../models/Commande");
const { convertStringNumber } = require("../utils");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { Product } = require("../models/product");
const { findLocalAddress } = require("./address");

exports.factory = (Col, docName = "cart", sale_priceField = "sale_price") => {
  const _add = (req, res) => {
    cartByUser(req, res, () => performAddCart(req, res));
  };
  const _removeProductInCart = (req, res) => {
    cartByUser(req, res, () => performRemoveProductInCart(req, res));
  };

  const _removeOneContentList = (req, res) => {
    cartByUser(req, res, () => performRemoveOneContent(req, res));
  };

  const _updateContentNames = (req, res) => {
    cartByUser(req, res, () => performUpdateContentName(req, res));
  };

  const _updateShipping = (req, res) => {
    cartByUser(req, res, () => performUpdateShipping(req, res));
  };

  const _setProductsQuantity = (req, res) => {
    cartByUser(req, res, () => performSetProductQuantity(req, res));
  };

  const _complete = (_id) => {
    Col.findByIdAndRemove(_id, (error, result) => {
      console.log("remove_" + docName, { error });
    });
  };

  const _read = async (req, res) => {
    const auteur = { user: req.profile };
    let localAddresses = [];

    try {
      const resultat = await _getContent(req.profile);
      const { cart, commande } = resultat;

      localAddresses = await findLocalAddress();
      res.json({ cart, commande, localAddresses });
    } catch (error) {
      console.log({ error });
      res.status(400).json({ error, file: "cartFactory" });
    }
  };

  const _getContent = async (profile) => {
    const auteur = { user: profile };
    let cart = {},
      commande = {};
    return new Promise(async (resolve, reject) => {
      try {
        cart = (await performReadCardCmd(Cart, auteur)) || {};
        commande = (await performReadCardCmd(Commande, auteur)) || {};
        resolve({ cart, commande });
      } catch (error) {
        reject(error);
      }
    });
  };

  const _readLite = async (req, res) => {
    const auteur = { user: req.profile };
    try {
      const cart = await performReadLite(auteur);
      res.json(cart);
    } catch (error) {
      console.log("readLite", { error });
      res.status(400).json({ error: errorHandler(error) });
    }
  };

  // const _completeCart = async (req, res, next) => {
  //   const { order } = req.body;
  //   if (order.cart) {
  //     const idCart = order.cart;

  //     Col.findOneAndUpdate(
  //       { _id: idCart },
  //       { $set: { status: "complete" } },
  //       (error, cart) => {
  //         if (error) {
  //           return res.status(400).json({
  //             error,
  //           });
  //         }
  //         res.json(order);
  //       }
  //     );
  //   } else {
  //     res.json(order);
  //   }
  // };

  const save = async (cart, res, fullPopulate = true) => {
    await populateCart(cart, fullPopulate);
    updateCartInfo(cart, () => executeSaveCart(res, cart));
  };

  const executeSaveCart = (res, cart) => {
    cart.save(async (err, scart) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }
      res.json(scart);
    });
  };

  const populateCart = async (cart, fully = true) => {
    cart
      .populate({
        path: "contents.products.product",
        select: fully
          ? fullSelectForProductPopulate
          : liteSelectForProductPopulate,
      })
      .populate({
        path: "contents.classe",
        select: "name code slug",
      })
      .populate({
        path: "contents.school",
        select: "name slug",
      });

    if (fully) {
      cart
        .populate({
          path: "shipping.address",
          select: "firstName lastName description phone city postal email maps",
          populate: {
            path: "city",
            select: "name code cost",
          },
        })
        .populate({
          path: "user",
          select: "address",
          populate: {
            path: "address",
            select:
              "firstName lastName description phone city postal email maps",
            populate: {
              path: "city",
              select: "name code cost",
            },
          },
        });
    }

    await cart.execPopulate();
    return cart;
  };

  const unactive = (cart) => {
    cart.status = "unactive";
    cart.save((err, scart) => {
      if (err) {
        console.log("unactive cart ", err);
      }
      console.log("cart unactived successfully ");
    });
  };

  /**
   * Permet de retrouver le panier d'un utilisateur don le profile est spécifié dans la req
   * prennds en paramètre next
   */

  const cartByUser = (req, res, next) => {
    const user = req.profile;
    Col.findOne({ user, status: "active" }).exec((err, cart) => {
      if (err) {
        return res.status(400).json({
          error: `Auccun ${docName} en cours`,
        });
      }
      req[`${docName}`] = cart;
      next();
    });
  };

  const performReadLite = (auteur) => {
    return new Promise((resolve, reject) => {
      Col.findOne({ ...auteur, status: "active" })
        .select(
          "count total totalDetail contents.names contents.products contents.list contents._id"
        )
        .populate({
          path: "contents.products.product",
          select: liteSelectForProductPopulate,
        })
        .populate({
          path: "contents.classe",
          select: "name code slug",
        })
        .populate({
          path: "contents.school",
          select: "name slug",
        })
        .exec((err, cart) => {
          err && reject(err);
          !err && resolve(cart);
        });
    });
  };

  const performReadCardCmd = (CartCmd, auteur) => {
    return new Promise((resolve, reject) => {
      CartCmd.findOne({ ...auteur, status: "active" })
        .populate({
          path: "contents.products.product",
          select: "-updateBy -createBy -createdAt -updatedAt -history -schools",
        })
        .populate({
          path: "contents.classe",
          select: "name code slug",
        })
        .populate({
          path: "contents.school",
          select: "name slug",
        })
        .populate({
          path: "shipping.address",
          select: "firstName lastName description phone city postal email maps",
          populate: {
            path: "city",
            select: "name code cost",
          },
        })
        .populate({
          path: "user",
          select: "address",
          populate: {
            path: "address",
            select:
              "firstName lastName description phone city postal email maps",
            populate: {
              path: "city",
              select: "name code cost",
            },
          },
        })
        .exec(async (err, cart) => {
          if (err) {
            reject(err);
          }

          if (!cart) {
            return resolve({});
          }

          resolve(cart);
        });
    });
  };

  const performAddCart = (req, res, temporary = false) => {
    let { [`${docName}`]: cart, product } = req;

    let { quantity: initQuantity, names, school, classe, list } = req.body;

    if (!initQuantity) {
      return res.status(400).json({ error: "Quantité invalide" });
    }

    let id = req.product._id.toString();
    const quantity = convertStringNumber(initQuantity);
    const salePrice = product[`${sale_priceField}`];
    const total = quantity * convertStringNumber(salePrice);
    const content = {
      list,
      names,
      classe,
      school,
      total,
      products: [{ product: product._id, quantity }],
    };

    if (cart === null) {
      const auteur = { user: req.profile._id };

      const data = {
        ...auteur,
        contents: [content],
        count: quantity,
        total,
        user: req.profile._id,
      };

      cart = new Col({ ...data });
    } else {
      const id = product._id.toString();
      const { contents = [] } = cart;

      let index = getNewContentIndex(list, contents);

      if (index === -1) {
        contents.push(content);
      } else {
        const cont = contents[index];
        const { products = [] } = cont;
        const oldProduct = products.find(
          (item) => item.product.toString() === id
        );

        if (oldProduct) {
          oldProduct.quantity = quantity;
        } else {
          products.push({ product: id, quantity });
        }
        cont.total = total;
        cont.products = products;
        console.log({ ssss: cont.total, oldProduct });
      }
      cart.contents = contents;
    }

    save(cart, res, false);
  };

  const getNewContentIndex = (list, contents) => {
    let index = -1;
    if (!list) index = contents.findIndex((item) => !item.list);
    else {
      const rightContents = contents.filter((item) => item.list !== undefined);
      index = rightContents.findIndex(
        (item) => item.list.toString() === list.toString()
      );
    }
    return index;
  };

  /**
   * Supprime un article d'un panier
   * req.product : le produit à supprimer du panier
   * auteur : un utilisateur auth ou  une session
   *
   */
  const performRemoveProductInCart = (req, res) => {
    const { [`${docName}ItemId`]: cartItemId } = req.params;
    const { [`${docName}`]: cart = {}, body } = req;
    const { list } = body;

    const { contents } = cart;
    const index = getNewContentIndex(list, contents);

    const cont = contents[index];

    if (cont) {
      const { products = [] } = cont;

      const index = products.findIndex(
        (item) => item.product.toString() === cartItemId
      );

      if (index !== -1) {
        products.splice(index, 1);
      }

      save(cart, res);
    } else return res.json({ error: "list list invalid" });
  };

  const performRemoveOneContent = (req, res) => {
    const { [`${docName}`]: cart, body } = req;
    const { list } = body;
    const { contents } = cart;

    const index = getNewContentIndex(list, contents);
    if (index > -1) {
      contents.splice(index, 1);
      save(cart, res);
    } else return res.json({ error: "list invalid" });
  };

  const performComplete = async (req, res) => {
    const { [`${docName}`]: cart } = req;
    await cart.remove();
  };

  const performUpdateContentName = async (req, res) => {
    const { [`${docName}`]: cart, body } = req;
    const { list, names } = body;
    if (!names) return res.json({ error: "Vous devez renseigner un nom" });

    const { contents = [] } = cart;
    const index = getNewContentIndex(list, contents);
    const cont = contents[index];
    if (cont) {
      cont.names = names;
      await populateCart(cart, false);
      executeSaveCart(res, cart);
    } else return res.json({ error: "list invalid" });
  };

  const performUpdateShipping = async (req, res) => {
    const { [`${docName}`]: cart, body } = req;
    const { shipping } = body;
    if (!shipping) return res.json({ error: "invalid shipping" });
    cart.shipping = shipping;
    await populateCart(cart);
    executeSaveCart(res, cart);
  };

  const performSetProductQuantity = async (req, res) => {
    if (!req[`${docName}`] || req[`${docName}`] === null) {
      res.status(400).json({
        error: "Cart not found",
      });
    }

    const { contents: newContents } = req.body;

    let { [`${docName}`]: cart } = req;
    const { contents } = cart;

    for (let i = 0; i < contents.length; i++) {
      const cont = contents[i];
      const { list, products = [] } = cont;

      const index = getNewContentIndex(list, newContents);
      const newCont = newContents[index];

      if (cont) {
        const { products: newProducts = [] } = newCont;

        for (let y = 0; y < products.length; y++) {
          const id = products[y].product.toString();
          const item = newProducts.find((p) => p.product._id.toString() === id);
          if (item !== undefined) {
            products[y].quantity = item.quantity;
          }
        }
        contents[i].products = products;
      }
    }
    req[`${docName}`].contents = contents;

    save(cart, res);
  };

  /**
   *  Permet d'actualiser les informations d'un parnier ( name, price, montant, count)
   *  Prend en paramètre cart
   */
  const updateCartInfo = async (cart, next) => {
    const { contents = [] } = cart;

    cart.populate({
      path: "contents.products.product",
      select: sale_priceField,
    });

    await cart.execPopulate();

    let total = 0,
      count = 0;

    for (let i = 0; i < contents.length; i++) {
      const cont = contents[i];
      let contTotal = 0,
        contCount = 0;

      const { products = [] } = cont;
      for (let i = 0; i < products.length; i++) {
        const element = products[i];
        const { product = {}, quantity = 0 } = element;
        const sale_price = product[`${sale_priceField}`] || 0;
        contTotal += quantity * sale_price;
        contCount += quantity;
      }

      total += contTotal;
      count += contCount;
      contents[i].count = contCount;
      contents[i].total = contTotal;
    }
    console.log({ somme: total });
    cart.total = total;
    cart.count = count;

    next();
  };

  const liteSelectForProductPopulate =
    "-updateBy -createBy -createdAt -updatedAt -history -schools -description -stock -usedStock -sold -classes -status -type -_v ";
  const fullSelectForProductPopulate =
    "-updateBy -createBy -createdAt -updatedAt -history -schools -description -stock -usedStock -sold -classes -status ";

  const _performReadLite = performReadLite;

  return {
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
  };
};
