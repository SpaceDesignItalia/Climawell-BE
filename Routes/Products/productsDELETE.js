// productsDELETE.js
const express = require("express");
const router = express.Router();
const ProductsController = require("../../Controllers/ProductsController");
const authenticateMiddleware = require("../../middlewares/Services/Authentication/Authmiddleware");

const productsDELETE = (db) => {
  // Definisci le route DELETE qui

  router.delete("/DeleteProduct/:id", authenticateMiddleware, (req, res) => {
    ProductsController.deleteProduct(req, res, db);
  });

  router.delete("/DeleteCategory", authenticateMiddleware, (req, res) => {
    ProductsController.deleteCategory(req, res, db);
  });
  return router;
};

module.exports = productsDELETE;
