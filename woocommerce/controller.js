/* eslint-disable no-console */
const Post = require("../models/post");
const { createLog } = require("../log/controller");
const { saveMany } = require("../controllers/post");
const { wooApi } = require("./api");

const { bulkUpdateModelValues } = require("../utils");

exports.synchronize = async (req, res) => {
  const { query } = req;

  const {
    per_page = 2,
    page = 1,
    orderby = "id",
    order = "asc",
    page_count = 2,
  } = query;
  let products = [];

  startingLog(req);

  for (let currentPage = page; currentPage <= page_count; currentPage++) {
    const { data, error } = await fetchProduct({
      per_page,
      currentPage,
      orderby,
      order,
    });
    if (error) {
      logError(req, error, products, currentPage);
      res.status(400).json({ error });
      break;
    }

    if (data && data.length === 0) break;

    if (data.length > 0) {
      const posts = formateToPosts([...data]);
      saveMany(res, posts, "id", true, () => {
        products = [...products, ...data];
      });
      console.log(data.length + " count fetched ......");
    }
  }

  logFinish(req, products);
  res.json({ count: products.length, products });
};

const fetchProduct = async ({ per_page, page, orderby, order }) => {
  return await wooApi
    .get("products/", { per_page, page, orderby, order })
    .then((response) => {
      const { data } = response;
      return { data };
    })
    .catch((error) => {
      return { error };
    })
    .finally(() => {
      // Always executed.
    });
};

const logError = async (req, error, products, currentPage) => {
  await createLog(req, {
    content: {
      message: error.message,
      idsFeched: products.map((item) => item.id),
      lastPage: currentPage,
    },
    type: "error",
    date: Date.now(),
    message: "woocomerce fetch failed",
  });
};

const startingLog = async (req) => {
  await createLog(req, {
    type: "info",
    message: "woocomerce syncronization started",
  });
};

const logFinish = async (req, products) => {
  await createLog(req, {
    content: {
      idsFeched: products.map((item) => item.id),
    },
    type: "info",
    date: Date.now(),
    message: "woocomerce fetching finish",
  });
};

const formateToPosts = (products) => {
  let posts = [];
  for (let i = 0; i < products.length; i++) {
    const element = products[i];
    posts.push({
      id: element.id,
      name: element.name,
      content: element,
    });
  }
  return posts;
};
