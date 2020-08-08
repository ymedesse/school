const express = require("express");
const { requireSignin, isAdmin, isAuth } = require("../controllers/auth");
const { userById } = require("../controllers/user");
exports.routeHelper = (
  name,
  pluriName,
  create,
  read,
  remove,
  update,
  list,
  byId,
  validator,
  router,
  moreRoutes,
  removeMany,
  updateMany,
  isSupUser
) => {
  if (create)
    router.post(
      `/${name}/create/:userId`,
      requireSignin,
      isAuth,
      isSupUser ? isSupUser : isAdmin,
      validator,
      create
    );

  // eslint-disable-next-line no-

  update &&
    router.put(
      `/${name}/:${name}Id/:userId`,
      requireSignin,
      isAuth,
      isSupUser ? isSupUser : isAdmin,
      validator,
      update
    );

  updateMany &&
    router.post(
      `/${pluriName}/:userId`,
      requireSignin,
      isSupUser ? isSupUser : isAdmin,
      isAuth,
      updateMany
    );

  remove &&
    router.delete(
      `/${name}/:${name}Id/:userId`,
      requireSignin,
      isAuth,
      isSupUser ? isSupUser : isAdmin,
      remove
    );

  removeMany &&
    router.delete(
      `/${pluriName}/:userId`,
      requireSignin,
      isAuth,
      isSupUser ? isSupUser : isAdmin,
      removeMany
    );

  moreRoutes && moreRoutes();

  if (read) {
    router.get(
      `/${name}/:${name}Id/:userId`,
      requireSignin,
      isAuth,
      isSupUser ? isSupUser : isAdmin,
      read
    );
    !isSupUser && router.get(`/${name}/:${name}Id`, read);
  }

  list &&
    router.get(
      `/${pluriName}/:userId`,
      requireSignin,
      isAuth,
      isSupUser ? isSupUser : isAdmin,
      list
    );

  // paramètre dans la route
  router.param("userId", userById);
  router.param(`${name}Id`, byId);

  return router;
};
