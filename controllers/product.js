/* eslint-disable no-console */
const { validationResult } = require("express-validator");

const Product = require("../models/product");
const {
  insertIsbns: memoryIsbnData,
  removeManyIsbns: memoryremoveManyIsbns,
} = require("./isbn");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { controllerHelper } = require("../utils/simpleControllerFactory");
const { bulkUpdateModelValues } = require("../utils");

const { create, update } = controllerHelper(Product, "product", true);

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  const { body, profile } = req;
  const { sale_price, price, isbn } = body;
  if (!sale_price) body.sale_price = price;

  await performAssets(req.body);

  req.body.updateBy = profile;
  req.body.createBy = profile;
  create(req, res, (product) => {
    res.json({
      product: product.depopulate("createBy").depopulate("updateBy"),
    });
    isbn &&
      isbn !== "" &&
      memoryIsbnData([{ isbn, model: "product", content: product._id }]);
  });
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  const { body, profile } = req;
  const { sale_price, price, isbn } = body;
  if (!sale_price) body.sale_price = price;

  req.body.updateBy = profile;
  req.body.createBy = profile;

  await performAssets(req.body);

  update(req, res, (product) => {
    res.json({
      product: product.depopulate("createBy").depopulate("updateBy"),
    });

    isbn &&
      isbn !== "" &&
      memoryIsbnData([{ isbn, model: "product", content: product._id }]);
  });
  // });
};

const performAssets = async (body) => {
  const { assets = {} } = body;
  let { images = [], featuredImage } = assets;

  if (featuredImage && images.indexOf(featuredImage) === -1)
    featuredImage = undefined;

  if (!featuredImage) featuredImage = images[0] || "";

  body.assets = {
    images,
    featuredImage,
  };
};

exports.byId = (req, res, next, id) => {
  Product.findById(id)
    .select("-updateBy -createBy -createdAt -updatedAt")
    .exec((err, product) => {
      if (err || !product) {
        return res.status(400).json({
          error: "Product not found",
        });
      }
      req.product = product;
      next();
    });
};

exports.read = async (req, res) => {
  const product = req.product;
  await product.populate({
    path: "useByListes",
    select: "classe.code school.name",
  });

  await product
    .populate([{ ...currentOdredPopulate }, { ...currentAchatPopulate }])
    .execPopulate();
  return res.json(product);
};

exports.remove = (req, res) => {
  let product = req.product;
  product.remove((err, deletedProduct) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }
    res.json({
      deletedProduct,
      message: "Produit supprimé avec succès",
    });
    memoryremoveManyIsbns([deletedProduct.isbn]);
  });
};

exports.removeMany = async (req, res) => {
  const { ids } = req.body;

  Product.find({ _id: { $in: ids } })
    .select("isbn")
    .exec((err, data = []) => {
      if (!err) {
        const isbns = data.map((item) => item.isbn);

        Product.deleteMany({ _id: { $in: ids } }).exec((error, result) => {
          if (error) {
            res.status(400).json({ error: errorHandler(error) });
          } else {
            res.json({ suucess: "Suppression effectuée avec succès", result });
            memoryremoveManyIsbns(isbns);
          }
        });
      }
    });
};

exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : "asc";
  let sortBy = req.query.sortBy ? req.query.sortBy : "name";
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find()
    .select("-updateBy -createBy -createdAt -updatedAt -history")
    .sort([[sortBy, order]])
    .limit(limit)
    .populate(
      { ...currentOdredPopulate },
      { ...currentAchatPopulate },
      { ...useByListesPopulate }
    )
    .exec((err, products) => {
      if (err) {
        console.log({ err });
        return res.status(400).json({
          error: "Pas de produit",
        });
      }
      res.json(products);
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
    sortBy = "name",
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
              "regular_price": {
                $gte: parseInt(price[0]),
                $lte: parseInt(price[1]),
              },
            },
            {
              "sale_price": {
                $gte: parseInt(price[0]),
                $lte: parseInt(price[1]),
              },
            },
            {
              "order_price": {
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
    // ...categoryFilter,
    ...classeFilter,
    ...schoolFilter,
    ...pricesFilter,
    ...restQuery,
  };

  console.log({ filter });
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
      populate: [
        { ...currentOdredPopulate },
        { ...currentAchatPopulate },
        { ...useByListesPopulate },
      ],
      select:
        type === "pricesRange"
          ? "regular_price sale_price orderPrice"
          : "-updateBy -createBy -createdAt -updatedAt -history",
      toSort: type !== "pricesRange",
    },
    (data) => next(data)
  );
};

const findMinMax = (arr) => {
  if (arr.length === 0) return [0, 0];
  let min = arr[0].sale_price,
    max = arr[0].sale_price;
  for (let i = 1, len = arr.length; i < len; i++) {
    let v = arr[i].content.sale_price;
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
    populate,
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
    populate,
  };

  if (limit) option.limit = limit;
  if (offset) option.offset = offset;

  Product.paginate(filter, option, (err, data) => {
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

exports.setSchoolFromListProduct = (school, products = [], toRemove) => {
  const data = {
    school: school.id,
    name: school.name,
  };

  const ids = products.map((item) => item.product);

  Product.find({ _id: { $in: ids } }).exec(async (err, results = []) => {
    const allproduct = await performSetProductsSchool(results, data, toRemove);

    if (allproduct.length > 0) {
      try {
        await bulkUpdateModelValues(Product, allproduct);
      } catch (error) {
        console.log("schools product updated error", error);
      }
    }
  });

  // Product.updateMany(
  //   { _id: { $in: ids } },
  //   { $push: { schools: data } },
  //   (err) => {
  //     if (err) {
  //       console.log("error mis à jour produit", err);
  //     }
  //   }
  // );
};

const performSetProductsSchool = (products, schoolData, toRemove = false) => {
  const allproduct = [];
  return new Promise((resolve) => {
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const { schools } = product;
      const index = schools.findIndex(
        (item) => item.school.toString() === schoolData.school.toString()
      );
      if (toRemove && index > -1) {
        product.schools.splice(index);
        allproduct.push({
          ...product._doc,
        });
      }

      if (index < 0) {
        schools.push(schoolData);
        allproduct.push({
          ...product._doc,
          schools,
        });
      }
      resolve(allproduct);
    }
  });
};

const currentOdredPopulate = {
  path: "currentCommande",
  select: "contents.products.id status.id contents.products.quantity customerData",
};

const currentAchatPopulate = {
  path: "currentAchat",
  select:
    "contents.products.id status.id contents.products.quantity customerData",
};

const useByListesPopulate = {
  path: "useByListes",
  select: "school.name classe.name allProducts._id",
};
