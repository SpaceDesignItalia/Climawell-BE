const express = require("express");
const router = express.Router();
const CampaignController = require("../../Controllers/CampaignController");
const authenticateMiddleware = require("../../middlewares/Services/Authentication/Authmiddleware");

const campaignGET = (db) => {
  router.get("/GetAllEmailCampaigns", authenticateMiddleware, (req, res) => {
    CampaignController.GetAllEmailCampaigns(req, res, db);
  });

  router.get("/GetAllWhatsappCampaigns", authenticateMiddleware, (req, res) => {
    CampaignController.GetAllWhatsappCampaigns(req, res, db);
  });

  router.get(
    "/GetNewCampaignsThisMonth",
    authenticateMiddleware,
    (req, res) => {
      CampaignController.GetNewCampaignsThisMonth(req, res, db);
    }
  );

  router.get(
    "/SearchEmailCampaignByTitle",
    authenticateMiddleware,
    (req, res) => {
      CampaignController.SearchEmailCampaignByTitle(req, res, db);
    }
  );

  router.get(
    "/SearchWhatsappCampaignByTitle",
    authenticateMiddleware,
    (req, res) => {
      CampaignController.SearchWhatsappCampaignByTitle(req, res, db);
    }
  );

  return router; // Return the router to allow usage by the main app
};

module.exports = campaignGET;
