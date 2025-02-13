const axios = require("axios");
const ContactModel = require("../../Models/ContactModel");
require("dotenv").config();
const fs = require("fs");

class Messages {
  static async sendPrivateMessage(
    title,
    description,
    imagePath,
    cap,
    Agente,
    db
  ) {
    console.log("Inizio l'invio dei messaggi privati.");

    // Carica l'immagine richiesta
    const imageId = await uploadImage(imagePath);

    // Ottieni tutti i contatti privati dal database
    const contacts = await ContactModel.GetPrivatesByCapAndAgente(
      cap,
      Agente,
      db
    );

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
        await this.sendBatchPrivateMessages(
          currentBatch,
          title,
          description,
          imageId
        );

        batchNumber++;

        // Se ci sono altri batch, aspetta 26 ore
        if (batchNumber * batchSize < contacts.length) {
          console.log("Aspetto 26 ore prima del prossimo batch.");
          await new Promise((resolve) =>
            setTimeout(resolve, 26 * 60 * 60 * 1000)
          ); // 26 ore
        }
      }

      // Reimposta BlockWhatsappCampaign a false
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );

      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      // Se i contatti sono meno di 250, invia tutto direttamente
      await this.sendBatchMessages(contacts, title, description, imageId);
      console.log("Tutti i messaggi sono stati inviati.");
    }
  }

  static async sendBatchPrivateMessages(contacts, title, description, imageId) {
    console.log(contacts, title, description, imageId);
    for (const contact of contacts) {
      const name = contact.CustomerFullName;
      const phoneNumber = contact.CustomerPhone;
      if (!phoneNumber) {
        continue;
      }
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
            to: "39" + phoneNumber, // Prefisso italiano e numero di telefono
            type: "template",
            template: {
              name: "climawellm",
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
                      text: description, // Descrizione del messaggio
                    },
                  ],
                },
              ],
              language: {
                code: "it",
              },
            },
          }),
        });

        console.log(
          `Messaggio inviato a ${name} (${phoneNumber}):`,
          response.data
        );
      } catch (error) {
        console.error(
          `Errore nell'invio del messaggio a ${name} (${phoneNumber}):`,
          error.response?.data || error.message
        );
      }
    }
  }

  static async sendCompanyMessage(
    title,
    description,
    imagePath,
    cap,
    Agente,
    db
  ) {
    console.log("Inizio l'invio dei messaggi alle aziende.");

    // Carica l'immagine richiesta
    const imageId = await uploadImage(imagePath);

    // Ottieni tutti i contatti aziendali dal database
    const contacts = await ContactModel.GetCompaniesByCapAndAgente(
      cap,
      Agente,
      db
    );

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
        await this.sendCompanyBatchMessages(
          currentBatch,
          title,
          description,
          imageId
        );

        batchNumber++;

        // Se ci sono altri batch, aspetta 26 ore
        if (batchNumber * batchSize < contacts.length) {
          console.log("Aspetto 26 ore prima del prossimo batch.");
          await new Promise((resolve) =>
            setTimeout(resolve, 26 * 60 * 60 * 1000)
          ); // 26 ore
        }
      }

      // Reimposta BlockWhatsappCampaign a false
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );

      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      // Se i contatti sono meno di 250, invia tutto direttamente
      await this.sendCompanyBatchMessages(
        contacts,
        title,
        description,
        imageId
      );
      console.log("Tutti i messaggi sono stati inviati.");
    }
  }

  static async sendCompanyBatchMessages(contacts, title, description, imageId) {
    for (const contact of contacts) {
      const name = contact.CompanyName;
      const phoneNumber = contact.CompanyPhone;
      if (!phoneNumber) {
        continue;
      }
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
            to: "39" + phoneNumber, // Prefisso italiano e numero di telefono
            type: "template",
            template: {
              name: "climawellm",
              language: {
                code: "it",
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
                      text: name, // Nome dell'azienda
                    },
                    {
                      type: "text",
                      text: description, // Descrizione del messaggio
                    },
                  ],
                },
              ],
            },
          }),
        });

        console.log(
          `Messaggio inviato a ${name} (${phoneNumber}):`,
          response.data
        );
      } catch (error) {
        console.error(
          `Errore nell'invio del messaggio a ${name} (${phoneNumber}):`,
          error.response?.data || error.message
        );
      }
    }
  }

  static async sendPrivatePremiumMessage(
    title,
    description,
    imagePath,
    cap,
    Agente,
    db
  ) {
    console.log("Inizio l'invio dei messaggi privati premium.");

    // Carica l'immagine richiesta
    const imageId = await uploadImage(imagePath);

    // Ottieni tutti i contatti privati premium dal database
    const contacts = await ContactModel.GetPrivatesPremiumByCapAndAgente(
      cap,
      Agente,
      db
    );

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
        await this.sendPrivatePremiumBatchMessages(
          currentBatch,
          title,
          description,
          imageId
        );

        batchNumber++;

        // Se ci sono altri batch, aspetta 26 ore
        if (batchNumber * batchSize < contacts.length) {
          console.log("Aspetto 26 ore prima del prossimo batch.");
          await new Promise((resolve) =>
            setTimeout(resolve, 26 * 60 * 60 * 1000)
          ); // 26 ore
        }
      }

      // Reimposta BlockWhatsappCampaign a false
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );

      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      // Se i contatti sono meno di 250, invia tutto direttamente
      await this.sendPrivatePremiumBatchMessages(
        contacts,
        title,
        description,
        imageId
      );
      console.log("Tutti i messaggi sono stati inviati.");
    }
  }

  static async sendPrivatePremiumBatchMessages(
    contacts,
    title,
    description,
    imageId
  ) {
    for (const contact of contacts) {
      const name = contact.CustomerFullName;
      const phoneNumber = contact.CustomerPhone;
      if (!phoneNumber) {
        continue;
      }

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
            to: "39" + phoneNumber, // Prefisso italiano e numero di telefono
            type: "template",
            template: {
              name: "climawellm",
              language: {
                code: "it",
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
                      text: description, // Descrizione del messaggio
                    },
                  ],
                },
              ],
            },
          }),
        });

        console.log(
          `Messaggio inviato a ${name} (${phoneNumber}):`,
          response.data
        );
      } catch (error) {
        console.error(
          `Errore nell'invio del messaggio a ${name} (${phoneNumber}):`,
          error.response?.data || error.message
        );
      }
    }
  }
  static async sendPrivatePremiumMessage(
    title,
    description,
    imagePath,
    cap,
    Agente,
    db
  ) {
    console.log("Inizio l'invio dei messaggi privati premium.");

    // Carica l'immagine richiesta
    const imageId = await uploadImage(imagePath);

    // Ottieni tutti i contatti privati premium dal database
    const contacts = await ContactModel.GetPrivatesPremiumByCapAndAgente(
      cap,
      Agente,
      db
    );

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
        await this.sendPrivatePremiumBatchMessages(
          currentBatch,
          title,
          description,
          imageId
        );

        batchNumber++;

        // Se ci sono altri batch, aspetta 26 ore
        if (batchNumber * batchSize < contacts.length) {
          console.log("Aspetto 26 ore prima del prossimo batch.");
          await new Promise((resolve) =>
            setTimeout(resolve, 26 * 60 * 60 * 1000)
          ); // 26 ore
        }
      }

      // Reimposta BlockWhatsappCampaign a false
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );

      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      // Se i contatti sono meno di 250, invia tutto direttamente
      await this.sendPrivatePremiumBatchMessages(
        contacts,
        title,
        description,
        imageId
      );
      console.log("Tutti i messaggi sono stati inviati.");
    }
  }

  static async sendPrivatePremiumBatchMessages(
    contacts,
    title,
    description,
    imageId
  ) {
    for (const contact of contacts) {
      const name = contact.CustomerFullName;
      const phoneNumber = contact.CustomerPhone;
      if (!phoneNumber) {
        continue;
      }
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
            to: "39" + phoneNumber, // Prefisso italiano e numero di telefono
            type: "template",
            template: {
              name: "climawellm",
              language: {
                code: "it",
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
                      text: description, // Descrizione del messaggio
                    },
                  ],
                },
              ],
            },
          }),
        });

        console.log(
          `Messaggio inviato a ${name} (${phoneNumber}):`,
          response.data
        );
      } catch (error) {
        console.error(
          `Errore nell'invio del messaggio a ${name} (${phoneNumber}):`,
          error.response?.data || error.message
        );
      }
    }
  }

  static async sendCompanyPremiumMessage(
    title,
    description,
    imagePath,
    cap,
    Agente,
    db
  ) {
    console.log("Inizio l'invio dei messaggi premium alle aziende.");

    // Carica l'immagine richiesta
    const imageId = await uploadImage(imagePath);

    // Ottieni tutti i contatti aziendali premium dal database
    const contacts = await ContactModel.GetCompaniesPremiumByCapAndAgente(
      cap,
      Agente,
      db
    );

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
        await this.sendCompanyPremiumBatchMessages(
          currentBatch,
          title,
          description,
          imageId
        );

        batchNumber++;

        // Se ci sono altri batch, aspetta 26 ore
        if (batchNumber * batchSize < contacts.length) {
          console.log("Aspetto 26 ore prima del prossimo batch.");
          await new Promise((resolve) =>
            setTimeout(resolve, 26 * 60 * 60 * 1000)
          ); // 26 ore
        }
      }

      // Reimposta BlockWhatsappCampaign a false
      await db.query(
        `UPDATE public."Utils" SET value = false WHERE name = 'blockWhatsappCampaign'`
      );

      console.log("Tutti i messaggi sono stati inviati.");
    } else {
      // Se i contatti sono meno di 250, invia tutto direttamente
      await this.sendCompanyPremiumBatchMessages(
        contacts,
        title,
        description,
        imageId
      );
      console.log("Tutti i messaggi sono stati inviati.");
    }
  }

  static async sendCompanyPremiumBatchMessages(
    contacts,
    title,
    description,
    imageId
  ) {
    for (const contact of contacts) {
      const name = contact.CompanyName;
      const phoneNumber = contact.CompanyPhone;
      if (!phoneNumber) {
        continue;
      }
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
            to: "39" + phoneNumber, // Prefisso italiano e numero di telefono
            type: "template",
            template: {
              name: "climawellm",
              language: {
                code: "it",
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
                      text: description, // Descrizione del messaggio
                    },
                  ],
                },
              ],
            },
          }),
        });

        console.log(
          `Messaggio inviato a ${name} (${phoneNumber}):`,
          response.data
        );
      } catch (error) {
        console.error(
          `Errore nell'invio del messaggio a ${name} (${phoneNumber}):`,
          error.response?.data || error.message
        );
      }
    }
  }

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

    // Avvia l'invio dei messaggi premium privati e aziendali in parallelo
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
}

const FormData = require("form-data");

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
    return response.data.id; // Assuming `id` is the field that holds the valid media ID
  } catch (error) {
    console.error(
      "Error uploading image:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = Messages;
