// productsUpdate.js
const express = require("express");
const router = express.Router();
const ProductsController = require("../../Controllers/ProductsController");

const productsUPDATE = (db) => {
  // Definisci le route Update qui

  router.put("/UpdateCategory", (req, res) => {
    ProductsController.updateCategory(req, res, db);
  });
  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = productsUPDATE;
