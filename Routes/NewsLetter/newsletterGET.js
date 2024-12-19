// authenticationGET.js
const express = require("express");
const router = express.Router();
const NewsletterController = require("../../Controllers/NewsletterController");
const authenticateMiddleware = require("../../middlewares/Services/Authentication/Authmiddleware");

const newsletterGET = (db) => {
  // Definisci le route POST qui

  router.get("/GetAllPrivate", authenticateMiddleware, (req, res) => {
    NewsletterController.GetAllPrivate(res, db);
  });

  router.get("/GetAllCompany", authenticateMiddleware, (req, res) => {
    NewsletterController.GetAllCompany(res, db);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = newsletterGET;
