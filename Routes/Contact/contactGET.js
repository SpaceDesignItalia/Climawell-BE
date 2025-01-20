// authenticationGET.js
const express = require("express");
const router = express.Router();
const ContactController = require("../../Controllers/ContactController");
const authenticateMiddleware = require("../../middlewares/Services/Authentication/Authmiddleware");

const contactGET = (db) => {
  // Definisci le route POST qui

  router.get("/GetAllPrivate", authenticateMiddleware, (req, res) => {
    ContactController.GetAllPrivate(req, res, db);
  });

  router.get("/GetAllCompany", authenticateMiddleware, (req, res) => {
    ContactController.GetAllCompany(req, res, db);
  });

  router.get("/GetAllCaps", authenticateMiddleware, (req, res) => {
    ContactController.GetAllCaps(res, db);
  });

  router.get("/GetPrivateById", authenticateMiddleware, (req, res) => {
    ContactController.GetPrivateById(req, res, db);
  });

  router.get("/GetCompanyById", authenticateMiddleware, (req, res) => {
    ContactController.GetCompanyById(req, res, db);
  });

  router.get(
    "/SearchPrivateContactByEmail",
    authenticateMiddleware,
    (req, res) => {
      ContactController.SearchPrivateContactByEmail(req, res, db);
    }
  );
  router.get(
    "/SearchCompanyContactByEmail",
    authenticateMiddleware,
    (req, res) => {
      ContactController.SearchCompanyContactByEmail(req, res, db);
    }
  );

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = contactGET;
