const express = require("express");
const router = express.Router();
const CampaignController = require("../../Controllers/CampaignController");
const authenticateMiddleware = require("../../middlewares/Services/Authentication/Authmiddleware");

const campaignDELETE = (db) => {
  router.delete("/DeleteEmailCampaign", authenticateMiddleware, (req, res) => {
    CampaignController.DeleteEmailCampaign(req, res, db);
  });

  router.delete(
    "/DeleteWhatsappCampaign",
    authenticateMiddleware,
    (req, res) => {
      CampaignController.DeleteWhatsappCampaign(req, res, db);
    }
  );
};

module.exports = campaignDELETE;
