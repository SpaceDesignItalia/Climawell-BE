// productsPOST.js
const express = require("express");
const router = express.Router();
const ProductsController = require("../../Controllers/ProductsController");

const productsPOST = (db) => {
  router.post("/AddProduct", async (req, res) => {
    ProductsController.addProduct(req, res, db);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = productsPOST;
