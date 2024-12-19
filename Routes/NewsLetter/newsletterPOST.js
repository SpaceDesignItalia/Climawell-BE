// productsPOST.js
const express = require("express");
const router = express.Router();
const NewsletterController = require("../../Controllers/NewsletterController");

const newsletterPOST = (db) => {
  // Definisci le route POST qui

  router.post("/PostEmail", (req, res) => {
    NewsletterController.PostEmail(req, res, db);
  });
  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = newsletterPOST;
