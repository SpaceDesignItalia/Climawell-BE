// productsGET.js
const express = require("express");
const router = express.Router();
const ProductsController = require("../../Controllers/ProductsController");
const authenticateMiddleware = require("../../middlewares/Services/Authentication/Authmiddleware");

const productsGET = (db) => {
  // Definisci le route GET qui
  router.get("/GetAllProducts", (req, res) => {
    ProductsController.getAllProducts(req, res, db);
  });
  router.get("/IsFeatured", authenticateMiddleware, (req, res) => {
    ProductsController.isFeatured(req, res, db);
  });
  router.get("/GetFeaturedProducts", (req, res) => {
    ProductsController.getFeaturedProducts(req, res, db);
  });
  router.get("/GetProductById", (req, res) => {
    ProductsController.getProductById(req, res, db);
  });
  router.get("/GetCategoryById", authenticateMiddleware, (req, res) => {
    ProductsController.getCategoryById(req, res, db);
  });
  router.get("/GetImagesByProductId", (req, res) => {
    ProductsController.getImagesByProductId(req, res, db);
  });
  router.get("/GetAllCategories", (req, res) => {
    ProductsController.getAllCategories(req, res, db);
  });
  router.get("/SearchProductByName", (req, res) => {
    ProductsController.searchProductByName(req, res, db);
  });
  router.get("/SearchFeaturedProductByName", (req, res) => {
    ProductsController.searchProductByName(req, res, db);
  });
  router.get("/OrderProductsBy", (req, res) => {
    ProductsController.orderProductsBy(req, res, db);
  });
  router.get("/OrderFeaturedProductsBy", (req, res) => {
    ProductsController.orderFeaturedProductsBy(req, res, db);
  });
  router.get("/SearchCategoryByName", authenticateMiddleware, (req, res) => {
    ProductsController.searchCategoryByName(req, res, db);
  });

  return router;
};

module.exports = productsGET;
