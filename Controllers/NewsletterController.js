// controller/PermissionController.js
const NewsletterModel = require("../Models/NewsletterModel");

class ContactController {
  static async GetAllPrivate(res, db) {
    try {
      const contacts = await NewsletterModel.GetAllPrivate(db);
      res.status(200).json(contacts);
    } catch (error) {
      console.error("Errore nell'recuperare i clienti:", error);
    }
  }

  static async GetAllCompany(res, db) {
    try {
      const contacts = await NewsletterModel.GetAllCompany(db);
      res.status(200).json(contacts);
    } catch (error) {
      console.error("Errore nell'recuperare i clienti:", error);
    }
  }