/* eslint-disable no-console */
const { validationResult } = require("express-validator");

const List = require("../models/list");

const { errorHandler } = require("../helpers/dbErrorHandler");
const { controllerHelper } = require("../utils/simpleControllerFactory");
const { setSchoolFromListProduct } = require("./product");

const { create, update } = controllerHelper(List, "list", true);
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  const { profile, body } = req;
  req.body = await performListData(body);

  req.body.updateBy = profile;
  req.body.createBy = profile;
  create(req, res, (list) => {
    res.json({
      list: list.depopulate("createBy").depopulate("updateBy"),
    });
    const { school, products } = list;

    setSchoolFromListProduct(school, products);
  });
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  const { profile, body } = req;

  req.body = await performListData(body);
  req.body.updateBy = profile;
  req.body.createBy = profile;

  update(req, res, (list) => {
    res.json({
      list: list.depopulate("createBy").depopulate("updateBy"),
    });
  });
  // });
};

const performListData = async (list) => {
  const { products, school, classe } = list;
  list.products = await performListProducts(products);
  list.school = await performSchool(school);
  list.classe = await performClasse(classe);
  return list;
};

const performListProducts = async (products = []) => {
  const datas = [];
  for (let i = 0; i < products.length; i++) {
    const { product, rank } = products[i];

    const result = {
      product: product._id,
      ...product,
      rank,
    };
    delete result._id;
    datas.push(result);
  }
  return datas;
};

const performSchool = async (school) => {
  const result = {
    id: school._id,
    ...school,
  };
  delete result._id;
  return result;
};

const performClasse = async (classe) => {
  const result = {
    id: classe._id,
    ...classe,
  };
  delete result._id;
  return result;
};

exports.byId = (req, res, next, id) => {
  List.findById(id)
    .select("-updateBy -createBy -createdAt -updatedAt")
    .exec((err, list) => {
      if (err || !list) {
        return res.status(400).json({
          error: "List not found",
        });
      }
      req.list = list;
      next();
    });
};

exports.read = (req, res) => {
  const list = req.list;
  return res.json(list);
};

exports.remove = (req, res) => {
  let list = req.list;
  const { products, school } = list;
  list.remove((err, deletedList) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }
    res.json({
      deletedList,
      message: "Liste supprimé avec succès",
    });
    setSchoolFromListProduct(school, products, true);
  });
};

exports.getFourniture = async (req, res) => {
  const { list } = req;

  performFournitureSelection(res, {
    "_id": list._id,
  });
};

exports.getFournitureBySchoolAndClasse = async (req, res) => {
  const { school, classe } = req;

  console.log({
    "school.id": school._id,
    "classe.id": classe._id,
  });
  performFournitureSelection(res, {
    "school.id": school._id,
    "classe.id": classe._id,
  });
};

const performFournitureSelection = async (res, filter) => {
  List.findOne(filter)
    .populate({
      path: "products.product",
      select: "-updateBy -createBy -createdAt -updatedAt -history -schools",
    })
    .populate({
      path: "classe.id",
      select: "name code slug",
    })
    .populate({
      path: "school.id",
      select: "name slug",
    })
    .exec((error, result) => {
      if (error) {
        console.log("find list products", error);
        res.status(400).json({ error: errorHandler(error) });
      } else {
        if (result === null || !result)
          return res.status(400).json({ error: "List not found" });

        const { classe, school } = result;
        const products = checkNullProduct(result.products);

        res.json({
          ...result._doc,
          products,
          classe: classe.id,
          school: school.id,
        });
      }
    });
};

const checkNullProduct = (products) => {
  return products.filter((item) => item.product !== null);
};
exports.getClassesFromSchool = async (req, res) => {
  const { school } = req;
  List.find({ "school.id": school._id })
    .select("classe school slug")
    .populate({
      path: "classe.id",
      select: "name code slug",
    })
    .populate({
      path: "school.id",
      select: "name phone slug",
    })
    .exec((error, result = []) => {
      if (error) {
        console.log("find classes from ecole", error);
        res.status(400).json({ error: errorHandler(error) });
      } else {
        const data = result.map((item) => ({
          classe: item.classe.id,
          school: item.school.id,
          _id: item._id,
          amount: item.amount,
        }));
        res.json(data);
      }
    });
};

exports.removeMany = async (req, res) => {
  const { ids } = req.body;

  List.deleteMany({ _id: { $in: ids } }).exec((error, result) => {
    if (error) {
      res.status(400).json({ error: errorHandler(error) });
    } else {
      res.json({ suucess: "Suppression effectuée avec succès", result });
    }
  });
};

exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : "asc";
  let sortBy = req.query.sortBy ? req.query.sortBy : "school.name";
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  List.find()
    .select("-updateBy -createBy -createdAt -updatedAt -history")
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, lists) => {
      if (err) {
        console.log({ err });
        return res.status(400).json({
          error: "Pas de liste",
        });
      }
      res.json(lists);
    });
};

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
    order = "asc",
    sortBy = "school.name",
    limit,
    offset,
    search,
    // category,
    classes,
    school,
    price,
    searchInFields = [],
    ...restQuery
  } = query;

  const isNormalSearching = ["pricesRange", "featured"].indexOf(type) === -1;
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

  // const categoryFilter = category
  //   ? {
  //       "content.categories.slug": { $regex: "^" + category },
  //     }
  //   : {};

  const classeFilter = classes
    ? {
        "classes.code": { $in: classes },
      }
    : {};
  const schoolFilter = school
    ? {
        "schools.name": { $in: school },
      }
    : {};

  const pricesFilter = isNormalSearching
    ? price
      ? {
          $or: [
            {
              "amount": {
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
    ...classeFilter,
    ...schoolFilter,
    ...pricesFilter,
    ...restQuery,
  };

  if (type === "featured")
    filter = {
      $or: [{ "featured": true }, { ...filter, "featured": true }],
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
          ? "amount"
          : "-updateBy -createBy -createdAt -updatedAt -history",
      toSort: type !== "pricesRange",
    },
    (data) => next(data)
  );
};

const findMinMax = (arr) => {
  if (arr.length === 0) return [0, 0];
  let min = arr[0].amount,
    max = arr[0].amount;
  for (let i = 1, len = arr.length; i < len; i++) {
    let v = arr[i].content.amount;
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
    select,
    // projection: toSort ? { score: { $meta: "textScore" } } : {},
    sort: toSort
      ? { /*score: { $meta: "textScore" },*/ [`${sortBy}`]: order }
      : {},
    pagination: limit !== undefined,
    customLabels: myCustomLabels,
  };

  if (limit) option.limit = limit;
  if (offset) option.offset = offset;

  List.paginate(filter, option, (err, data) => {
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
