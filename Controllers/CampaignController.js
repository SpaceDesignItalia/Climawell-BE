// controller/CampaignController.js
const CampaignModel = require("../Models/CampaignModel");

class CampaignController {
  static async GetAllEmailCampaigns(req, res, db) {
    try {
      const campaigns = await CampaignModel.GetAllEmailCampaigns(db);

      res.status(200).send(campaigns);
    } catch (error) {
      console.error("Errore nel recupero delle campagne:", error);
      res.status(500).send("Errore nel recupero delle campagne.");
    }
  }

  static async GetAllWhatsappCampaigns(req, res, db) {
    try {
      const campaigns = await CampaignModel.GetAllWhatsappCampaigns(db);

      res.status(200).send(campaigns);
    } catch (error) {
      console.error("Errore nel recupero delle campagne:", error);
      res.status(500).send("Errore nel recupero delle campagne.");
    }
  }

  static async SearchEmailCampaignByTitle(req, res, db) {
    try {
      const Title = req.query.Title;
      const campaigns = await CampaignModel.SearchEmailCampaignByTitle(
        db,
        Title
      );

      res.status(200).send(campaigns);
    } catch (error) {
      console.error("Errore nel recupero delle campagne:", error);
      res.status(500).send("Errore nel recupero delle campagne.");
    }
  }

  static async SearchWhatsappCampaignByTitle(req, res, db) {
    try {
      const Title = req.query.Title;
      const campaigns = await CampaignModel.SearchWhatsappCampaignByTitle(
        db,
        Title
      );

      res.status(200).send(campaigns);
    } catch (error) {
      console.error("Errore nel recupero delle campagne:", error);
      res.status(500).send("Errore nel recupero delle campagne.");
    }
  }

  static async GetNewCampaignsThisMonth(req, res, db) {
    try {
      const MonthEmailCampaigns =
        await CampaignModel.GetNewEmailCampaignsThisMonth(db);
      const MonthWhatsappCampaigns =
        await CampaignModel.GetNewWhatsappCampaignsThisMonth(db);
      const campaigns =
        MonthEmailCampaigns.length + MonthWhatsappCampaigns.length;

      res.status(200).send({ campaigns });
    } catch (error) {
      console.error("Errore nel recupero delle campagne:", error);
      res.status(500).send("Errore nel recupero delle campagne.");
    }
  }

  static async AddNewCampaign(req, res, db) {
    try {
      const CampaignType = req.body.CampaignType;
      const ContactType = req.body.ContactType;
      const CampaignImages = req.files;
      const Cap = req.body.Cap;
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
        CampaignImages,
        Cap
      );

      res.status(201).send("Campagna aggiunta con successo.");
    } catch (error) {
      console.error("Errore nell'aggiungere la campagna:", error);
      res.status(500).send("Aggiunta della campagna fallita.");
    }
  }

  static async DeleteEmailCampaign(req, res, db) {
    try {
      const CampaignId = req.query.CampaignId;

      await CampaignModel.DeleteEmailCampaign(db, CampaignId);

      res.status(200).send("Campagna eliminata con successo.");
    } catch (error) {
      console.error("Errore nell'eliminare la campagna:", error);
      res.status(500).send("Errore nell'eliminare la campagna.");
    }
  }

  static async DeleteWhatsappCampaign(req, res, db) {
    try {
      const CampaignId = req.query.CampaignId;

      await CampaignModel.DeleteWhatsappCampaign(db, CampaignId);

      res.status(200).send("Campagna eliminata con successo.");
    } catch (error) {
      console.error("Errore nell'eliminare la campagna:", error);
      res.status(500).send("Errore nell'eliminare la campagna.");
    }
  }

  static async CheckWhatsappBlock(req, res, db) {
    try {
      const blocked = await CampaignModel.CheckWhatsappBlock(db);

      res.status(200).send({ blocked });
    } catch (error) {
      console.error("Errore nel verificare il blocco:", error);
      res.status(500).send("Errore nel verificare il blocco.");
    }
  }
}

module.exports = CampaignController;
