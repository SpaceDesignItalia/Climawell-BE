const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const ContactModel = require("../../models/ContactModel");

const mailData = {
  mail: "noreply@spacedesign-italia.it",
  pass: "@Gemellini04"
};

// Configurazione DKIM opzionale
let dkimConfig = null;
try {
  const privateKeyPath = path.join(__dirname, "private-key.pem");
  if (fs.existsSync(privateKeyPath)) {
    dkimConfig = {
      domainName: "spacedesign-italia.it",
      keySelector: "default",
      privateKey: fs.readFileSync(privateKeyPath, "utf8")
    };
    console.log("DKIM configurato correttamente");
  } else {
    console.log("File private-key.pem non trovato. DKIM non sarà utilizzato.");
  }
} catch (error) {
  console.warn("Errore nella configurazione DKIM:", error.message);
}

const transporterConfig = {
  host: "smtp.ionos.it",
  port: 587,
  secure: false,
  auth: {
    user: mailData.mail,
    pass: mailData.pass,
  },
  pool: true,
  maxConnections: 5,
  rateDelta: 1000,
  rateLimit: 5,
};

// Aggiungi la configurazione DKIM solo se disponibile
if (dkimConfig) {
  transporterConfig.dkim = {
    domainName: dkimConfig.domainName,
    keySelector: dkimConfig.keySelector,
    privateKey: dkimConfig.privateKey,
    headerFieldNames: 'from:to:subject:date:message-id:mime-version:content-type',
    skipFields: 'list-unsubscribe:list-unsubscribe-post',
  };
}

const transporter = nodemailer.createTransport(transporterConfig);

function generateTextVersion(params) {
  return `
Climawell SRL - Comunicazione Importante

Gentile ${params.name},

${params.description}

Per gestire le tue preferenze email o cancellarti dalla newsletter:
${params.link}

--
Climawell SRL
Via [Indirizzo Aziendale]
Tel: [Numero Telefono]
Email: info@climawell.net
www.climawell.net

© ${new Date().getFullYear()} Climawell SRL. Tutti i diritti riservati.
Questa email è stata inviata a ${params.email} perché ti sei iscritto alla nostra newsletter.
`.trim();
}

class EmailService {
  static async startPrivateCampaign(description, title, object, imagePath, db) {
    try {
      const contacts = await ContactModel.GetAllPrivate(db);
      if (!contacts?.length) return;

      const emailTemplatePath = path.join(__dirname, "EmailTemplate/PrivateCampaign.html");
      const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");
      
      const domainName = dkimConfig ? dkimConfig.domainName : "climawell.net";
      const bounceAddress = `bounce-${Date.now()}@${domainName}`;
      
      const sendEmail = async (contact) => {
        try {
          const name = contact.CustomerFullName?.split(" ")[0] || "";
          const email = contact.CustomerEmail;
          
          const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@${domainName}>`;
          
          const token = [...Array(8)]
            .map(() => (Math.random().toString(36) + "ABCDEFGHIJKLMNOPQRSTUVWXYZ").charAt(Math.floor(Math.random() * 36)))
            .join("");

          const unsubscribeUrl = new URL(`/contacts/remove-private/${token}/`, process.env.FRONTEND_URL).toString();
          const unsubscribeEmail = `unsubscribe@${domainName}`;

          const textContent = generateTextVersion({
            name,
            description,
            link: unsubscribeUrl,
            email: email
          });

          const htmlContent = emailTemplate
            .replace(/\${name}/g, name)
            .replace(/\${description}/g, description)
            .replace(/\${link}/g, unsubscribeUrl)
            .replace(/\${image}/g, `cid:${messageId}-image`);

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
                cid: `${messageId}-image`,
              },
            ],
            messageId: messageId,
            headers: {
              'X-Entity-Ref-ID': messageId,
              'X-Mailer': 'Climawell Mailer v1.0',
              'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:${unsubscribeEmail}?subject=unsubscribe>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              'Feedback-ID': `private:${token}:${domainName}`,
              'Return-Path': bounceAddress,
              'X-Report-Abuse': `Please report abuse to abuse@${domainName}`,
              'X-Priority': '3',
              'Precedence': 'bulk',
              'Auto-Submitted': 'auto-generated'
            },
            priority: 'normal',
            encoding: 'quoted-printable',
            disableFileAccess: true,
            disableUrlAccess: true,
          };

          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
          
          await transporter.sendMail(emailOptions);
          await db.query(
            `UPDATE public."Customer" SET "CampaignToken" = $1, "LastEmailSent" = NOW() WHERE "CustomerEmail" = $2;`,
            [token, email]
          );
          
          console.log(`Email inviata con successo a ${email} (Message-ID: ${messageId})`);
        } catch (error) {
          console.error(`Errore nell'invio dell'email a ${email}:`, error);
        }
      };

      const batchSize = 20;
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        await Promise.all(batch.map(sendEmail));
        if (i + batchSize < contacts.length) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    } catch (error) {
      console.error("Errore durante la campagna:", error);
      throw error;
    }
  }
}

module.exports = EmailService;