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

  router.get("/CheckWhatsappBlock", authenticateMiddleware, (req, res) => {
    CampaignController.CheckWhatsappBlock(req, res, db);
  });

  // Route for GET requests
  router.get("/webhook", (req, res) => {
    const {
      "hub.mode": mode,
      "hub.challenge": challenge,
      "hub.verify_token": token,
    } = req.query;

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log("WEBHOOK VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.status(403).end();
    }
  });

  return router; // Return the router to allow usage by the main app
};

module.exports = campaignGET;
