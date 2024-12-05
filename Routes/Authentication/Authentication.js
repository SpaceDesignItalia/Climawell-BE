// authenticationRoutes.js
const express = require("express");
const router = express.Router();
const authenticationGET = require("./authenticationGET");
const authenticationPOST = require("./authenticationPOST");
const authenticationUPDATE = require("./authenticationUPDATE");

const Authentication = (db) => {
  router.use("/GET", authenticationGET(db)); // Passa il database a stafferGET
  router.use("/POST", authenticationPOST(db)); // Passa il database a stafferPOST
  router.use("/UPDATE", authenticationUPDATE(db)); // Passa il database a stafferUPDATE
  return router;
};

module.exports = Authentication;
