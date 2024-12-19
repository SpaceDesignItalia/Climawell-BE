// authenticationRoutes.js
const express = require("express");
const router = express.Router();
const contactGET = require("./contactGET");
const contactPOST = require("./contactPOST");

const Contact = (db) => {
  router.use("/GET", contactGET(db)); // Passa il database a stafferGET
  router.use("/POST", contactPOST(db)); // Passa il database a stafferPOST
  return router;
};

module.exports = Contact;
