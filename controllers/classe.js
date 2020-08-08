/* eslint-disable no-console */
const Classe = require("../models/classe");
const { validationResult } = require("express-validator");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { controllerHelper } = require("../utils/simpleControllerFactory");

const { create, update, byId, list } = controllerHelper(Classe, "classe", true);

exports.create = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  const { profile } = req;
  const newClasse = req.body;
  const name = newClasse.name.trim() || "";

  req.body.updateBy = profile;
  req.body.createBy = profile;
  req.body.name = name;
  create(req, res, (classe) =>
    res.json({ classe: classe.depopulate("createBy").depopulate("updateBy") })
  );
};

exports.update = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  const { profile /*classe*/ } = req;
  req.body.updateBy = profile;
  update(req, res, (classe) =>
    res.json({
      classe: classe.depopulate("createBy").depopulate("updateBy"),
    })
  );
  // });
};

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
    order = "asc",
    sortBy = "name",
    limit,
    offset,
    search,
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

  let filter = {
    ...textFilter,
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
      select: "slug name code ",
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

  Classe.paginate(filter, option, (err, data) => {
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

/**
 *
 * @param {*} user
 * @param {*} products
 */

exports.read = (req, res) => {
  const { classe } = req;
  return res.json({ classe: classe });
};

exports.remove = async (req, res, next) => {
  const { id } = req.body;

  Classe.findOneAndRemove({ id }).exec((error, result) => {
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

exports.removeMany = async (req, res) => {
  const { ids } = req.body;

  Classe.deleteMany({ _id: { $in: ids } }).exec((error, result) => {
    if (error) {
      res.status(400).json({ error: errorHandler(error) });
    } else {
      res.json({ suucess: "Suppression effectuée avec succès", result });
    }
  });
};

exports.bySlug = (req, res, next, id) => {
  Classe.findOne({ slug: id }).exec((err, docValue) => {
    if (err | !docValue) {
      console.log({ error: err });
      return res.status(400).json({
        error: "classe not found",
      });
    }
    req.classe = docValue;
    next();
  });
};

exports.byId = byId;
exports.list = list;
