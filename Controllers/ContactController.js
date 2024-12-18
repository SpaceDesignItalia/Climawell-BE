// controller/PermissionController.js
const ContactModel = require("../Models/ContactModel");

class ContactController {
  static async GetAllPrivate(res, db) {
    try {
      const contacts = await ContactModel.GetAllPrivate(db);
      res.status(200).json(contacts);
    } catch (error) {
      console.error("Errore nell'recuperare i clienti:", error);
    }
  }

  static async GetAllCompany(res, db) {
    try {
      const contacts = await ContactModel.GetAllCompany(db);
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

      console.log(req.body);
      console.log("Contact Data:", JSON.parse(ContactData));
      console.log("Contact Type:", ContactType);
      console.log("Privacy File:", PrivacyFile);

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
}

module.exports = ContactController;
