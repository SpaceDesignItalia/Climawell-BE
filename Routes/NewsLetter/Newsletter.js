// authenticationRoutes.js
const express = require("express");
const router = express.Router();
const newsletterGET = require("./newsletterGET");
const newsletterPOST = require("./newsletterPOST");

const Newsletter = (db) => {
  router.use("/GET", newsletterGET(db)); // Passa il database a stafferGET
  router.use("/POST", newsletterPOST(db)); // Passa il database a stafferPOST
  return router;
};

module.exports = Newsletter;
