const axios = require("axios");
const ContactModel = require("../../Models/ContactModel");
require("dotenv").config();
const fs = require("fs");
const FormData = require("form-data");

class Messages {
  /**
   * Invio messaggi privati (non premium) con immagine e testo.
   */
  static async sendPrivateMessage(title, description, imagePath, cap, Agente, db) {
    console.log("Inizio l'invio dei messaggi privati.");

    // Carica l'immagine e ottieni l'ID
    const imageId = await uploadImage(imagePath);

    // Ottieni tutti i contatti privati dal database
    const contacts = await ContactModel.GetPrivatesByCapAndAgente(cap, Agente, db);

    if (contacts.length > 250) {
      console.log("I contatti sono più di 250. Gestione a batch attivata.");

      // Imposta BlockWhatsappCampaign a true
      await db.query(
        `UPDATE public."Utils" SET value = true WHERE name = 'blockWhatsappCampaign'`
      );

      const batchSize = 250;
      let batchNumber = 0;

      // Dividi i contatti in batch
      while (batchNumber * batchSize < contacts.length) {
        const start = batchNumber * batchSize;
        const end = start + batchSize;
        const currentBatch = contacts.slice(start, end);

        console.log(
          `Invio batch ${batchNumber + 1}. Contatti da ${start + 1} a ${
            end > contacts.length ? contacts.length : end
          }.`
        );

        // Invia messaggi per il batch corrente
        await this.sendBatchPrivateMessages(currentBatch, title, description, imageId);

        batchNumber++;

        // Se ci sono altri batch, aspetta 26 ore
        if (batchNumber * batchSize < contacts.length) {
          console.log("Aspetto 26 ore prima del prossimo batch.");
          await new Promise((resolve) =>
            setTimeout(resolve, 26 * 60 * 60 * 1000)
          );
        }
      }

      // Reimposta BlockWhatsappCampaign a false
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );

      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      // Se i contatti sono meno di 250, invia tutto direttamente
      await this.sendBatchPrivateMessages(contacts, title, description, imageId);
      console.log("Tutti i messaggi sono stati inviati.");
    }
  }

  /**
   * Invio effettivo (batch) dei messaggi privati (non premium) con immagine e testo.
   */
  static async sendBatchPrivateMessages(contacts, title, description, imageId) {
    // Convertiamo la description (eventuale HTML) nel formato WhatsApp
    const safeDescription = convertHtmlToWhatsApp(description);

    for (const contact of contacts) {
      const name = contact.CustomerFullName;
      const phoneNumber = contact.CustomerPhone;
      if (!phoneNumber) continue;

      try {
        const response = await axios({
          url: "https://graph.facebook.com/v21.0/544175122111846/messages",
          method: "post",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          data: JSON.stringify({
            messaging_product: "whatsapp",
            to: "+39" + phoneNumber,
            type: "image",
            image: {
              id: imageId,
              caption: 
`*${title}*
Ciao *${name}*.
${safeDescription}

_Se non desideri ricevere piu comunicazioni di marketing scrivi alla mail:_
*marketing@climawell.net*`
            },
          }),
        });

        console.log(`Messaggio inviato a ${name} (${phoneNumber}):`, response.data);
      } catch (error) {
        console.error(
          `Errore nell'invio del messaggio a ${name} (${phoneNumber}):`,
          error.response?.data || error.message
        );
      }
    }
  }

  /**
   * Invio messaggi alle aziende (non premium) con immagine e testo.
   */
  static async sendCompanyMessage(title, description, imagePath, cap, Agente, db) {
    console.log("Inizio l'invio dei messaggi alle aziende.");

    const imageId = await uploadImage(imagePath);
    const contacts = await ContactModel.GetCompaniesByCapAndAgente(cap, Agente, db);

    if (contacts.length > 250) {
      console.log("I contatti sono più di 250. Gestione a batch attivata.");
      await db.query(
        `UPDATE public."Utils" SET value = true WHERE name = 'blockWhatsappCampaign'`
      );
      const batchSize = 250;
      let batchNumber = 0;
      while (batchNumber * batchSize < contacts.length) {
        const start = batchNumber * batchSize;
        const end = start + batchSize;
        const currentBatch = contacts.slice(start, end);
        console.log(
          `Invio batch ${batchNumber + 1}. Contatti da ${start + 1} a ${
            end > contacts.length ? contacts.length : end
          }.`
        );
        await this.sendCompanyBatchMessages(currentBatch, title, description, imageId);
        batchNumber++;
        if (batchNumber * batchSize < contacts.length) {
          console.log("Aspetto 26 ore prima del prossimo batch.");
          await new Promise((resolve) =>
            setTimeout(resolve, 26 * 60 * 60 * 1000)
          );
        }
      }
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );
      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      await this.sendCompanyBatchMessages(contacts, title, description, imageId);
      console.log("Tutti i messaggi sono stati inviati.");
    }
  }

  /**
   * Invio effettivo (batch) dei messaggi alle aziende (non premium) con immagine e testo.
   */
  static async sendCompanyBatchMessages(contacts, title, description, imageId) {
    const safeDescription = convertHtmlToWhatsApp(description);

    for (const contact of contacts) {
      const name = contact.CompanyName;
      const phoneNumber = contact.CompanyPhone;
      if (!phoneNumber) continue;

      try {
        const response = await axios({
          url: "https://graph.facebook.com/v21.0/544175122111846/messages",
          method: "post",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          data: JSON.stringify({
            messaging_product: "whatsapp",
            to: "+39" + phoneNumber,
            type: "image",
            image: {
              id: imageId,
              caption:
`*${title}*
Ciao *${name}*.
${safeDescription}

_Se non desideri ricevere piu comunicazioni di marketing scrivi alla mail:_
*marketing@climawell.net*`
            },
          }),
        });

        console.log(`Messaggio inviato a ${name} (${phoneNumber}):`, response.data);
      } catch (error) {
        console.error(
          `Errore nell'invio del messaggio a ${name} (${phoneNumber}):`,
          error.response?.data || error.message
        );
      }
    }
  }

  /**
   * Invio messaggi privati premium con immagine e testo.
   */
  static async sendPrivatePremiumMessage(title, description, imagePath, cap, Agente, db) {
    console.log("Inizio l'invio dei messaggi privati premium.");

    const imageId = await uploadImage(imagePath);
    const contacts = await ContactModel.GetPrivatesPremiumByCapAndAgente(cap, Agente, db);

    if (contacts.length > 250) {
      console.log("I contatti sono più di 250. Gestione a batch attivata.");
      await db.query(
        `UPDATE public."Utils" SET value = true WHERE name = 'blockWhatsappCampaign'`
      );
      const batchSize = 250;
      let batchNumber = 0;
      while (batchNumber * batchSize < contacts.length) {
        const start = batchNumber * batchSize;
        const end = start + batchSize;
        const currentBatch = contacts.slice(start, end);
        console.log(
          `Invio batch ${batchNumber + 1}. Contatti da ${start + 1} a ${
            end > contacts.length ? contacts.length : end
          }.`
        );
        await this.sendPrivatePremiumBatchMessages(currentBatch, title, description, imageId);
        batchNumber++;
        if (batchNumber * batchSize < contacts.length) {
          console.log("Aspetto 26 ore prima del prossimo batch.");
          await new Promise((resolve) =>
            setTimeout(resolve, 26 * 60 * 60 * 1000)
          );
        }
      }
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );
      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      await this.sendPrivatePremiumBatchMessages(contacts, title, description, imageId);
      console.log("Tutti i messaggi sono stati inviati.");
    }
  }

  /**
   * Invio effettivo (batch) dei messaggi privati premium con immagine e testo.
   */
  static async sendPrivatePremiumBatchMessages(contacts, title, description, imageId) {
    const safeDescription = convertHtmlToWhatsApp(description);

    for (const contact of contacts) {
      const name = contact.CustomerFullName;
      const phoneNumber = contact.CustomerPhone;
      if (!phoneNumber) continue;

      try {
        const response = await axios({
          url: "https://graph.facebook.com/v21.0/544175122111846/messages",
          method: "post",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          data: JSON.stringify({
            messaging_product: "whatsapp",
            to: "+39" + phoneNumber,
            type: "image",
            image: {
              id: imageId,
              caption:
`*${title}*
Ciao *${name}*.
${safeDescription}

_Se non desideri ricevere piu comunicazioni di marketing scrivi alla mail:_
*marketing@climawell.net*`
            },
          }),
        });

        console.log(`Messaggio inviato a ${name} (${phoneNumber}):`, response.data);
      } catch (error) {
        console.error(
          `Errore nell'invio del messaggio a ${name} (${phoneNumber}):`,
          error.response?.data || error.message
        );
      }
    }
  }

  /**
   * Invio messaggi premium alle aziende con immagine e testo.
   */
  static async sendCompanyPremiumMessage(title, description, imagePath, cap, Agente, db) {
    console.log("Inizio l'invio dei messaggi premium alle aziende.");

    const imageId = await uploadImage(imagePath);
    const contacts = await ContactModel.GetCompaniesPremiumByCapAndAgente(cap, Agente, db);

    if (contacts.length > 250) {
      console.log("I contatti sono più di 250. Gestione a batch attivata.");
      await db.query(
        `UPDATE public."Utils" SET value = true WHERE name = 'blockWhatsappCampaign'`
      );
      const batchSize = 250;
      let batchNumber = 0;
      while (batchNumber * batchSize < contacts.length) {
        const start = batchNumber * batchSize;
        const end = start + batchSize;
        const currentBatch = contacts.slice(start, end);
        console.log(
          `Invio batch ${batchNumber + 1}. Contatti da ${start + 1} a ${
            end > contacts.length ? contacts.length : end
          }.`
        );
        await this.sendCompanyPremiumBatchMessages(currentBatch, title, description, imageId);
        batchNumber++;
        if (batchNumber * batchSize < contacts.length) {
          console.log("Aspetto 26 ore prima del prossimo batch.");
          await new Promise((resolve) =>
            setTimeout(resolve, 26 * 60 * 60 * 1000)
          );
        }
      }
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );
      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      await this.sendCompanyPremiumBatchMessages(contacts, title, description, imageId);
      console.log("Tutti i messaggi sono stati inviati.");
    }
  }

  /**
   * Invio effettivo (batch) dei messaggi premium alle aziende con immagine e testo.
   */
  static async sendCompanyPremiumBatchMessages(contacts, title, description, imageId) {
    const safeDescription = convertHtmlToWhatsApp(description);

    for (const contact of contacts) {
      const name = contact.CompanyName;
      const phoneNumber = contact.CompanyPhone;
      if (!phoneNumber) continue;

      try {
        const response = await axios({
          url: "https://graph.facebook.com/v21.0/544175122111846/messages",
          method: "post",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          data: JSON.stringify({
            messaging_product: "whatsapp",
            to: "+39" + phoneNumber,
            type: "image",
            image: {
              id: imageId,
              caption:
`*${title}*
Ciao *${name}*.
${safeDescription}

_Se non desideri ricevere piu comunicazioni di marketing scrivi alla mail:_
*marketing@climawell.net*`
            },
          }),
        });

        console.log(`Messaggio inviato a ${name} (${phoneNumber}):`, response.data);
      } catch (error) {
        console.error(
          `Errore nell'invio del messaggio a ${name} (${phoneNumber}):`,
          error.response?.data || error.message
        );
      }
    }
  }

  /**
   * Invio in parallelo di tutti i messaggi premium (privati e aziende).
   */
  static async sendPremiumMessage(title, description, imagePath, cap, Agente, db) {
    console.log("Inizio l'invio di tutti i messaggi premium (privati e aziende).");

    await Promise.all([
      this.sendPrivatePremiumMessage(title, description, imagePath, cap, Agente, db),
      this.sendCompanyPremiumMessage(title, description, imagePath, cap, Agente, db),
    ]);

    console.log("Tutti i messaggi premium sono stati inviati.");
  }
}

/**
 * Funzione di supporto per caricare l'immagine su WhatsApp e ottenere l'ID.
 */
async function uploadImage(imagePath) {
  const data = new FormData();
  data.append("messaging_product", "whatsapp");
  data.append("file", fs.createReadStream(process.cwd() + "/" + imagePath));
  data.append("type", "image/jpeg");

  try {
    const response = await axios({
      url: "https://graph.facebook.com/v21.0/544175122111846/media",
      method: "post",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        ...data.getHeaders(),
      },
      data: data,
    });

    console.log("Image uploaded successfully:", response.data);
    return response.data.id;
  } catch (error) {
    console.error("Error uploading image:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Converte una stringa HTML in formattazione WhatsApp (Markdown-like):
 * - <strong> o <b> -> *testo*
 * - <em> o <i> -> _testo_
 * - <del> o <strike> -> ~testo~
 * - <p> e <br> -> newline
 * Rimuove anche eventuali altri tag HTML.
 */
function convertHtmlToWhatsApp(html) {
  if (!html) return "";
  return html
    .replace(/<strong>(.*?)<\/strong>/gi, '*$1*')
    .replace(/<b>(.*?)<\/b>/gi, '*$1*')
    .replace(/<em>(.*?)<\/em>/gi, '_$1_')
    .replace(/<i>(.*?)<\/i>/gi, '_$1_')
    .replace(/<del>(.*?)<\/del>/gi, '~$1~')
    .replace(/<strike>(.*?)<\/strike>/gi, '~$1~')
    .replace(/<p>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

module.exports = Messages;
