// productsRoutes.js
const express = require("express");
const router = express.Router();
const productsGET = require("./productsGET");
const productsPOST = require("./productsPOST");
const productsUPDATE = require("./productsUPDATE");
const productsDELETE = require("./productsDELETE");

const Products = (db) => {
  router.use("/GET", productsGET(db));
  router.use("/POST", productsPOST(db));
  router.use("/UPDATE", productsUPDATE(db));
  router.use("/DELETE", productsDELETE(db));
  return router;
};

module.exports = Products;
