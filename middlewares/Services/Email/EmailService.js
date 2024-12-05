var nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

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
  static sendStafferWelcomeMail(email, name, surname, password) {
    const emailTemplatePath = path.join(
      __dirname,
      "EmailTemplate/WelcomeStafferModel.html"
    );
    const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");

    let htmlContent = emailTemplate
      .replace("${name}", name)
      .replace("${surname}", surname)
      .replace("${email}", email)
      .replace("${password}", password);

    const sendStafferWelcomeMail = {
      from: `Space Design Italia <${mailData.mail}>`,
      to: email,
      subject: "Benvenuto a bordo del team di Space Design Italia",
      text: "Benvenuto nel team di Space Design Italia! Siamo entusiasti di averti con noi.",
      html: htmlContent,
    };

    transporter.sendMail(sendStafferWelcomeMail, (error, info) => {
      if (error) {
        return console.log(error);
      }
    });
  }

  static sendStafferRemoval(email, fullname) {
    const emailTemplatePath = path.join(
      __dirname,
      "EmailTemplate/RemovalSafferModel.html"
    );
    const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");

    let htmlContent = emailTemplate.replace("${fullname}", fullname);

    const sendStafferRemovalMail = {
      from: `Space Design Italia <${mailData.mail}>`,
      to: email,
      subject: "Collaborazione con Space Design Italia terminata",
      text:
        "Caro/a " +
        fullname +
        ",\n\nVogliamo informarti che la tua collaborazione con Space Design Italia è terminata. Ti ringraziamo sinceramente per il tuo contributo e ti auguriamo il meglio per il futuro.",
      html: htmlContent,
    };

    transporter.sendMail(sendStafferRemovalMail, (error, info) => {
      if (error) {
        return console.log(error);
      }
    });
  }

  static sendCustomerWelcomeMail(email, name, surname, password) {
    const emailTemplatePath = path.join(
      __dirname,
      "EmailTemplate/WelcomeCustomerModel.html"
    );
    const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");

    let htmlContent = emailTemplate
      .replace("${name}", name)
      .replace("${surname}", surname)
      .replace("${email}", email)
      .replace("${password}", password);

    const sendCustomerWelcomeMail = {
      from: `Space Design Italia <${mailData.mail}>`,
      to: email,
      subject: "Benvenuto nel mondo di Space Design Italia!",
      text:
        "Caro/a " +
        name +
        " " +
        surname +
        ",\n\nSiamo entusiasti di darti il benvenuto nel fantastico mondo di Space Design Italia! Non vediamo l'ora di iniziare questa avventura insieme e creare qualcosa di straordinario! 🚀✨",
      html: htmlContent,
    };

    transporter.sendMail(sendCustomerWelcomeMail, (error, info) => {
      if (error) {
        return console.log(error);
      }
    });
  }

  static sendPasswordChangedMail(email, name, surname) {
    const emailTemplatePath = path.join(
      __dirname,
      "EmailTemplate/PasswordChanged.html"
    );
    const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");

    let htmlContent = emailTemplate
      .replace("${name}", name)
      .replace("${surname}", surname);

    const sendPasswordChangedMail = {
      from: `Space Design Italia <${mailData.mail}>`,
      to: email,
      subject: "Password di accesso modificata!",
      text:
        "Caro/a " +
        name +
        " " +
        surname +
        ",\n\nLa tua password di accesso è stata modificata!",
      html: htmlContent,
    };

    transporter.sendMail(sendPasswordChangedMail, (error, info) => {
      if (error) {
        return console.log(error);
      }
    });
  }

  static sendPasswordRecoveryMail(email, recoveryCode) {
    const emailTemplatePath = path.join(
      __dirname,
      "EmailTemplate/PasswordRecovery.html"
    );
    const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");

    let htmlContent = emailTemplate.replace("${recoveryCode}", recoveryCode);

    const sendPasswordRecoveryMail = {
      from: `Space Design Italia <${mailData.mail}>`,
      to: email,
      subject: "Recupero password",
      text:
        "Ciao! Ecco il codice per recuperare la tua password: " + recoveryCode,
      html: htmlContent,
    };

    transporter.sendMail(sendPasswordRecoveryMail, (error, info) => {
      if (error) {
        return console.log(error);
      }
    });
  }
}
module.exports = EmailService;
