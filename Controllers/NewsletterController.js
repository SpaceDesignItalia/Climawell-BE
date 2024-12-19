// controller/PermissionController.js
const NewsletterModel = require("../Models/NewsletterModel");

class NewsletterController {

  static async GetAllEmail(res, db) {
    try {
      const newsletter = await NewsletterModel.GetAllEmail(db);
      res.status(200).json(newsletter);
    } catch (error) {
      console.error("Errore nell'recuperare i clienti:", error);
    }
  }

 
  static async PostEmail(req, res, db) {
    try {
      const email = req.body.email;
      const result = await NewsletterModel.PostEmail(db, email);
      res.status(200).json({
        message: "Iscritto con successo alla newsletter.",
        subscriber: result.rows[0],
      });
    } catch (error) {
      console.error("Errore durante l'iscrizione:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }
}
module.exports = NewsletterController;
