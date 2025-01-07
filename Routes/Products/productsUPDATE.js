// productsUpdate.js
const express = require("express");
const router = express.Router();
const ProductsController = require("../../Controllers/ProductsController");
const authenticateMiddleware = require("../../middlewares/Services/Authentication/Authmiddleware");

const productsUPDATE = (db) => {
  // Definisci le route Update qui

  router.put("/UpdateCategory", authenticateMiddleware, (req, res) => {
    ProductsController.updateCategory(req, res, db);
  });
  router.put("/UpdateProduct", authenticateMiddleware, (req, res) => {
    ProductsController.updateProduct(req, res, db);
  });
  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = productsUPDATE;
