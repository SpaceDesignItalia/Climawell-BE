const axios = require("axios");
const ContactModel = require("../../Models/ContactModel");
require("dotenv").config();
const fs = require("fs");
const FormData = require("form-data");

class Messages {
  /**
   * Invio messaggi privati (non premium) interattivi.
   */
  static async sendPrivateMessage(title, description, imagePath, cap, Agente, db) {
    console.log("Inizio l'invio dei messaggi privati interattivi.");

    // Carica l'immagine e ottieni l'ID
    const imageId = await uploadImage(imagePath);

    // Ottieni tutti i contatti privati dal database
    const contacts = await ContactModel.GetPrivatesByCapAndAgente(cap, Agente, db);

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
          `Invio batch ${batchNumber + 1}. Contatti da ${start + 1} a ${end > contacts.length ? contacts.length : end}.`
        );
        await this.sendBatchPrivateInteractiveMessages(currentBatch, title, description, imageId);
        batchNumber++;
        if (batchNumber * batchSize < contacts.length) {
          console.log("Aspetto 26 ore prima del prossimo batch.");
          await new Promise((resolve) => setTimeout(resolve, 26 * 60 * 60 * 1000));
        }
      }
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );
      console.log("Tutti i messaggi privati interattivi sono stati inviati.");
    } else {
      await this.sendBatchPrivateInteractiveMessages(contacts, title, description, imageId);
      console.log("Tutti i messaggi privati interattivi sono stati inviati.");
    }
  }

  static async sendBatchPrivateInteractiveMessages(contacts, title, description, imageId) {
    // Converte eventuale HTML in formattazione WhatsApp (Markdown-like)
    const safeDescription = convertHtmlToWhatsApp(description);
    for (const contact of contacts) {
      const name = contact.CustomerFullName;
      const phoneNumber = contact.CustomerPhone;
      if (!phoneNumber) continue;
      await sendInteractiveMessage(phoneNumber, title, safeDescription, name, imageId);
    }
  }

  /**
   * Invio messaggi aziendali (non premium) interattivi.
   */
  static async sendCompanyMessage(title, description, imagePath, cap, Agente, db) {
    console.log("Inizio l'invio dei messaggi aziendali interattivi.");

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
          `Invio batch ${batchNumber + 1}. Contatti da ${start + 1} a ${end > contacts.length ? contacts.length : end}.`
        );
        await this.sendBatchCompanyInteractiveMessages(currentBatch, title, description, imageId);
        batchNumber++;
        if (batchNumber * batchSize < contacts.length) {
          console.log("Aspetto 26 ore prima del prossimo batch.");
          await new Promise((resolve) => setTimeout(resolve, 26 * 60 * 60 * 1000));
        }
      }
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );
      console.log("Tutti i messaggi aziendali interattivi sono stati inviati.");
    } else {
      await this.sendBatchCompanyInteractiveMessages(contacts, title, description, imageId);
      console.log("Tutti i messaggi aziendali interattivi sono stati inviati.");
    }
  }

  static async sendBatchCompanyInteractiveMessages(contacts, title, description, imageId) {
    const safeDescription = convertHtmlToWhatsApp(description);
    for (const contact of contacts) {
      const name = contact.CompanyName;
      const phoneNumber = contact.CompanyPhone;
      if (!phoneNumber) continue;
      await sendInteractiveMessage(phoneNumber, title, safeDescription, name, imageId);
    }
  }

  /**
   * Invio messaggi privati premium interattivi.
   */
  static async sendPrivatePremiumMessage(title, description, imagePath, cap, Agente, db) {
    console.log("Inizio l'invio dei messaggi privati premium interattivi.");

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
          `Invio batch ${batchNumber + 1}. Contatti da ${start + 1} a ${end > contacts.length ? contacts.length : end}.`
        );
        await this.sendBatchPrivatePremiumInteractiveMessages(currentBatch, title, description, imageId);
        batchNumber++;
        if (batchNumber * batchSize < contacts.length) {
          console.log("Aspetto 26 ore prima del prossimo batch.");
          await new Promise((resolve) => setTimeout(resolve, 26 * 60 * 60 * 1000));
        }
      }
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );
      console.log("Tutti i messaggi privati premium interattivi sono stati inviati.");
    } else {
      await this.sendBatchPrivatePremiumInteractiveMessages(contacts, title, description, imageId);
      console.log("Tutti i messaggi privati premium interattivi sono stati inviati.");
    }
  }

  static async sendBatchPrivatePremiumInteractiveMessages(contacts, title, description, imageId) {
    const safeDescription = convertHtmlToWhatsApp(description);
    for (const contact of contacts) {
      const name = contact.CustomerFullName;
      const phoneNumber = contact.CustomerPhone;
      if (!phoneNumber) continue;
      await sendInteractiveMessage(phoneNumber, title, safeDescription, name, imageId);
    }
  }

  /**
   * Invio messaggi aziendali premium interattivi.
   */
  static async sendCompanyPremiumMessage(title, description, imagePath, cap, Agente, db) {
    console.log("Inizio l'invio dei messaggi aziendali premium interattivi.");

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
          `Invio batch ${batchNumber + 1}. Contatti da ${start + 1} a ${end > contacts.length ? contacts.length : end}.`
        );
        await this.sendBatchCompanyPremiumInteractiveMessages(currentBatch, title, description, imageId);
        batchNumber++;
        if (batchNumber * batchSize < contacts.length) {
          console.log("Aspetto 26 ore prima del prossimo batch.");
          await new Promise((resolve) => setTimeout(resolve, 26 * 60 * 60 * 1000));
        }
      }
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );
      console.log("Tutti i messaggi aziendali premium interattivi sono stati inviati.");
    } else {
      await this.sendBatchCompanyPremiumInteractiveMessages(contacts, title, description, imageId);
      console.log("Tutti i messaggi aziendali premium interattivi sono stati inviati.");
    }
  }

  static async sendBatchCompanyPremiumInteractiveMessages(contacts, title, description, imageId) {
    const safeDescription = convertHtmlToWhatsApp(description);
    for (const contact of contacts) {
      const name = contact.CompanyName;
      const phoneNumber = contact.CompanyPhone;
      if (!phoneNumber) continue;
      await sendInteractiveMessage(phoneNumber, title, safeDescription, name, imageId);
    }
  }

  /**
   * Invio in parallelo di tutti i messaggi premium (privati e aziende) interattivi.
   */
  static async sendPremiumMessage(title, description, imagePath, cap, Agente, db) {
    console.log("Inizio l'invio di tutti i messaggi premium interattivi.");
    await Promise.all([
      this.sendPrivatePremiumMessage(title, description, imagePath, cap, Agente, db),
      this.sendCompanyPremiumMessage(title, description, imagePath, cap, Agente, db),
    ]);
    console.log("Tutti i messaggi premium interattivi sono stati inviati.");
  }
}

/**
 * Funzione generica per inviare un messaggio interattivo a un singolo numero.
 * Il messaggio include:
 * - Header con immagine (id dell'immagine già caricata)
 * - Body con testo formattato (Markdown-like)
 * - Footer con testo semplice (max 60 caratteri)
 * - Pulsante "Visita sito" che apre https://climawell.net/
 */
async function sendInteractiveMessage(phoneNumber, title, safeDescription, name, imageId) {
  // Costruiamo il testo del body usando la formattazione WhatsApp
  const bodyText = `*${title}*\nCiao *${name}*.\n\n${safeDescription}\n\nSe non desideri ricevere più comunicazioni di marketing, scrivi a marketing@climawell.net`;
  const footerText = "Climawell S.R.L."; // Massimo 60 caratteri, nessuna formattazione

  try {
    const response = await axios({
      url: "https://graph.facebook.com/v16.0/544175122111846/messages",
      method: "post",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        messaging_product: "whatsapp",
        to: "+39" + phoneNumber,
        type: "interactive",
        interactive: {
          type: "button",
          header: {
            type: "image",
            image: {
              id: imageId,
            },
          },
          body: {
            text: bodyText,
          },
          footer: {
            text: footerText,
          },
          actions: {
            buttons: [
              {
                type: "url",
                url: "https://climawell.net/",
                title: "Visita sito",
              },
            ],
          },
        },
      }),
    });
    console.log(`Messaggio interattivo inviato a ${phoneNumber}:`, response.data);
  } catch (error) {
    console.error(
      `Errore nell'invio del messaggio interattivo a ${phoneNumber}:`,
      error.response?.data || error.message
    );
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
