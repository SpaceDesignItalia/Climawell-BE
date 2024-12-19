// controller/CampaignController.js
const CampaignModel = require("../Models/CampaignModel");

class CampaignController {
  static async AddNewCampaign(req, res, db) {
    try {
      const CampaignType = req.body.CampaignType;
      const ContactType = req.body.ContactType;
      const CampaignImages = req.files;
      let CampaignData;

      if (CampaignType == "email") {
        CampaignData = req.body.EmailCampaignData;
      } else if (CampaignType == "whatsapp") {
        CampaignData = req.body.WhatsappCampaignData;
      } else {
        CampaignData = req.body.EmailCampaignData;
      }

      // Passa i dati al modello per l'inserimento
      await CampaignModel.AddNewCampaign(
        db,
        JSON.parse(CampaignData),
        CampaignType,
        ContactType,
        CampaignImages
      );

      res.status(201).send("Campagna aggiunta con successo.");
    } catch (error) {
      console.error("Errore nell'aggiungere la campagna:", error);

      // Gestione degli errori
      if (
        error.message === "Esiste già una campagna con questo nome." ||
        error.message === "Esiste già una campagna con questo codice."
      ) {
        res.status(409).send("Esiste un'altra campagna con questi dati.");
      } else {
        // Altrimenti, restituisce un errore generico
        res.status(500).send("Aggiunta della campagna fallita.");
      }
    }
  }
}

module.exports = CampaignController;
