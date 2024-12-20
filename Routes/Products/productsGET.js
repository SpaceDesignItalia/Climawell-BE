// productsGET.js
const express = require("express");
const router = express.Router();
const ProductsController = require("../../Controllers/ProductsController");

const productsGET = (db) => {
  // Definisci le route GET qui
  router.get("/GetAllProducts", (req, res) => {
    ProductsController.getAllProducts(req, res, db);
  });
  router.get("/IsFeatured/:id", (req, res) => {
    ProductsController.isFeatured(req, res, db);
  });
  router.get("/GetFeaturedProducts", (req, res) => {
    ProductsController.getFeaturedProducts(req, res, db);
  });
  router.get("/GetProductById/:id", (req, res) => {
    ProductsController.getProductById(req, res, db);
  });
  router.get("/GetCategoryById/:id", (req, res) => {
    ProductsController.getCategoryById(req, res, db);
  });
  router.get("/GetImagesByProductId/:id", (req, res) => {
    ProductsController.getImagesByProductId(req, res, db);
  });
  router.get("/GetAllCategories", (req, res) => {
    ProductsController.getAllCategories(req, res, db);
  });
  router.get("/GetProductModelGroupById/:id", (req, res) => {
    ProductsController.getProductModelGroupById(req, res, db);
  });
  router.get("/SearchProductByName", (req, res) => {
    ProductsController.searchProductByName(req, res, db);
  });
  router.get("/GetImageByPath/:path", (req, res) => {
    ProductsController.getImageByPath(req, res, db);
  });
  return router;
};

module.exports = productsGET;
