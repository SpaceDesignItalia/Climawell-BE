// campaignPOST.js
const express = require("express");
const router = express.Router();
const CampaignController = require("../../Controllers/CampaignController");
const authenticateMiddleware = require("../../middlewares/Services/Authentication/Authmiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the upload directory exists
const uploadDir = "./public/uploads/CampaignImages";
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

const campaignPOST = (db) => {
  // Definisci le route POST qui

  router.post(
    "/AddNewCampaign",
    upload.array("Images"),
    authenticateMiddleware,
    (req, res) => {
      CampaignController.AddNewCampaign(req, res, db);
    }
  );

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = campaignPOST;
