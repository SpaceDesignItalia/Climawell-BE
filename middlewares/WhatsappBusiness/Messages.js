const axios = require("axios");
const ContactModel = require("../../Models/ContactModel");
require("dotenv").config();
const fs = require("fs");

class Messages {
  static async sendPrivateMessage(title, description, imagePath, db) {
    console.log("Inizio l'invio dei messaggi privati.");
    // Carica l'immagine richiesta
    const imageId = await uploadImage(imagePath);

    // Ottieni tutti i contatti privati dal database
    const contacts = await ContactModel.GetAllPrivate(db);

    // Itera su ciascun contatto
    for (const contact of contacts) {
      const name = contact.CustomerFullName;
      const phoneNumber = contact.CustomerPhone;

      try {
        const response = await axios({
          url: "https://graph.facebook.com/v21.0/442911372232023/messages",
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
              name: "climawell_marketing_ufficiale",
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

    console.log("Tutti i messaggi sono stati elaborati.");
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
      url: "https://graph.facebook.com/v21.0/442911372232023/media",
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
