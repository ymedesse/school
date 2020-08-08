/* eslint-disable no-console */
const { Customer, extractableFields } = require("../models/wooCustomer");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { controllerHelper } = require("../utils/simpleControllerFactory");
const { bulkUpdateModelValues } = require("../utils");
// const { convertNumberFieds } = require("../utils/performProduct");

const { wooApi: getWooApi } = require("../woocommerce/wooApi");
const wooApi = getWooApi();

const { /*create, read, update, remove,*/ byId, list } = controllerHelper(
  Customer,
  "customer",
  true
);

const directSycronization = async (req, res, next) => {
  const { profile } = req;
  const { customers } = req.body;
  if (customers.length > 0) {
    // const customerValue = await convertNumberFieds([...customers]);
    const data = await formateToCustomers(profile, [...customers]);
    saveMany(res, data, "id", true, (results) => {
      !next &&
        res.json({ suucess: "Syncronisation effectuée avec succès", results });
      next && next({ success: true });
    });
  } else {
    !next && res.status(400).json({ error: "empty value", file: "customer" });
    next && next({ error: "empty value" });
  }
};

const formateToCustomers = async (user, customers) => {
  let newCustomers = [];
  for (let i = 0; i < customers.length; i++) {
    const element = customers[i];
    const extractables = await getEstractableValue(element);
    newCustomers.push({
      ...extractables,
      details: element,
      updateBy: user,
    });
  }
  return newCustomers;
};

const getEstractableValue = async (customer) => {
  let newValue = {};
  for (let i = 0; i < extractableFields.length; i++) {
    const element = extractableFields[i];
    const value = customer[`${element}`];
    if (value) {
      newValue = { ...newValue, [`${element}`]: value };
      delete customer[`${element}`];
    }
  }
  return newValue;
};

const saveMany = (res, values, key = "id", createNew, next) => {
  bulkUpdateModelValues(Customer, values, key)
    .then(async (idArray) => {
      !next && res.json({ idArray });
      next && next(idArray);
    })
    .catch((error) => {
      console.log({ error });
      res.status(400).json({ error });
    });
};

exports.remove = async (req, res, next) => {
  const { id } = req.body;
  const { profile } = req;

  Customer.findOneAndUpdate(
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
    customer = "asc",
    sortBy = "name",
    limit,
    offset,
    search,
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

  const statusFilter = status ? { status } : {};
  const datesFilter = dates
    ? {
        "date_created": {
          $gte: new Date(dates[0]),
          $lte: new Date(dates[1]),
        },
      }
    : {};

  let filter = {
    ...textFilter,
    ...statusFilter,
    ...datesFilter,
    ...restQuery,
  };

  execSearchPaginate(
    res,
    filter,
    {
      sortBy,
      customer,
      limit,
      offset,
      searchInFields,
      select:
        type === "pricesRange"
          ? "total"
          : " id number status date_created date_modified total customer_id billing.first_name billing.last_name billing.email billing.phone shipping.first_name shipping.last_name payment_method",
      toSort: type !== "pricesRange",
    },
    (data) => next(data)
  );
};

const execSearchPaginate = (
  res,
  filter,
  {
    sortBy,
    customer,
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
    select,
    // projection: toSort ? { score: { $meta: "textScore" } } : {},
    sort: toSort
      ? { /*score: { $meta: "textScore" },*/ [`${sortBy}`]: customer }
      : {},
    pagination: limit !== undefined,
    customLabels: myCustomLabels,
  };

  if (limit) option.limit = limit;
  if (offset) option.offset = offset;

  Customer.paginate(filter, option, (err, data) => {
    if (err) {
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

exports.checkBackupCustomer = async (id, profile) => {
  return new Promise((resolve, reject) => {
    Customer.findOne({ id })
      .select("_id email first_name last_name")
      .exec(async (error, resultat) => {
        error && reject(error);

        if (resultat && resultat !== null) {
          resolve(resultat);
        } else {
          console.log("no backup resultat");
          try {
            const newCustom = await syncChronizeCustomerFromWoo(id, profile);

            resolve(newCustom);
          } catch (error) {
            reject(error);
          }
        }
      });
  });
};

const syncChronizeCustomerFromWoo = async (id, user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const wooCust = await getWooCustomer(id);
      const customer = new Customer({
        ...wooCust,
        updateBy: user,
        createBy: user,
      });
      customer.save((err, newCustom) => {
        err && reject(err);
        if (!err) resolve(newCustom);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getWooCustomer = (id) => {
  return new Promise((resolve, reject) => {
    const url = "customers/" + id;
    wooApi
      .get(url)
      .then((response) => {
        if (response !== undefined) {
          resolve(response.data);
        } else reject("contenu vide");
      })
      .catch((error) => {
        error.response && reject(error.response.data);
        !error.response && reject({ data: { message: " connexion failed" } });
      });
  });
};

exports.read = (req, res) => {
  const { customer } = req;
  return res.json({ customer: JSON.stringify(customer) });
};

exports.directSycronization = directSycronization;
exports.customerById = byId;

exports.list = list;
exports.saveMany = saveMany;
