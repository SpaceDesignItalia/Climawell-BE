// authenticationUpdate.js
const express = require("express");
const router = express.Router();
const AuthenticationController = require("../../Controllers/AuthenticationController");

const authenticationUPDATE = (db) => {
  // Definisci le route Update qui
  router.put("/ResetPassword", async (req, res) => {
    AuthenticationController.ResetPassword(req, res, db);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = authenticationUPDATE;
