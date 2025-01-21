const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
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

function generateTextVersion(params) {
  return `
Climawell SRL

Gentile ${params.name},

${params.description}

Per gestire le tue preferenze di comunicazione, visita:
${params.link}

---

Climawell SRL
www.climawell.net

© ${new Date().getFullYear()} Climawell SRL. Tutti i diritti riservati.
`.trim();
}

class EmailService {
  static async startPrivateCampaign(
    description,
    title,
    object,
    imagePath,
    cap,
    agente,
    db
  ) {
    try {
      const contacts = await ContactModel.GetPrivatesByCapAndAgente(
        cap,
        agente,
        db
      );

      console.log(contacts);

      if (!contacts?.length) return;

      const emailTemplatePath = path.join(
        __dirname,
        "EmailTemplate/PrivateCampaign.html"
      );
      const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");
      const imageId = `image-${Date.now()}`;

      const sendEmail = async (contact) => {
        try {
          const name = contact.CustomerFullName?.split(" ")[0] || "";
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

          // Generate matching text version
          const textContent = generateTextVersion({
            name,
            description,
            link: unsubscribeUrl,
          });

          const htmlContent = emailTemplate
            .replace(/\${name}/g, name)
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
            text: textContent,
            html: htmlContent,
            attachments: [
              {
                filename: path.basename(imagePath),
                path: imagePath,
                cid: imageId,
              },
            ],
            headers: {
              "X-Entity-Ref-ID": `private-${Date.now()}-${token}`,
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          };

          await transporter.sendMail(emailOptions);
          await db.query(
            `UPDATE public."Customer" SET "CampaignToken" = $1 WHERE "CustomerEmail" = $2;`,
            [token, email]
          );
          console.log(`Email privata inviata con successo a ${email}`);
        } catch (error) {
          console.error(
            `Errore nell'invio dell'email privata a ${email}:`,
            error
          );
        }
      };

      // Process in batches of 50
      const batchSize = 50;
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        await Promise.all(batch.map(sendEmail));
        if (i + batchSize < contacts.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error("Errore durante la campagna privata:", error);
      throw error;
    }
  }

  static async startCompanyCampaign(
    description,
    title,
    object,
    imagePath,
    cap,
    agente,
    db
  ) {
    try {
      const companies = await ContactModel.GetCompaniesByCapAndAgente(
        cap,
        agente,
        db
      );

      if (!companies?.length) return;

      const emailTemplatePath = path.join(
        __dirname,
        "EmailTemplate/CompanyCampaign.html"
      );
      const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");
      const imageId = `image-${Date.now()}`;

      const sendEmail = async (company) => {
        try {
          const name = company.CompanyName || "";
          const email = company.CompanyEmail;

          const token = [...Array(8)]
            .map(() =>
              (
                Math.random().toString(36) +
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()"
              ).charAt(Math.floor(Math.random() * 62))
            )
            .join("");

          const unsubscribeUrl = new URL(
            `/contacts/remove-company/${token}/`,
            process.env.FRONTEND_URL
          ).toString();

          // Generate matching text version for companies
          const textContent = generateTextVersion({
            name,
            description,
            link: unsubscribeUrl,
          });

          const htmlContent = emailTemplate
            .replace(/\${name}/g, name)
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
            text: textContent,
            html: htmlContent,
            attachments: [
              {
                filename: path.basename(imagePath),
                path: imagePath,
                cid: imageId,
              },
            ],
            headers: {
              "X-Entity-Ref-ID": `company-${Date.now()}-${token}`,
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          };

          await transporter.sendMail(emailOptions);
          await db.query(
            `UPDATE public."Company" SET "CampaignToken" = $1 WHERE "CompanyEmail" = $2;`,
            [token, email]
          );
          console.log(`Email aziendale inviata con successo a ${email}`);
        } catch (error) {
          console.error(
            `Errore nell'invio dell'email aziendale a ${email}:`,
            error
          );
        }
      };

      // Process in batches of 50
      const batchSize = 50;
      for (let i = 0; i < companies.length; i += batchSize) {
        const batch = companies.slice(i, i + batchSize);
        await Promise.all(batch.map(sendEmail));
        if (i + batchSize < companies.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error("Errore durante la campagna aziendale:", error);
      throw error;
    }
  }

  static async startPrivatePremiumCampaign(
    description,
    title,
    object,
    imagePath,
    cap,
    agente,
    db
  ) {
    try {
      const contacts = await ContactModel.GetPrivatesPremiumByCapAndAgente(
        cap,
        agente,
        db
      );

      console.log(contacts);

      if (!contacts?.length) return;

      const emailTemplatePath = path.join(
        __dirname,
        "EmailTemplate/PrivateCampaign.html"
      );
      const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");
      const imageId = `image-${Date.now()}`;

      const sendEmail = async (contact) => {
        try {
          const name = contact.CustomerFullName?.split(" ")[0] || "";
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

          // Generate matching text version
          const textContent = generateTextVersion({
            name,
            description,
            link: unsubscribeUrl,
          });

          const htmlContent = emailTemplate
            .replace(/\${name}/g, name)
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
            text: textContent,
            html: htmlContent,
            attachments: [
              {
                filename: path.basename(imagePath),
                path: imagePath,
                cid: imageId,
              },
            ],
            headers: {
              "X-Entity-Ref-ID": `private-${Date.now()}-${token}`,
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          };

          await transporter.sendMail(emailOptions);
          await db.query(
            `UPDATE public."Customer" SET "CampaignToken" = $1 WHERE "CustomerEmail" = $2;`,
            [token, email]
          );
          console.log(`Email privata inviata con successo a ${email}`);
        } catch (error) {
          console.error(
            `Errore nell'invio dell'email privata a ${email}:`,
            error
          );
        }
      };

      // Process in batches of 50
      const batchSize = 50;
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        await Promise.all(batch.map(sendEmail));
        if (i + batchSize < contacts.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error("Errore durante la campagna privata:", error);
      throw error;
    }
  }

  static async startCompanyPremiumCampaign(
    description,
    title,
    object,
    imagePath,
    cap,
    agente,
    db
  ) {
    try {
      const companies = await ContactModel.GetCompaniesPremiumByCapAndAgente(
        cap,
        agente,
        db
      );

      if (!companies?.length) return;

      const emailTemplatePath = path.join(
        __dirname,
        "EmailTemplate/CompanyCampaign.html"
      );
      const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");
      const imageId = `image-${Date.now()}`;

      const sendEmail = async (company) => {
        try {
          const name = company.CompanyName || "";
          const email = company.CompanyEmail;

          const token = [...Array(8)]
            .map(() =>
              (
                Math.random().toString(36) +
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()"
              ).charAt(Math.floor(Math.random() * 62))
            )
            .join("");

          const unsubscribeUrl = new URL(
            `/contacts/remove-company/${token}/`,
            process.env.FRONTEND_URL
          ).toString();

          // Generate matching text version for companies
          const textContent = generateTextVersion({
            name,
            description,
            link: unsubscribeUrl,
          });

          const htmlContent = emailTemplate
            .replace(/\${name}/g, name)
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
            text: textContent,
            html: htmlContent,
            attachments: [
              {
                filename: path.basename(imagePath),
                path: imagePath,
                cid: imageId,
              },
            ],
            headers: {
              "X-Entity-Ref-ID": `company-${Date.now()}-${token}`,
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          };

          await transporter.sendMail(emailOptions);
          await db.query(
            `UPDATE public."Company" SET "CampaignToken" = $1 WHERE "CompanyEmail" = $2;`,
            [token, email]
          );
          console.log(`Email aziendale inviata con successo a ${email}`);
        } catch (error) {
          console.error(
            `Errore nell'invio dell'email aziendale a ${email}:`,
            error
          );
        }
      };

      // Process in batches of 50
      const batchSize = 50;
      for (let i = 0; i < companies.length; i += batchSize) {
        const batch = companies.slice(i, i + batchSize);
        await Promise.all(batch.map(sendEmail));
        if (i + batchSize < companies.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error("Errore durante la campagna aziendale:", error);
      throw error;
    }
  }

  static async startPremiumCampaign(
    description,
    title,
    object,
    imagePath,
    cap,
    agente,
    db
  ) {
    this.startPrivatePremiumCampaign(
      description,
      title,
      object,
      imagePath,
      cap,
      agente,
      db
    );

    this.startCompanyPremiumCampaign(
      description,
      title,
      object,
      imagePath,
      cap,
      agente,
      db
    );

    return;
  }
}

module.exports = EmailService;
