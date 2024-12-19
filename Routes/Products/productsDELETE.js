// productsDELETE.js
const express = require("express");
const router = express.Router();
const ProductsController = require("../../Controllers/ProductsController");

const productsDELETE = (db) => {
  // Definisci le route DELETE qui

  router.delete("/DeleteProduct/:id", (req, res) => {
    ProductsController.deleteProduct(req, res, db);
  });

  router.delete("/DeleteCategory/:id", (req, res) => {
    ProductsController.deleteCategory(req, res, db);
  });
  return router;
};

module.exports = productsDELETE;
