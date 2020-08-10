/* eslint-disable no-console */
const School = require("../models/school");
const { validationResult } = require("express-validator");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { controllerHelper } = require("../utils/simpleControllerFactory");

const { create, update, byId, list } = controllerHelper(School, "school", true);

exports.create = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  const { profile } = req;
  const newSchool = req.body;
  const name = newSchool.name.trim() || "";

  req.body.updateBy = profile;
  req.body.createBy = profile;
  req.body.name = name;
  create(req, res, (school) =>
    res.json({ school: school.depopulate("createBy").depopulate("updateBy") })
  );
};

exports.update = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  const { profile /*school*/ } = req;
  req.body.updateBy = profile;
  update(req, res, (school) =>
    res.json({
      school: school.depopulate("createBy").depopulate("updateBy"),
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
    status,
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

  const statusFilter = status ? { status } : {};

  console.log(textFilter);
  let filter = {
    ...textFilter,
    ...restQuery,
    ...statusFilter,
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
      select: "slug name phone address mail image status",
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

  School.paginate(filter, option, (err, data) => {
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
  const { school } = req;
  return res.json({ school: school });
};

exports.remove = async (req, res, next) => {
  const { id } = req.body;

  School.findOneAndRemove({ id }).exec((error, result) => {
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

  School.deleteMany({ _id: { $in: ids } }).exec((error, result) => {
    if (error) {
      res.status(400).json({ error: errorHandler(error) });
    } else {
      res.json({ suucess: "Suppression effectuée avec succès", result });
    }
  });
};

exports.bySlug = (req, res, next, id) => {
  School.findOne({ slug: id }).exec((err, docValue) => {
    if (err | !docValue) {
      console.log({ error: err });
      return res.status(400).json({
        error: "school not found",
      });
    }
    req.school = docValue;
    next();
  });
};

exports.byId = byId;
exports.list = list;
