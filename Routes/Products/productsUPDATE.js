// productsUpdate.js
const express = require("express");
const router = express.Router();
const ProductsController = require("../../Controllers/ProductsController");
const authenticateMiddleware = require("../../middlewares/Services/Authentication/Authmiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

const productsUPDATE = (db) => {
  // Definisci le route Update qui

  router.put("/UpdateCategory", authenticateMiddleware, (req, res) => {
    ProductsController.updateCategory(req, res, db);
  });

  router.post(
    "/UpdateProduct",
    authenticateMiddleware,
    upload.array("files"),
    (req, res) => {
      ProductsController.updateProduct(req, res, db);
    }
  );
  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = productsUPDATE;
