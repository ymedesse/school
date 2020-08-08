/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const query = require("querystring");
const Category = require("../models/category");
const { controllerHelper } = require("../utils/simpleControllerFactory");
const { slug } = require("../utils");
const { errorHandler } = require("../helpers/dbErrorHandler");
const { validationResult } = require("express-validator");
const { bulkUpdateModelValues, removeArrayFromArray } = require("../utils");
const { Encoder } = require("../utils/Encoder");

// or to set it to encode to html entities e.g & instead of &
Encoder.EncodeType = "entity";

const { create, read, update, remove, byId, list } = controllerHelper(
  Category,
  "category",
  true
);

const directSycronization = (req, res) => {
  const { profile } = req;
  const { categories } = req.body;
  if (categories.length > 0) {
    const data = formate(profile, [...categories]);
    saveMany(res, data, "id", true, (results) => {
      res.json({ suucess: "Syncronisation effectuée avec succès", results });
    });
  } else {
    res.status(400).json({ error: "empty value", file: "category" });
  }
};

const formate = (user, categories) => {
  const newItems = [];
  for (let i = 0; i < categories.length; i++) {
    const element = categories[i];
    newItems.push({
      id: element.id,
      name: element.name,
      content: element,
      createBy: user._id,
      updateBy: user._id,
    });
  }
  return newItems;
};

const saveMany = (res, values, key = "id", createNew, next) => {
  bulkUpdateModelValues(Category, values, key, createNew)
    .then(async (idArray) => {
      !next && res.json({ idArray });
      next && next(idArray);
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.refreshCategoriesPath = (req, res) => {
  Category.find({}, async (err, categories) => {
    if (err) return res.status(400).json({ error: err });
    const results = await refreshPath(categories);
    res.json({ results });
  });
};

const refreshPath = async (categories) => {
  const getParentFullPath = async (id) => {
    const index = categories.findIndex((item) => {
      // console.log({
      //   ite: parseInt(item.id),
      //   ori: parseInt(id),
      //   equal: parseInt(item.id) === parseInt(id),
      // });
      return parseInt(item.id) === parseInt(id);
    });
    // console.log({ index, id, m: parseInt(categories[4].id) });
    const element = categories[index];
    const { parent, slug } = element.content;
    let fullPath = "";
    if (element.path) {
      fullPath = element.path;
    } else {
      fullPath = parent === 0 ? slug + "/" : await getParentFullPath(parent);
      categories[index] = { ...element, fullPath };
    }
    return fullPath;
  };

  for (let i = 0; i < categories.length; i++) {
    const element = categories[i];
    const { parent, slug } = element.content;
    element.fullPath =
      parent === 0 ? slug + "/" : await getParentFullPath(parent);
  }
  return categories;
};

exports.listContents = (req, res) => {
  Category.find({})
    .select("content.name content.id content.slug")
    .find(async (err, results) => {
      if (err) return res.status(400).json({ error: err });
      const categories = results.map((item) => item.content);
      res.json({ categories });
    });
};

exports.listContentSlug = (req, res) => {
  Category.find({ "content.count": { $gt: 0 } })
    .select("content.slug")
    .find(async (err, results) => {
      if (err) return res.status(400).json({ error: err });
      const categories = results.map((item) => item.content.slug);
      res.json(categories);
    });
};

const fecthChildren = (id, list) => {};

exports.hierachie = async (req, res) => {
  Category.find({})
    .select("content.id content.name content.slug content.parent")
    .find(async (err, results) => {
      if (err) return res.status(400).json({ error: err });

      const categories = results.map((item) => ({
        ...item.content,
        fullName: item.content.id + " " + item.content.slug,
      }));

      const hierachie = await formateArbre(categories);
      // const noChild = hierachie.filter(item => item.children.length === 0);
      // const haveChildren = await removeArrayFromArray([...hierachie], noChild, "id");
      let essentials = [];
      for (let i = 0; i < hierachie.length; i++) {
        const element = hierachie[i];
        // if ([369, 395, 381, 401].indexOf(element.id) !== -1)
        essentials = [...essentials, { ...element }];
      }
      const full = await genereFullPath(hierachie);
      // const simple = await getText(essentials);
      res.json(essentials);
    });
};

const getAbre = async (id, initList) => {
  let children = initList.filter((item) => item.parent === parseInt(id));
  let reste = await removeArrayFromArray([...initList], children, "id");

  for (let i = 0; i < children.length; i++) {
    const elm = children[i];
    const { children: eChild, reste: eReste } = await getAbre(elm.id, reste);
    reste = eReste;
    children[i] = { ...elm, children: eChild };
  }
  return { children, reste };
};

const formateArbre = async (categories) => {
  const parents = categories.filter((item) => item.parent === 0);
  let list = await removeArrayFromArray([...categories], parents, "id");
  for (let i = 0; i < parents.length; i++) {
    const parent = parents[i];
    const { children, reste } = await getAbre(parent.id, list);
    list = reste;
    parents[i] = { ...parent, children };
  }

  return parents;
};

const getText = async (categories = []) => {
  for (let i = 0; i < categories.length; i++) {
    const element = categories[i];
    categories[i] = {
      name: element.fullName,
      children: await getText(element.children),
    };
  }
  return categories;
};

const genereFullPath = async (categories = [], results = [], root = "") => {
  for (let i = 0; i < categories.length; i++) {
    const element = categories[i];
    const fullPath = root + element.slug + "/";
    const path = root;
    const resultsFomChild = await genereFullPath(
      element.children,
      results,
      fullPath
    );
    results = [
      ...resultsFomChild,
      { ...element, children: undefined, fullPath, path },
    ];
  }
  return results;
};

exports.updateFullPath = (req, res) => {
  Category.find({})
    .select("content")
    .find(async (err, results) => {
      if (err) return res.status(400).json({ error: err });

      let categories = results.map((item) => ({
        ...item.content,
      }));
      categories = await formateArbre(categories);
      req.body.categories = await genereFullPath(categories);

      directSycronization(req, res);
    });
};

exports.list = list;
exports.create = create;
exports.update = update;
exports.directSycronization = directSycronization;
exports.categoryById = byId;
exports.read = read;
exports.remove = remove;
exports.saveMany = saveMany;
