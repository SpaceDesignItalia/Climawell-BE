// authenticationPOST.js
const express = require("express");
const router = express.Router();
const AuthenticationController = require("../../Controllers/AuthenticationController");

const authenticationPOST = (db) => {
  // Definisci le route POST qui
  router.post("/Login", (req, res) => {
    AuthenticationController.login(req, res, db);
  });

  router.post("/PasswordRecovery", (req, res) => {
    AuthenticationController.passwordRecovery(req, res, db);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = authenticationPOST;
