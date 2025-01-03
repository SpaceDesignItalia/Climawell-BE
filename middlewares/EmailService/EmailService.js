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
      const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");

      const sendEmail = (contact) => {
        const name = contact.CustomerFullName.split(" ")[0];
        const surname = contact.CustomerFullName.split(" ")[1];
        const email = contact.CustomerEmail;

        const htmlContent = emailTemplate
          .replace("${name}", name || "")
          .replace("${surname}", surname || "")
          .replace("${description}", description)
          .replace(
            "${link}",
            process.env.FRONTEND_URL +
              "/contacts/remove-private/" +
              contact.CustomerEmail
          )
          .replace(
            "${image}",
            process.env.BACKEND_URL + imagePath.replace("public", "")
          );

        const emailOptions = {
          from: `Climawell SRL <${mailData.mail}>`,
          to: email,
          subject: title,
          text: object,
          html: htmlContent,
        };

        transporter.sendMail(emailOptions, (error, info) => {
          if (error) {
            console.error(`Failed to send email to ${email}: ${error.message}`);
          } else {
          }
        });
      };

      // Handle both single contact and array of contacts
      if (Array.isArray(contacts)) {
        contacts.forEach((contact) => sendEmail(contact));
      } else {
        sendEmail(contacts);
      }
    } catch (error) {
      console.error(
        "An error occurred during the private campaign:",
        error.message
      );
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
      const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");

      const sendEmail = (company) => {
        const email = company.CompanyEmail;
        const name = company.CompanyName;

        const htmlContent = emailTemplate
          .replace("${description}", description)
          .replace("${name}", name || "")
          .replace(
            "${link}",
            process.env.FRONTEND_URL +
              "/contacts/remove-company/" +
              company.CompanyEmail
          )
          .replace(
            "${image}",
            process.env.BACKEND_URL + imagePath.replace("public", "")
          );

        const emailOptions = {
          from: `Climawell SRL <${mailData.mail}>`,
          to: email,
          subject: title,
          text: object,
          html: htmlContent,
        };

        transporter.sendMail(emailOptions, (error, info) => {
          if (error) {
            console.error(`Failed to send email to ${email}: ${error.message}`);
          } else {
          }
        });
      };

      // Handle both single company and array of companies
      if (Array.isArray(companies)) {
        companies.forEach((company) => sendEmail(company));
      } else {
        sendEmail(companies);
      }
    } catch (error) {
      console.error(
        "An error occurred during the company campaign:",
        error.message
      );
    }
  }
}

module.exports = EmailService;
