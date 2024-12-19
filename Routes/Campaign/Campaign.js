// campaignRoutes.js
const express = require("express");
const router = express.Router();
const campaignPOST = require("./campaignPOST");
const campaignGET = require("./campaignGET");

const Contact = (db) => {
  router.use("/POST", campaignPOST(db)); // Passa il database a stafferPOST
  router.use("/GET", campaignGET(db)); // Passa il database a stafferGET
  return router;
};

module.exports = Contact;
