var nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const ContactController = require("../../Controllers/ContactController");
const ContactModel = require("../../Models/ContactModel");

const mailData = {
  mail: "noreply@spacedesign-italia.it",
  pass: "@Gemellini04",
};

const transporter = nodemailer.createTransport({
  host: "smtp.ionos.it",
  port: 587,
  secure: false,
  auth: {
    user: mailData.mail,
    pass: mailData.pass,
  },
});

class EmailService {
  static async startPrivateCampaign(description, title, object, imagePath, db) {
    try {
      const contacts = await ContactModel.GetAllPrivate(db);
      if (!contacts || contacts.length === 0) {
        return;
      }

      const emailTemplatePath = path.join(
        __dirname,
        "EmailTemplate/PrivateCampaign.html"
      );
      let emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");

      // Genera un ID univoco per l'immagine
      const imageId = `image-${Date.now()}`;

      const sendEmail = async (contact) => {
        try {
          const name = contact.CustomerFullName?.split(" ")[0] || "";
          const surname = contact.CustomerFullName?.split(" ")[1] || "";
          const email = contact.CustomerEmail;

          const token = [...Array(8)]
            .map(() =>
              (
                Math.random().toString(36) +
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()"
              ).charAt(Math.floor(Math.random() * 62))
            )
            .join("");

          const unsubscribeUrl = new URL(
            `/contacts/remove-private/${token}/`,
            process.env.FRONTEND_URL
          ).toString();

          // Sostituisci il segnaposto dell'immagine con il riferimento CID
          const htmlContent = emailTemplate
            .replace(/\${name}/g, name)
            .replace(/\${surname}/g, surname)
            .replace(/\${description}/g, description)
            .replace(/\${link}/g, unsubscribeUrl)
            .replace(/\${image}/g, `cid:${imageId}`);

          const emailOptions = {
            from: {
              name: "Climawell SRL",
              address: mailData.mail,
            },
            to: email,
            subject: title,
            text: object,
            html: htmlContent,
            attachments: [
              {
                filename: path.basename(imagePath),
                path: imagePath,
                cid: imageId, // Questo collega l'allegato al tag img nell'HTML
              },
            ],
          };

          await transporter.sendMail(emailOptions);
          const query = `UPDATE public."Customer" SET "CampaignToken" = $1 WHERE "CustomerEmail" = $2;`;
          await db.query(query, [token, email]);
          console.log("Token: ", token, " - Email: ", email);
        } catch (error) {
          console.error(`Errore nell'invio dell'email a ${email}:`, error);
        }
      };

      // Processa i contatti in batch
      const batchSize = 50;
      const contactArray = Array.isArray(contacts) ? contacts : [contacts];

      for (let i = 0; i < contactArray.length; i += batchSize) {
        const batch = contactArray.slice(i, i + batchSize);
        await Promise.all(batch.map((contact) => sendEmail(contact)));

        if (i + batchSize < contactArray.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error("Errore durante la campagna privata:", error);
      throw error;
    }
  }


  static async startCompanyCampaign(description, title, object, imagePath, db) {
    try {
      const companies = await ContactModel.GetAllCompany(db);
      if (!companies || companies.length === 0) {
        return;
      }
  
      const emailTemplatePath = path.join(
        __dirname,
        "EmailTemplate/CompanyCampaign.html"
      );
      let emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");
  
      // Genera un ID univoco per l'immagine
      const imageId = `image-${Date.now()}`;
  
      const sendEmail = async (company) => {
        try {
          const email = company.CompanyEmail;
          const name = company.CompanyName;
  
          // Genera token per unsubscribe
          const token = [...Array(8)]
            .map(() =>
              (
                Math.random().toString(36) +
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()"
              ).charAt(Math.floor(Math.random() * 62))
            )
            .join("");
  
          // Crea l'URL di unsubscribe
          const unsubscribeUrl = new URL(
            `/contacts/remove-company/${token}/`,
            process.env.FRONTEND_URL
          ).toString();
  
          // Sostituisci il segnaposto dell'immagine con il riferimento CID
          const htmlContent = emailTemplate
            .replace(/\${name}/g, name || "")
            .replace(/\${description}/g, description)
            .replace(/\${link}/g, unsubscribeUrl)
            .replace(/\${image}/g, `cid:${imageId}`);
  
          const emailOptions = {
            from: {
              name: "Climawell SRL",
              address: mailData.mail
            },
            to: email,
            subject: title,
            text: object,
            html: htmlContent,
            attachments: [{
              filename: path.basename(imagePath),
              path: imagePath,
              cid: imageId // Collega l'allegato al tag img nell'HTML
            }]
          };
  
          // Invia l'email
          await transporter.sendMail(emailOptions);
          console.log(`Email inviata con successo a ${email}`);
  
          // Aggiorna il token nel database
          const query = `UPDATE public."Company" SET "CampaignToken" = $1 WHERE "CompanyEmail" = $2;`;
          await db.query(query, [token, email]);
          console.log(`Token ${token} aggiornato per l'azienda ${email}`);
  
        } catch (error) {
          console.error(`Errore nell'invio dell'email a ${email}:`, error);
          // Non rilanciare l'errore per permettere al batch di continuare
        }
      };
  
      // Processa le aziende in batch
      const batchSize = 50;
      const companyArray = Array.isArray(companies) ? companies : [companies];
      
      for (let i = 0; i < companyArray.length; i += batchSize) {
        const batch = companyArray.slice(i, i + batchSize);
        await Promise.all(batch.map(company => sendEmail(company)));
        
        if (i + batchSize < companyArray.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
  
    } catch (error) {
      console.error("Errore durante la campagna aziendale:", error);
      throw error;
    }
  }

}

module.exports = EmailService;
