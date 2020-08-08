const { check } = require("express-validator");

exports.userSignupValidator = [
  check("lastName", "Vous devez saisir un nom et prénom")
    .not()
    .isEmpty(),
  check(
    "email",
    " l'address mail doit contenir entre 3 et 32 caractères y compris '@'"
  ).isEmail(),
  check("password", "Password is required")
    .not()
    .isEmpty(),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caractères")
    .matches(/\d/)
    .withMessage("Le mot de passe doit contenir au moins un chiffre"),
];

exports.categoryCreateValidator = [
  check("name", "Vous devez saisir un nom")
    .not()
    .isEmpty(),
];

exports.userUpdateProfileValidator = [
  check("firstName", "Vous devez saisir un nom")
    .not()
    .isEmpty(),
  check("lastName", "Vous devez saisir un prénom")
    .not()
    .isEmpty(),
  check(
    "email",
    " l'address mail doit contenir entre 3 et 32 caractères y compris '@'"
  ).isEmail(),
];

exports.addressCreateValidator = [
  check("name", "Vous devez saisir un nom du réceptionnaire")
    .not()
    .isEmpty(),
  check("description", "Vous devez inserer une address")
    .not()
    .isEmpty(),
  check("phone", " Vous devez saisir au moins une address à contacter")
    .not()
    .isEmpty(),
];

exports.fileValidator = [
  check("name", "Vous devez saisir un libellé")
    .not()
    .isEmpty(),
];

exports.storeValidator = [
  check("name", "Vous devez saisir le nom de la boutique")
    .not()
    .isEmpty(),
];

exports.productValidator = [
  check("name", "Vous devez saisir un nom pour le produit")
    .not()
    .isEmpty(),
  check("price", "Vous devez saisir un prix")
    .not()
    .isEmpty(),
];

exports.promoValidator = [
  check("name", "Vous devez saisir un nom pour la promo")
    .not()
    .isEmpty(),
  check("code", "Vous devez définir un code pour la promo")
    .not()
    .isEmpty(),
];

exports.catalogValidator = [
  check("price", "Vous devez définir un code pour la promo")
    .not()
    .isEmpty(),

  check("store", "Vous devez définir le magasin ")
    .not()
    .isEmpty(),
];
exports.wholesaleValidator = [
  check("price", "Vous devez définir un code pour la promo")
    .not()
    .isEmpty(),

  check("ugs", "Vous devez définir un code isbn ou ugs ")
    .not()
    .isEmpty(),
];

exports.variantPriceValidator = [
  check("price", "Vous devez définir un code pour la promo")
    .not()
    .isEmpty(),
];

exports.tagValidator = [
  check("name", "Vous devez définir un nom")
    .not()
    .isEmpty(),

  check("type", "Vous devez spécifier le type ")
    .not()
    .isEmpty(),
];

exports.providerValidator = [
  check("name", "Vous devez saisir un nom pour le fournisseur")
    .not()
    .isEmpty(),
];
exports.postValidator = [
  check("content", "Vous devez saisir un nom pour le ce post")
    .not()
    .isEmpty(),
];

exports.categoryValidator = [
  check("content", "Vous devez saisir le contenu pour cette catégorie")
    .not()
    .isEmpty(),
];

exports.settingValidator = [
  check("content", "Vous  devez saisir le contenu pour cette configuration")
    .not()
    .isEmpty(),
];

exports.accessValidator = [
  check("name", "Vous  devez saisir un nom")
    .not()
    .isEmpty(),
];

exports.roleValidator = [
  check("name", "Vous  devez saisir un nom")
    .not()
    .isEmpty(),
];

exports.paymentMethodValidator = [
  check("name", "Vous  devez saisir un nom")
    .not()
    .isEmpty(),
];

exports.schoolValidator = [
  check("name", "Vous  devez saisir le nom de l'école ")
    .not()
    .isEmpty(),
  check("phone", "Vous  devez saisir le au minimum un numéro de téléphne")
    .not()
    .isEmpty(),
];

exports.classeValidator = [
  check("name", "Vous  devez saisir le nom de la classe ")
    .not()
    .isEmpty(),
  check("code", "Vous  devez saisir le code de la classe")
    .not()
    .isEmpty(),
];

exports.cityValidator = [
  check("name", "Vous  devez saisir le nom de la ville ")
    .not()
    .isEmpty(),
];

exports.listValidator = [
  check("products", "Vous devez fournir la listes des produits pour la liste")
    .not()
    .isEmpty(),
  check("school", "Vous  devez définir une école pour cette liste")
    .not()
    .isEmpty(),
  check("classe", "Vous  devez définir une classe pour cette liste")
    .not()
    .isEmpty(),
];

exports.orderStatusValidator = [
  check("status", "Vous devez spécifier un status")
    .not()
    .isEmpty(),
];

exports.variantValidator = [];
