// productsPOST.js
const express = require("express");
const router = express.Router();
const ProductsController = require("../../Controllers/ProductsController");

const productsPOST = (db) => {
  router.post("/AddProduct", async (req, res) => {
    ProductsController.addProduct(req, res, db);
  });

  router.post("/AddCategory", async (req, res) => {
    ProductsController.addCategory(req, res, db);
  });

  router.post("/UploadImage", async (req, res) => {
    ProductsController.uploadImage(req, res, db);
  });

  return router;
};

module.exports = productsPOST;
