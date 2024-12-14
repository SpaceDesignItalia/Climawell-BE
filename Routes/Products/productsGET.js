// productsGET.js
const express = require("express");
const router = express.Router();
const ProductsController = require("../../Controllers/ProductsController");

const productsGET = (db) => {
  // Definisci le route GET qui
  router.get("/GetAllProducts", (req, res) => {
    ProductsController.getAllProducts(req, res, db);
  });
  router.get("/GetCategoryById/:id", (req, res) => {
    ProductsController.getCategoryById(req, res, db);
  });
  router.get("/SearchProductByName", (req, res) => {
    ProductsController.searchProductByName(req, res, db);
  });
  return router;
};

module.exports = productsGET;
