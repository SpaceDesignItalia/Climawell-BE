// campaignRoutes.js
const express = require("express");
const router = express.Router();
const campaignPOST = require("./campaignPOST");

const Contact = (db) => {
  router.use("/POST", campaignPOST(db)); // Passa il database a stafferPOST
  return router;
};

module.exports = Contact;
