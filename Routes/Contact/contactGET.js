// authenticationGET.js
const express = require("express");
const router = express.Router();
const ContactController = require("../../Controllers/ContactController");
const authenticateMiddleware = require("../../middlewares/Services/Authentication/Authmiddleware");

const contactGET = (db) => {
  // Definisci le route POST qui

  router.get("/GetAllPrivate", authenticateMiddleware, (req, res) => {
    ContactController.GetAllPrivate(res, db);
  });

  router.get("/GetAllCompany", authenticateMiddleware, (req, res) => {
    ContactController.GetAllCompany(res, db);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = contactGET;
