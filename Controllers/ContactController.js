// controller/PermissionController.js
const ContactModel = require("../Models/ContactModel");

class ContactController {
  static async GetAllPrivate(req, res, db) {
    try {
      const isPremium = req.body.isPremium;
      const contacts = await ContactModel.GetAllPrivate(isPremium, db);
      res.status(200).json(contacts);
    } catch (error) {
      console.error("Errore nell'recuperare i clienti:", error);
    }
  }

  static async GetAllCompany(req, res, db) {
    try {
      const isPremium = req.body.isPremium;
      const contacts = await ContactModel.GetAllCompany(isPremium, db);
      res.status(200).json(contacts);
    } catch (error) {
      console.error("Errore nell'recuperare i clienti:", error);
    }
  }

  static async AddNewContact(req, res, db) {
    try {
      const ContactData = req.body.ContactData;
      const ContactType = req.body.ContactType;
      const PrivacyFile = req.file;

      // Verifica se PrivacyFile è definito, altrimenti passa null
      const privacyFileName = PrivacyFile ? PrivacyFile.filename : null;

      // Passa i dati al modello per l'inserimento
      await ContactModel.AddContact(
        db,
        JSON.parse(ContactData),
        ContactType,
        privacyFileName
      );

      res.status(201).send("Cliente aggiunto con successo.");
    } catch (error) {
      console.error("Errore nell'aggiungere il cliente:", error);

      // Gestione degli errori
      if (
        error.message === "Esiste già un cliente con questa email." ||
        error.message === "Esiste già un'azienda con questo nome e Partita IVA."
      ) {
        res.status(409).send("Esiste un altro cliente con questi dati.");
      } else {
        // Altrimenti, restituisce un errore generico
        res.status(500).send("Aggiunta del cliente fallita.");
      }
    }
  }

  static async UploadContacts(req, res, db) {
    try {
      const { companies, customers } = req.body;

      await ContactModel.UploadContacts(db, companies, customers);
      res.status(201).send("Clienti aggiunti con successo.");
    } catch (error) {
      console.error("Errore nell'aggiungere i clienti:", error);
      res.status(500).send("Aggiunta dei clienti fallita.");
    }
  }

  static async DeletePrivateContact(req, res, db) {
    try {
      const { CampaignToken } = req.body;
      await ContactModel.DeletePrivateContact(db, CampaignToken);
      res.status(200).send("Cliente eliminato con successo.");
    } catch (error) {
      console.error("Errore nell'eliminare il cliente:", error);
      res.status(500).send("Eliminazione del cliente fallita.");
    }
  }

  static async DeleteCompanyContact(req, res, db) {
    try {
      const { CampaignToken } = req.body;
      await ContactModel.DeleteCompanyContact(db, CampaignToken);
      res.status(200).send("Azienda eliminata con successo.");
    } catch (error) {
      console.error("Errore nell'eliminare l'azienda:", error);
      res.status(500).send("Eliminazione dell'azienda fallita.");
    }
  }

  static async GetAllCaps(res, db) {
    try {
      const caps = await ContactModel.GetAllCaps(db);
      res.status(200).json(caps);
    } catch (error) {
      console.error("Errore nell'recuperare i CAP:", error);
    }
  }
}

module.exports = ContactController;
