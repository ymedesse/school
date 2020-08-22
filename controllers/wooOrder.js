/* eslint-disable no-console */
const { Order, extractableFields } = require("../models/wooOrder");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { controllerHelper } = require("../utils/simpleControllerFactory");
const { bulkUpdateModelValues } = require("../utils");
const { checkBackupCustomer } = require("./wooCustomer");

const { /*create, read, update, remove,*/ byId, list } = controllerHelper(
  Order,
  "order",
  true
);

const options = {
  // "fullDocument": "updateLookup"
};

const changeStream = Order.watch(options);
changeStream.on("change", (change) => {
  // const { documentKey } = change;
  console.log({ change });
});

const directSycronization = async (req, res, next) => {
  const { profile } = req;
  const { orders } = req.body;
  if (orders.length > 0) {
    // const orderValue = await convertNumberFieds([...orders]);
    const data = await formateToOrders(profile, [...orders]);

    saveMany(res, data, "id", true, (results) => {
      !next &&
        res.json({ suucess: "Syncronisation effectuée avec succès", results });
      next && next({ success: true });
      checkCustomersBackup(
        data.map((item) => item.id),
        profile
      );
    });
  } else {
    !next && res.status(400).json({ error: "empty value", file: "order" });
    next && next({ error: "empty value" });
  }
};

const checkCustomersBackup = async (ordersNatifId = [], profile) => {
  console.log("begin check Customer backup");
  await Order.find({ id: { $in: ordersNatifId } })
    .select("_id id customer_id customer")
    .populate({ path: "customer", select: "_id" })
    .exec(async (err, orderDatas) => {
      if (err) {
        console.log("checking order customer backup ", { error: err });
        console.log({ err, orderDatas });
      }

      for (let i = 0; i < orderDatas.length; i++) {
        const element = orderDatas[i];
        if (!element.customer || !element.customer._id) {
          sycnhronizeCustomerBackupToOrder(element, profile);
        }
      }
    });
  console.log("end check Customer backup");
};

const sycnhronizeCustomerBackupToOrder = async (element, profile) => {
  try {
    console.log("begin checking customer ...");
    const customerData = await checkBackupCustomer(
      element.customer_id,
      profile
    );

    const { _id, email, first_name, last_name } = customerData;

    const customer_data = {
      email,
      first_name,
      last_name,
    };

    console.log("begin update customer ...");

    Order.findByIdAndUpdate(
      { _id: element._id },
      { customer: _id, customer_data },
      (error) => {
        error && console.log("customer upgrade error", { error });
        !error && console.log("customer upgrade is successed");
      }
    );
  } catch (error) {
    console.log("update customer data", { error });
  }
};

const formateToOrders = async (user, orders) => {
  let newOrders = [];
  for (let i = 0; i < orders.length; i++) {
    const element = orders[i];
    const extractables = await getEstractableValue(element);
    newOrders.push({
      ...extractables,
      itemsCount: (extractables.line_items || []).length,
      details: element,
      updateBy: user,
      createBy: user,
    });
  }
  return newOrders;
};

const formateToOrder = async (user, order) => {
  const extractables = await getEstractableValue(order);
  let newOrder = {
    ...extractables,
    itemsCount: (extractables.line_items || []).length,
    details: order,
    updateBy: user,
  };

  return newOrder;
};

const getEstractableValue = async (order) => {
  let newValue = {};
  for (let i = 0; i < extractableFields.length; i++) {
    const element = extractableFields[i];

    const value = order[`${element}`];
    if (value) {
      newValue = { ...newValue, [`${element}`]: value };
      delete order[`${element}`];
    }
  }
  return newValue;
};

const saveMany = (res, values, key = "id", createNew, next) => {
  // console.log({ Order });

  bulkUpdateModelValues(Order, values, key)
    .then(async (idArray) => {
      !next && res.json({ idArray });
      next && next(idArray);
    })
    .catch((error) => {
      console.log({ error });
      res.status(400).json({ error });
    });
};

exports.update = async (req, res) => {
  const { profile, order, body } = req;

  const data = await formateToOrder(profile, { ...body });

  Order.findOneAndUpdate({ _id: order._id }, { ...data }).exec(
    (error, result) => {
      if (error) {
        console.log({ error });
        return res.status(400).json({ error: errorHandler(error) });
      } else {
        res.json(result);
      }
    }
  );
};

exports.remove = async (req, res, next) => {
  const { id } = req.body;
  const { profile } = req;

  Order.findOneAndUpdate(
    { id },
    { "status": "draft", updateBy: profile._id }
  ).exec((error, result) => {
    if (error) {
      !next && res.status(400).json({ error: errorHandler(error) });
      next && next({ error: "not found" });
    } else {
      !next &&
        res.json({ suucess: "Suppression effectuée avec succès", result });
      next && next({ success: true });
    }
  });
};

exports.listByStatus = (req, res) => {
  // create query object to hold value and category value
  const query = {};
  if (req.query.status) {
    query.status = req.query.status;
  }

  // find the order based on query object with 2 properties
  // search and category
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
    sortBy = "date_created",
    limit,
    offset,
    search,
    price,
    dates,
    status,
    localstatus,
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

  const statusFilter = status ? { status } : {};
  const localStatusFilter = localstatus
    ? { "localStatus.id": localstatus }
    : {};

  const datesFilter = dates
    ? {
        "date_created": {
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
    ...localStatusFilter,
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
          : " id number status date_created date_modified total customer_id billing.first_name billing.last_name billing.email billing.phone shipping.first_name shipping.last_name payment_method customer_data itemsCount localStatus",
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
    path: "customer",
    select: "name email first_name last_name username",
  });

  await order.execPopulate();

  return res.json(order);
};

exports.getStatusValues = (req, res) => {
  res.json(Order.schema.path("status").enumValues);
};

exports.getLocalStatusValues = (req, res) => {
  res.json(Order.schema.path("localStatus").options.enum);
};

exports.updateLocalStatus = (req, res) => {
  const { order, body, profile } = req;
  const { status } = body;
  if (!status) return res.status(400).json("vous devez spécifier le status");

  const allStatus = Order.schema.path("localStatus").options.enum;
  const index = allStatus.findIndex((item) => item.id === status.id);
  if (index === -1) return res.status(400).json("Status non valide");

  order.localStatus = status;
  order.updateBy = profile;
  order.save((err, newOrder) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
        model: "wooOrder localStatus",
      });
    } else res.json(newOrder);
  });
};

exports.directSycronization = directSycronization;
exports.orderById = byId;

exports.list = list;
exports.saveMany = saveMany;
