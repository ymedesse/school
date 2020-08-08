/* eslint-disable no-console */
const { Order } = require("../models/order");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { controllerHelper } = require("../utils/simpleControllerFactory");
const { getContent } = require("./Cart");
const { sendNewOrderEmail } = require("../mail/controller");
const { /*create, read, update, remove,*/ byId, list } = controllerHelper(
  Order,
  "order",
  true
);

exports.submitOrder = async (req, res) => {
  const { profile, body } = req;
  const val = await getCartContent(req, res);
  if (!val) return res.status(400).json("une erreur s'est produite");

  const { payment, type = "cart" } = body;
  const cartCmd = val[`${type}`];

  const { shipping = {}, contents = [] } = cartCmd;
  const address = { ...shipping.address };

  shipping.address = await formatAddress(address);
  const contentsFormated = await formatContents(contents);
  const cartFormated = await formatCart(cartCmd);
  const customerFormated = await formatUser(profile);
  const { totalAmount = 0 } = cartCmd;
  const leftToPay = totalAmount - payment.amount;

  const status = checkStatus(totalAmount, leftToPay);

  const labelType = type === "cart" ? "achat" : "commande";
  const value = {
    user: profile,
    shipping,
    payment: [payment],
    contents: contentsFormated,
    [`${type}`]: cartFormated,
    status,
    customerData: customerFormated,
    amountPaid: payment.amount || 0,
    totalAmount,
    leftToPay,
    updatedBy: profile,
    createBy: profile,
    count: cartCmd.count,
    type: labelType,
  };

  const order = new Order(value);
  req.order = order;

  saveOrder(
    res,
    order,
    (newOrder) => {
      req.newOrder = newOrder;
      res.json(newOrder);
      performCompleteCartCmd(cartCmd);
      sendNewOrderEmail(order);
    },
    "order created"
  );
};

const performCompleteCartCmd = async (cartCmd) => {
  await cartCmd.remove();
};

exports.update = (req, res) => {
  console.log({ req, res });
};

const getCartContent = async (req, res) => {
  try {
    const resultat = await getContent(req.profile);
    return resultat;
  } catch (error) {
    console.log({ error });
    res.status(400).json({ error, file: "order_getCartConten" });
  }
};

const checkStatus = (totalAmount, leftToPay) => {
  const status =
    leftToPay === 0 || leftToPay < totalAmount
      ? {
          id: "processing",
          label: "en traitement",
          rank: 0,
        }
      : {
          id: "pending",
          label: "En attente de paiement",
          rank: 0,
        };
  return status;
};

const formatUser = async (user = {}) => {
  const { lastName, firstName, phone, email } = user;
  return { lastName, firstName, phone, email };
};

const formatAddress = async (address = {}) => {
  const {
    _id,
    firstName,
    lastName,
    description,
    phone,
    city = {},
    postal,
  } = address;

  const { name, code } = city;
  const newAddress = {
    id: _id,
    firstName,
    lastName,
    description,
    phone,
    city: {
      name,
      code,
    },
    postal,
  };
  return newAddress;
};

const formatCart = async (cart = {}) => {
  const { _id, totalDetail = {} } = cart;
  const { tva, price, sale_price, ht, discount, count, total } = totalDetail;
  return { id: _id, tva, price, sale_price, ht, discount, count, total };
};

const formatContents = async (contents = []) => {
  const newContents = [];
  for (let i = 0; i < contents.length; i++) {
    const element = contents[i];
    const { list, names, classe, school, total, products } = element;
    const classeFormated = await formatClasseSchool(classe);
    const schoolFormated = await formatClasseSchool(school);
    const productsFormated = await formatProducts(products);
    
    newContents.push({
      classe: classeFormated,
      school: schoolFormated,
      products: productsFormated,
      list,
      names,
      total,
    });
  }

  return newContents;
};

const formatClasseSchool = async (value = {}) => {
  const newValue = value
    ? { id: value._id, name: value.name, slug: value.slug, code: value.code }
    : undefined;
  return newValue;
};

const formatProducts = async (products = []) => {
  const newProducts = [];
  for (let i = 0; i < products.length; i++) {
    const { quantity, product = {} } = products[i];
    newProducts.push({
      id: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      sale_price: product.sale_price,
      order_price: product.order_price,
      isbn: product.isbn,
      tva: product.tva,
      discount: product.discount,
      ht: product.ht,
      quantity,
    });
  }
  return newProducts;
};

exports.remove = async (req, res) => {
  const { profile, order } = req;
  order.status = {
    id: "trash",
    label: "Supprimée",
  };

  order.updatedBy = profile._id;

  saveOrder(
    res,
    order,
    (newOrder) => {
      req.newOrder = newOrder;
      res.json({ suucess: "Suppression effectuée avec succès", newOrder });
    },
    "order remove failed"
  );
};

exports.listByStatus = (req, res) => {
  const query = {};
  if (req.query.status) {
    query.status = req.query.status;
  }

  Order.find(query, (err, orders) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json({ orders });
  });
};

/**
 * Step seraching
 */

exports.listSearch = async (req, res) => {
  performSearching(req, res, "full", (data) =>
    res.json({
      ...data,
    })
  );
};

exports.pricesRangesBySearch = async (req, res) => {
  performSearching(req, res, "pricesRange", (data) => {
    const range = findMinMax(data.results);
    res.json({
      min: range[0],
      max: range[1],
      range,
    });
  });
};

exports.listPartialSearch = async (req, res) => {
  performSearching(req, res, "partial", (data) =>
    res.json({
      ...data,
    })
  );
};

const performSearching = (req, res, type = "full", next) => {
  const { query } = req;
  let {
    order = "desc",
    sortBy = "createdAt",
    limit,
    offset,
    search,
    price,
    dates,
    status,
    searchInFields = [],
    ...restQuery
  } = query;

  const isNormalSearching = ["pricesRange"].indexOf(type) === -1;
  limit = isNormalSearching ? limit && parseInt(query.limit) : undefined;

  let textFilter = search ? { $text: { $search: search } } : {};

  if (type === "partial") {
    textFilter = search
      ? {
          $or: searchInFields.map((field) => {
            return {
              [`${field}`]: {
                $regex: search,
                $options: "-i",
              },
            };
          }),
        }
      : "";
  }

  const statusFilter = status ? { "status.id": status } : {};

  const datesFilter = dates
    ? {
        "createdAt": {
          $gte: new Date(dates[0]),
          $lte: new Date(dates[1]),
        },
      }
    : {};

  const pricesFilter = isNormalSearching
    ? price
      ? {
          $or: [
            {
              "total": {
                $gte: parseInt(price[0]),
                $lte: parseInt(price[1]),
              },
            },
          ],
        }
      : {}
    : {};

  let filter = {
    ...textFilter,
    ...pricesFilter,
    ...statusFilter,
    ...datesFilter,
    ...restQuery,
  };

  execSearchPaginate(
    res,
    filter,
    {
      sortBy,
      order,
      limit,
      offset,
      searchInFields,
      select:
        type === "pricesRange"
          ? "total"
          : " id status createdAt updatedAt total customerData shipping.firstName shipping.lastName payment count amountPaid",
      toSort: type !== "pricesRange",
    },
    (data) => next(data)
  );
};

const findMinMax = (arr) => {
  if (arr.length === 0) return [0, 0];
  let min = arr[0].total,
    max = arr[0].total;
  for (let i = 1, len = arr.length; i < len; i++) {
    let v = arr[i].total;
    min = v < min ? v : min;
    max = v > max ? v : max;
  }

  return [min, max];
};

const execSearchPaginate = (
  res,
  filter,
  {
    sortBy,
    order,
    limit,
    offset,
    searchInFields,
    select = searchInFields.join(" "),
    toSort = true,
  },
  next
) => {
  const myCustomLabels = {
    totalDocs: "count",
    docs: "results",
  };

  const option = {
    select: select,
    // projection: toSort ? { score: { $meta: "textScore" } } : {},
    sort: toSort
      ? { /*score: { $meta: "textScore" },*/ [`${sortBy}`]: order }
      : {},
    pagination: limit !== undefined,
    customLabels: myCustomLabels,
    // populate: {
    //   path: "customer",
    //   select: "name email first_name last_name username",
    // },
  };

  if (limit) option.limit = limit;
  if (offset) option.offset = offset;

  Order.paginate(filter, option, (err, data) => {
    if (err) {
      console.log({ err });
      return res.status(400).json({
        error: err,
      });
    }
    const {
      results,
      count,
      hasNextPage,
      hasPrevPage,
      prevPage,
      nextPage,
    } = data;

    const m = {
      count: count,
      next: hasNextPage && `offset=${data.limit * (nextPage - 1)}`,
      previous: hasPrevPage && `offset=${data.limit * (prevPage - 1)}`,
      results: results,
    };

    next(m);
  });
};

/**
 * Synchronisation
 */

exports.read = async (req, res) => {
  const { order } = req;
  order.populate({
    path: "user",
    select: "name email lastName firstName email nomAfficher phone",
  });

  await order.execPopulate();

  return res.json(order);
};

exports.getStatusValues = (req, res) => {
  res.json(Order.schema.path("status").enumValues);
};
exports.getTypeValues = (req, res) => {
  res.json(Order.schema.path("type").enumValues);
};

exports.updateStatus = (req, res) => {
  const { order, body, profile } = req;
  const { status } = body;
  if (!status) return res.status(400).json("vous devez spécifier le status");

  const allStatus = Order.schema.path("status").options.enum;
  const index = allStatus.findIndex((item) => item.id === status.id);
  if (index === -1) return res.status(400).json("Status non valide");

  order.status = status;
  order.updatedBy = profile;

  order.save((err, newOrder) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
        model: "order status",
      });
    } else res.json(newOrder);
  });
};

const saveOrder = (res, order, next, errorComment) => {
  order.save((err, newOrder) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
        errorComment,
      });
    }

    next && next(newOrder);
  });
};

exports.listByUser = (req, res) => {
  const { profile, query } = req;

  const { type, order: byOrder = "desc" } = query;

  const sense = byOrder === "desc" ? -1 : 1;
  const typeFilter = type ? { type } : {};

  Order.find({ createBy: profile, ...typeFilter })
    .select("status totalAmount leftToPay leftToPay type createdAt count")
    .sort({ createdAt: sense })
    .exec((err, orders) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json(orders);
    });
};
exports.orderById = byId;

exports.list = list;
