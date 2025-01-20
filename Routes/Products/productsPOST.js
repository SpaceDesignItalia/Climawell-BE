// productsPOST.js
const express = require("express");
const router = express.Router();
const ProductsController = require("../../Controllers/ProductsController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authenticateMiddleware = require("../../middlewares/Services/Authentication/Authmiddleware");

// Ensure the upload directory exists
const uploadDir = "./public/uploads/ProductImages";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage to retain the original file extension
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({ storage: storage });

const productsPOST = (db) => {
  router.post(
    "/AddProduct",
    authenticateMiddleware,
    upload.array("files"),
    (req, res) => {
      ProductsController.addProduct(req, res, db);
    }
  );

  router.post("/AddCategory", authenticateMiddleware, (req, res) => {
    ProductsController.addCategory(req, res, db);
  });

  router.post("/UploadImage", authenticateMiddleware, (req, res) => {
    ProductsController.uploadImage(req, res, db);
  });

  router.post("/UploadProducts", authenticateMiddleware, (req, res) => {
    ProductsController.uploadProducts(req, res, db);
  });

  return router;
};

module.exports = productsPOST;
