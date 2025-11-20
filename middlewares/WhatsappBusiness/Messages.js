const axios = require("axios");
const ContactModel = require("../../Models/ContactModel");
require("dotenv").config();
const fs = require("fs");
const FormData = require("form-data");
const TurndownService = require("turndown");
const path = require("path");

// Inizializza Turndown con le opzioni di default
const turndownService = new TurndownService();
const batchSize = 1000;

// Percorso del file di log
const logFilePath = path.join(__dirname, "whatsapp_messages_log.json");

/**
 * Verifica se l'orario corrente è tra le 20:00 e le 9:00 (orario vietato)
 * @returns {boolean} true se siamo nell'orario vietato
 */
function isForbiddenTime() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 20 || hour < 9;
}

/**
 * Calcola il prossimo orario valido (dopo le 9:00)
 * @returns {Date} Data del prossimo orario valido
 */
function getNextValidTime() {
  const now = new Date();
  const nextValid = new Date(now);

  if (now.getHours() >= 20) {
    // Se siamo dopo le 20:00, imposta per le 9:00 del giorno successivo
    nextValid.setDate(nextValid.getDate() + 1);
    nextValid.setHours(9, 0, 0, 0);
  } else if (now.getHours() < 9) {
    // Se siamo prima delle 9:00, imposta per le 9:00 di oggi
    nextValid.setHours(9, 0, 0, 0);
  } else {
    // Siamo già in orario valido
    return now;
  }

  return nextValid;
}

/**
 * Aspetta fino al prossimo orario valido se necessario
 */
async function waitForValidTime() {
  if (isForbiddenTime()) {
    const nextValid = getNextValidTime();
    const waitTime = nextValid.getTime() - Date.now();
    console.log(
      `Orario vietato (20:00-9:00). Posticipo l'invio alle ${nextValid.toLocaleString(
        "it-IT"
      )}.`
    );
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
}

/**
 * Calcola il tempo di attesa per avere 24 ore esatte tra il primo messaggio di un batch
 * e il primo messaggio del batch successivo
 * @param {Date} firstMessageTime - Data/ora del primo messaggio del batch corrente
 * @returns {number} Tempo di attesa in millisecondi
 */
function calculateWaitTime(firstMessageTime) {
  const now = new Date();
  let targetTime = new Date(firstMessageTime.getTime() + 24 * 60 * 60 * 1000);

  // Se l'orario target è nell'orario vietato (20:00-9:00), spostalo alle 9:00
  if (targetTime.getHours() >= 20 || targetTime.getHours() < 9) {
    // Crea una nuova data per le 9:00 del giorno dell'orario target
    const nextValid = new Date(targetTime);
    nextValid.setHours(9, 0, 0, 0);

    // Se le 9:00 del giorno target sono già passate, passa al giorno successivo
    if (nextValid <= now) {
      nextValid.setDate(nextValid.getDate() + 1);
    }

    targetTime = nextValid;
  }

  const waitTime = targetTime.getTime() - now.getTime();
  return Math.max(0, waitTime);
}

/**
 * Logga un messaggio inviato su file JSON
 * @param {string} recipient - Nome del destinatario
 * @param {string} phoneNumber - Numero di telefono
 * @param {Date} sendTime - Data/ora di invio
 */
function logMessage(recipient, phoneNumber, sendTime) {
  try {
    let logs = [];

    // Leggi i log esistenti se il file esiste
    if (fs.existsSync(logFilePath)) {
      const fileContent = fs.readFileSync(logFilePath, "utf8");
      if (fileContent.trim()) {
        logs = JSON.parse(fileContent);
      }
    }

    // Aggiungi il nuovo log
    logs.push({
      recipient: recipient,
      phoneNumber: phoneNumber,
      sendTime: sendTime.toISOString(),
      sendTimeLocal: sendTime.toLocaleString("it-IT", {
        timeZone: "Europe/Rome",
      }),
    });

    // Scrivi i log aggiornati
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), "utf8");
  } catch (error) {
    console.error("Errore nel logging del messaggio:", error);
  }
}

// Aggiungi regole personalizzate per il formato WhatsApp
turndownService.addRule("whatsAppBold", {
  filter: ["strong", "b"],
  replacement: (content) => `*${content.trim()}*`,
});

turndownService.addRule("whatsAppItalic", {
  filter: ["em", "i"],
  replacement: (content) => `_${content.trim()}_`,
});

turndownService.addRule("whatsAppStrike", {
  filter: ["del", "strike"],
  replacement: (content) => `~${content.trim()}~`,
});

turndownService.addRule("whatsAppUnderline", {
  filter: ["u"],
  // WhatsApp non supporta l'underline, qui lo convertiamo in corsivo come esempio
  replacement: (content) => `_${content.trim()}_`,
});

// Funzione che utilizza Turndown per convertire HTML in formattazione WhatsApp
function convertHtmlToWhatsApp(html) {
  if (!html) return "";

  // Converti HTML in Markdown
  let markdown = turndownService.turndown(html).trim();

  // Gestisci i paragrafi
  markdown = markdown.replace(/(?:\r\n|\r|\n)/g, "\n\n"); // Aggiungi una riga vuota tra i paragrafi

  // Gestisci le liste
  markdown = markdown.replace(/^\s*-\s+/gm, "* "); // Converti le liste non ordinate
  markdown = markdown.replace(/^\s*\d+\.\s+/gm, "1. "); // Converti le liste ordinate (solo il primo numero)

  // Rimuovi caratteri non validi
  markdown = markdown.replace(/[\n\t]/g, " "); // Rimuovi nuove righe e tabulazioni
  markdown = markdown.replace(/ {2,}/g, " "); // Rimuovi spazi consecutivi
  markdown = markdown.replace(/ {4,}/g, " "); // Rimuovi più di quattro spazi consecutivi

  return markdown.trim(); // Rimuovi eventuali spazi all'inizio e alla fine
}

class Messages {
  /**
   * Invio messaggi privati (non premium) con immagine e testo.
   */
  static async sendPrivateMessage(
    title,
    description,
    imagePath,
    cap,
    Agente,
    db
  ) {
    console.log("Inizio l'invio dei messaggi privati.");

    // Carica l'immagine e ottieni l'ID
    const imageId = await uploadImage(imagePath);

    // Ottieni tutti i contatti privati dal database
    const contacts = await ContactModel.GetPrivatesByCapAndAgente(
      cap,
      Agente,
      db
    );

    if (contacts.length > batchSize) {
      console.log(
        "I contatti sono più di batchSize. Gestione a batch attivata."
      );

      // Imposta BlockWhatsappCampaign a true
      await db.query(
        `UPDATE public."Utils" SET value = true WHERE name = 'blockWhatsappCampaign'`
      );

      let batchNumber = 0;
      let previousBatchFirstMessageTime = null;

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
        const firstMessageTime = await this.sendBatchPrivateMessages(
          currentBatch,
          title,
          description,
          imageId
        );

        batchNumber++;

        // Se ci sono altri batch, calcola il tempo di attesa
        if (batchNumber * batchSize < contacts.length && firstMessageTime) {
          const waitTime = calculateWaitTime(firstMessageTime);
          const nextSendTime = new Date(Date.now() + waitTime);

          console.log(
            `Aspetto ${(waitTime / (60 * 60 * 1000)).toFixed(
              2
            )} ore (24h dal primo messaggio del batch corrente). Prossimo invio previsto alle ${nextSendTime.toLocaleString(
              "it-IT"
            )}.`
          );

          await new Promise((resolve) => setTimeout(resolve, waitTime));

          previousBatchFirstMessageTime = firstMessageTime;
        }
      }

      // Reimposta BlockWhatsappCampaign a false
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );

      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      // Se i contatti sono meno di batchSize, invia tutto direttamente
      await this.sendBatchPrivateMessages(
        contacts,
        title,
        description,
        imageId
      );
      console.log("Tutti i messaggi sono stati inviati.");
    }
  }

  /**
   * Invio effettivo (batch) dei messaggi privati (non premium) con immagine e testo.
   * @returns {Date|null} Data/ora del primo messaggio inviato, null se nessun messaggio inviato
   */
  static async sendBatchPrivateMessages(contacts, title, description, imageId) {
    // Convertiamo la description (eventuale HTML) nel formato WhatsApp
    const safeDescription = convertHtmlToWhatsApp(description);
    let firstMessageTime = null;

    // Aspetta se siamo in orario vietato
    await waitForValidTime();

    for (const contact of contacts) {
      const name = contact.CustomerFullName;
      const phoneNumber = contact.CustomerPhone;
      if (!phoneNumber) continue;

      // Se siamo in orario vietato durante l'invio, aspetta
      if (isForbiddenTime()) {
        await waitForValidTime();
      }

      try {
        const sendTime = new Date();

        // Traccia il primo messaggio inviato
        if (firstMessageTime === null) {
          firstMessageTime = sendTime;
        }

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
            type: "template",
            template: {
              name: "definitivo",
              language: {
                code: "en",
              },
              components: [
                {
                  type: "header",
                  parameters: [
                    {
                      type: "image",
                      image: {
                        id: imageId, // ID immagine già caricato
                      },
                    },
                  ],
                },
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: title, // Titolo del messaggio
                    },
                    {
                      type: "text",
                      text: name, // Nome del cliente
                    },
                    {
                      type: "text",
                      text: safeDescription, // Descrizione del messaggio
                    },
                  ],
                },
              ],
            },
          }),
        });

        // Logga il messaggio inviato
        logMessage(name, phoneNumber, sendTime);

        console.log(
          `Messaggio inviato a ${name} (${phoneNumber}) alle ${sendTime.toLocaleString(
            "it-IT"
          )}:`,
          response.data
        );
      } catch (error) {
        console.error(
          `Errore nell'invio del messaggio a ${name} (${phoneNumber}):`,
          error.response?.data || error.message
        );
      }
    }

    return firstMessageTime;
  }

  /**
   * Invio messaggi alle aziende (non premium) con immagine e testo.
   */
  static async sendCompanyMessage(
    title,
    description,
    imagePath,
    cap,
    Agente,
    db
  ) {
    console.log("Inizio l'invio dei messaggi alle aziende.");

    const imageId = await uploadImage(imagePath);
    const contacts = await ContactModel.GetCompaniesByCapAndAgente(
      cap,
      Agente,
      db
    );

    if (contacts.length > batchSize) {
      console.log(
        "I contatti sono più di batchSize. Gestione a batch attivata."
      );
      await db.query(
        `UPDATE public."Utils" SET value = true WHERE name = 'blockWhatsappCampaign'`
      );

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
        const firstMessageTime = await this.sendCompanyBatchMessages(
          currentBatch,
          title,
          description,
          imageId
        );
        batchNumber++;
        if (batchNumber * batchSize < contacts.length && firstMessageTime) {
          const waitTime = calculateWaitTime(firstMessageTime);
          const nextSendTime = new Date(Date.now() + waitTime);

          console.log(
            `Aspetto ${(waitTime / (60 * 60 * 1000)).toFixed(
              2
            )} ore (24h dal primo messaggio del batch corrente). Prossimo invio previsto alle ${nextSendTime.toLocaleString(
              "it-IT"
            )}.`
          );

          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );
      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      await this.sendCompanyBatchMessages(
        contacts,
        title,
        description,
        imageId
      );
      console.log("Tutti i messaggi sono stati inviati.");
    }
  }

  /**
   * Invio effettivo (batch) dei messaggi alle aziende (non premium) con immagine e testo.
   * @returns {Date|null} Data/ora del primo messaggio inviato, null se nessun messaggio inviato
   */
  static async sendCompanyBatchMessages(contacts, title, description, imageId) {
    const safeDescription = convertHtmlToWhatsApp(description);
    let firstMessageTime = null;

    // Aspetta se siamo in orario vietato
    await waitForValidTime();

    for (const contact of contacts) {
      const name = contact.CompanyName;
      const phoneNumber = contact.CompanyPhone;
      if (!phoneNumber) continue;

      // Se siamo in orario vietato durante l'invio, aspetta
      if (isForbiddenTime()) {
        await waitForValidTime();
      }

      try {
        const sendTime = new Date();

        // Traccia il primo messaggio inviato
        if (firstMessageTime === null) {
          firstMessageTime = sendTime;
        }

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
            type: "template",
            template: {
              name: "definitivo",
              language: {
                code: "en",
              },
              components: [
                {
                  type: "header",
                  parameters: [
                    {
                      type: "image",
                      image: {
                        id: imageId, // ID immagine già caricato
                      },
                    },
                  ],
                },
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: title, // Titolo del messaggio
                    },
                    {
                      type: "text",
                      text: name, // Nome del cliente
                    },
                    {
                      type: "text",
                      text: safeDescription, // Descrizione del messaggio
                    },
                  ],
                },
              ],
            },
          }),
        });

        // Logga il messaggio inviato
        logMessage(name, phoneNumber, sendTime);

        console.log(
          `Messaggio inviato a ${name} (${phoneNumber}) alle ${sendTime.toLocaleString(
            "it-IT"
          )}:`,
          response.data
        );
      } catch (error) {
        console.error(
          `Errore nell'invio del messaggio a ${name} (${phoneNumber}):`,
          error.response?.data || error.message
        );
      }
    }

    return firstMessageTime;
  }

  /**
   * Invio messaggi privati premium con immagine e testo.
   */
  static async sendPrivatePremiumMessage(
    title,
    description,
    imagePath,
    cap,
    Agente,
    db
  ) {
    console.log("Inizio l'invio dei messaggi privati premium.");

    const imageId = await uploadImage(imagePath);
    const contacts = await ContactModel.GetPrivatesPremiumByCapAndAgente(
      cap,
      Agente,
      db
    );

    if (contacts.length > batchSize) {
      console.log(
        "I contatti sono più di batchSize. Gestione a batch attivata."
      );
      await db.query(
        `UPDATE public."Utils" SET value = true WHERE name = 'blockWhatsappCampaign'`
      );

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
        const firstMessageTime = await this.sendPrivatePremiumBatchMessages(
          currentBatch,
          title,
          description,
          imageId
        );
        batchNumber++;
        if (batchNumber * batchSize < contacts.length && firstMessageTime) {
          const waitTime = calculateWaitTime(firstMessageTime);
          const nextSendTime = new Date(Date.now() + waitTime);

          console.log(
            `Aspetto ${(waitTime / (60 * 60 * 1000)).toFixed(
              2
            )} ore (24h dal primo messaggio del batch corrente). Prossimo invio previsto alle ${nextSendTime.toLocaleString(
              "it-IT"
            )}.`
          );

          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );
      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      await this.sendPrivatePremiumBatchMessages(
        contacts,
        title,
        description,
        imageId
      );
      console.log("Tutti i messaggi sono stati inviati.");
    }
  }

  /**
   * Invio effettivo (batch) dei messaggi privati premium con immagine e testo.
   * @returns {Date|null} Data/ora del primo messaggio inviato, null se nessun messaggio inviato
   */
  static async sendPrivatePremiumBatchMessages(
    contacts,
    title,
    description,
    imageId
  ) {
    const safeDescription = convertHtmlToWhatsApp(description);
    let firstMessageTime = null;

    // Aspetta se siamo in orario vietato
    await waitForValidTime();

    for (const contact of contacts) {
      const name = contact.CustomerFullName;
      const phoneNumber = contact.CustomerPhone;
      if (!phoneNumber) continue;

      // Se siamo in orario vietato durante l'invio, aspetta
      if (isForbiddenTime()) {
        await waitForValidTime();
      }

      try {
        const sendTime = new Date();

        // Traccia il primo messaggio inviato
        if (firstMessageTime === null) {
          firstMessageTime = sendTime;
        }

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
            type: "template",
            template: {
              name: "definitivo",
              language: {
                code: "en",
              },
              components: [
                {
                  type: "header",
                  parameters: [
                    {
                      type: "image",
                      image: {
                        id: imageId, // ID immagine già caricato
                      },
                    },
                  ],
                },
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: title, // Titolo del messaggio
                    },
                    {
                      type: "text",
                      text: name, // Nome del cliente
                    },
                    {
                      type: "text",
                      text: safeDescription, // Descrizione del messaggio
                    },
                  ],
                },
              ],
            },
          }),
        });

        // Logga il messaggio inviato
        logMessage(name, phoneNumber, sendTime);

        console.log(
          `Messaggio inviato a ${name} (${phoneNumber}) alle ${sendTime.toLocaleString(
            "it-IT"
          )}:`,
          response.data
        );
      } catch (error) {
        console.error(
          `Errore nell'invio del messaggio a ${name} (${phoneNumber}):`,
          error.response?.data || error.message
        );
      }
    }

    return firstMessageTime;
  }

  /**
   * Invio messaggi premium alle aziende con immagine e testo.
   */
  static async sendCompanyPremiumMessage(
    title,
    description,
    imagePath,
    cap,
    Agente,
    db
  ) {
    console.log("Inizio l'invio dei messaggi premium alle aziende.");

    const imageId = await uploadImage(imagePath);
    const contacts = await ContactModel.GetCompaniesPremiumByCapAndAgente(
      cap,
      Agente,
      db
    );

    if (contacts.length > batchSize) {
      console.log(
        "I contatti sono più di batchSize. Gestione a batch attivata."
      );
      await db.query(
        `UPDATE public."Utils" SET value = true WHERE name = 'blockWhatsappCampaign'`
      );

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
        const firstMessageTime = await this.sendCompanyPremiumBatchMessages(
          currentBatch,
          title,
          description,
          imageId
        );
        batchNumber++;
        if (batchNumber * batchSize < contacts.length && firstMessageTime) {
          const waitTime = calculateWaitTime(firstMessageTime);
          const nextSendTime = new Date(Date.now() + waitTime);

          console.log(
            `Aspetto ${(waitTime / (60 * 60 * 1000)).toFixed(
              2
            )} ore (24h dal primo messaggio del batch corrente). Prossimo invio previsto alle ${nextSendTime.toLocaleString(
              "it-IT"
            )}.`
          );

          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );
      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      await this.sendCompanyPremiumBatchMessages(
        contacts,
        title,
        description,
        imageId
      );
      console.log("Tutti i messaggi sono stati inviati.");
    }
  }

  /**
   * Invio effettivo (batch) dei messaggi premium alle aziende con immagine e testo.
   * @returns {Date|null} Data/ora del primo messaggio inviato, null se nessun messaggio inviato
   */
  static async sendCompanyPremiumBatchMessages(
    contacts,
    title,
    description,
    imageId
  ) {
    const safeDescription = convertHtmlToWhatsApp(description);
    let firstMessageTime = null;

    // Aspetta se siamo in orario vietato
    await waitForValidTime();

    for (const contact of contacts) {
      const name = contact.CompanyName;
      const phoneNumber = contact.CompanyPhone;
      if (!phoneNumber) continue;

      // Se siamo in orario vietato durante l'invio, aspetta
      if (isForbiddenTime()) {
        await waitForValidTime();
      }

      try {
        const sendTime = new Date();

        // Traccia il primo messaggio inviato
        if (firstMessageTime === null) {
          firstMessageTime = sendTime;
        }

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
            type: "template",
            template: {
              name: "definitivo",
              language: {
                code: "en",
              },
              components: [
                {
                  type: "header",
                  parameters: [
                    {
                      type: "image",
                      image: {
                        id: imageId, // ID immagine già caricato
                      },
                    },
                  ],
                },
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: title, // Titolo del messaggio
                    },
                    {
                      type: "text",
                      text: name, // Nome del cliente
                    },
                    {
                      type: "text",
                      text: safeDescription, // Descrizione del messaggio
                    },
                  ],
                },
              ],
            },
          }),
        });

        // Logga il messaggio inviato
        logMessage(name, phoneNumber, sendTime);

        console.log(
          `Messaggio inviato a ${name} (${phoneNumber}) alle ${sendTime.toLocaleString(
            "it-IT"
          )}:`,
          response.data
        );
      } catch (error) {
        console.error(
          `Errore nell'invio del messaggio a ${name} (${phoneNumber}):`,
          error.response?.data || error.message
        );
      }
    }

    return firstMessageTime;
  }

  /**
   * Invio in parallelo di tutti i messaggi premium (privati e aziende).
   */
  static async sendPremiumMessage(
    title,
    description,
    imagePath,
    cap,
    Agente,
    db
  ) {
    console.log(
      "Inizio l'invio di tutti i messaggi premium (privati e aziende)."
    );

    await Promise.all([
      this.sendPrivatePremiumMessage(
        title,
        description,
        imagePath,
        cap,
        Agente,
        db
      ),
      this.sendCompanyPremiumMessage(
        title,
        description,
        imagePath,
        cap,
        Agente,
        db
      ),
    ]);

    console.log("Tutti i messaggi premium sono stati inviati.");
  }

  static async sendStartMessage(db, ContactData, ContactType, privacyFileName) {
    const name =
      ContactType == "private"
        ? ContactData.CustomerName + " " + ContactData.CustomerSurname
        : ContactData.CompanyName;
    const phoneNumber =
      ContactType == "private"
        ? ContactData.CustomerPhone
        : ContactData.CompanyPhone;
    if (!phoneNumber) return null;

    // Aspetta se siamo in orario vietato
    if (isForbiddenTime()) {
      await waitForValidTime();
    }

    try {
      const sendTime = new Date();

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
          type: "template",
          template: {
            name: "fraud_alert_2",
            language: {
              code: "en_US",
            },
            components: [],
          },
        }),
      });

      // Logga il messaggio inviato
      logMessage(name, phoneNumber, sendTime);

      console.log(
        `Messaggio inviato a ${name} (${phoneNumber}) alle ${sendTime.toLocaleString(
          "it-IT"
        )}:`,
        response.data
      );

      return sendTime;
    } catch (error) {
      console.error(
        `Errore nell'invio del messaggio a ${name} (${"+39" + phoneNumber}):`,
        error.response?.data || error.message
      );
      return null;
    }
  }

  static async sendUploadMessage(db, companies, customers) {
    const batchSize = 1000; // Definisci la dimensione del batch
    const allContacts = [
      ...companies.map((company) => ({ data: company, type: "company" })),
      ...customers.map((customer) => ({ data: customer, type: "private" })),
    ];

    if (allContacts.length > batchSize) {
      console.log(
        "I contatti sono più di batchSize. Gestione a batch attivata."
      );
      await db.query(
        `UPDATE public."Utils" SET value = true WHERE name = 'blockWhatsappCampaign'`
      );

      let batchNumber = 0;
      while (batchNumber * batchSize < allContacts.length) {
        const start = batchNumber * batchSize;
        const end = start + batchSize;
        const currentBatch = allContacts.slice(start, end);

        console.log(
          `Invio batch ${batchNumber + 1}. Contatti da ${start + 1} a ${
            end > allContacts.length ? allContacts.length : end
          }.`
        );

        let firstMessageTime = null;
        for (const contact of currentBatch) {
          const sendTime = await this.sendStartMessage(
            db,
            contact.data,
            contact.type
          );
          if (sendTime && firstMessageTime === null) {
            firstMessageTime = sendTime;
          }
        }

        batchNumber++;

        // Se ci sono altri batch, calcola il tempo di attesa
        if (batchNumber * batchSize < allContacts.length && firstMessageTime) {
          const waitTime = calculateWaitTime(firstMessageTime);
          const nextSendTime = new Date(Date.now() + waitTime);

          console.log(
            `Aspetto ${(waitTime / (60 * 60 * 1000)).toFixed(
              2
            )} ore (24h dal primo messaggio del batch corrente). Prossimo invio previsto alle ${nextSendTime.toLocaleString(
              "it-IT"
            )}.`
          );

          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );
      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      for (const company of companies) {
        await this.sendStartMessage(db, company, "company");
      }

      for (const customer of customers) {
        await this.sendStartMessage(db, customer, "private");
      }
      console.log("Tutti i messaggi sono stati inviati.");
    }
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
    console.error(
      "Error uploading image:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = Messages;
