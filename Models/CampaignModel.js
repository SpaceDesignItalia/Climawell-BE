const EmailService = require("../middlewares/EmailService/EmailService");
const Messages = require("../middlewares/WhatsappBusiness/Messages");

class CampaignModel {
  static GetAllEmailCampaigns(db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM public."EmailCampaign" ORDER BY "EmailCampaignId" DESC;`;
      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static GetAllWhatsappCampaigns(db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM public."WhatsappCampaign" ORDER BY "WhatsappCampaignId" DESC;`;
      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static GetNewEmailCampaignsThisMonth(db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT "EmailCampaignId", "Title", "Date" FROM public."EmailCampaign" WHERE EXTRACT(MONTH FROM "Date") = EXTRACT(MONTH FROM CURRENT_DATE);`;
      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static GetNewWhatsappCampaignsThisMonth(db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT "WhatsappCampaignId", "Title", "Date" FROM public."WhatsappCampaign" WHERE EXTRACT(MONTH FROM "Date") = EXTRACT(MONTH FROM CURRENT_DATE);`;
      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static SearchEmailCampaignByTitle(db, title) {
    return new Promise((resolve, reject) => {
      const query = `SELECT "EmailCampaignId", "Title", "Date" FROM public."EmailCampaign" WHERE "Title" ILIKE $1;`;
      const values = [`%${title}%`];
      db.query(query, values, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static SearchWhatsappCampaignByTitle(db, title) {
    return new Promise((resolve, reject) => {
      const query = `SELECT "WhatsappCampaignId", "Title", "Date" FROM public."WhatsappCampaign" WHERE "Title" ILIKE $1;`;
      const values = [`%${title}%`];
      db.query(query, values, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static AddNewCampaign(
    db,
    campaignData,
    campaignType,
    contactType,
    campaignImages,
    Cap,
    Agente
  ) {
    console.log(campaignData);
    return new Promise((resolve, reject) => {
      if (campaignType === "email") {
        const query = `INSERT INTO public."EmailCampaign"(
                "Title",
                "Object",
                "Description",
                "ImagePath")
                VALUES ($1, $2, $3, $4);`;
        const values = [
          campaignData.Title,
          campaignData.Object,
          campaignData.Description,
          campaignImages[0].path,
        ];
        db.query(query, values, (error, result) => {
          if (error) {
            reject(error);
          }

          if (contactType === "private") {
            EmailService.startPrivateCampaign(
              campaignData.Description,
              campaignData.Title,
              campaignData.Object,
              campaignImages[0].path,
              Cap,
              Agente,
              db
            );
          } else if (contactType === "business") {
            EmailService.startCompanyCampaign(
              campaignData.Description,
              campaignData.Title,
              campaignData.Object,
              campaignImages[0].path,
              Cap,
              Agente,
              db
            );
          } else {
            EmailService.startPremiumCampaign(
              campaignData.Description,
              campaignData.Title,
              campaignData.Object,
              campaignImages[0].path,
              Cap,
              Agente,
              db
            );
          }
          resolve(result.rows);
        });
      } else if (campaignType === "whatsapp") {
        const query = `INSERT INTO public."WhatsappCampaign"(
                "Title",
                "Description")
                VALUES ($1, $2) RETURNING *;`;
        const values = [campaignData.Title, campaignData.Description];
        db.query(query, values, (error, result) => {
          if (error) {
            reject(error);
          }
          const campaignId = result.rows[0].WhatsappCampaignId;
          const queries = campaignImages.map((image) => {
            return new Promise((resolve, reject) => {
              const query = `INSERT INTO public."WhatsappCampaignImage"(
                    "ImagePath",
                    "WhatsappCampaignId")
                    VALUES ($1, $2);`;
              const values = [image.path, campaignId];
              db.query(query, values, (error, result) => {
                if (error) {
                  reject(error);
                }
                resolve(result.rows);
              });
            });
          });

          Promise.all(queries)
            .then((results) => {
              if (contactType === "private") {
                Messages.sendPrivateMessage(
                  campaignData.Title,
                  campaignData.Description,
                  campaignImages[0].path,
                  Cap,
                  Agente,
                  db
                );
              } else if (contactType === "business") {
                Messages.sendCompanyMessage(
                  campaignData.Title,
                  campaignData.Description,
                  campaignImages[0].path,
                  Cap,
                  Agente,
                  db
                );
              } else {
                Messages.sendPremiumMessage(
                  campaignData.Title,
                  campaignData.Description,
                  campaignImages[0].path,
                  Cap,
                  Agente,
                  db
                );
              }
              resolve(results);
            })
            .catch((error) => {
              reject(error);
            });
        });
      } else {
        const query = `INSERT INTO public."EmailCampaign"(
            "Title",
            "Object",
            "Description",
            "ImagePath")
            VALUES ($1, $2, $3, $4);`;
        const values = [
          campaignData.Title,
          campaignData.Object,
          campaignData.Description,
          campaignImages[0].path,
        ];
        db.query(query, values, (error, result) => {
          if (error) {
            reject(error);
          }

          if (contactType === "private") {
            EmailService.startPrivateCampaign(
              campaignData.Description,
              campaignData.Title,
              campaignData.Object,
              campaignImages[0].path,
              Cap,
              Agente,
              db
            );
          } else if (contactType === "business") {
            EmailService.startCompanyCampaign(
              campaignData.Description,
              campaignData.Title,
              campaignData.Object,
              campaignImages[0].path,
              Cap,
              Agente,
              db
            );
          } else {
            EmailService.startPremiumCampaign(
              campaignData.Description,
              campaignData.Title,
              campaignData.Object,
              campaignImages[0].path,
              Cap,
              Agente,
              db
            );
          }

          const query = `INSERT INTO public."WhatsappCampaign"(
            "Title",
            "Description")
            VALUES ($1, $2) RETURNING *;`;
          const values = [campaignData.Title, campaignData.Description];
          db.query(query, values, (error, result) => {
            if (error) {
              reject(error);
            }
            const campaignId = result.rows[0].WhatsappCampaignId;
            const queries = campaignImages.map((image) => {
              return new Promise((resolve, reject) => {
                const query = `INSERT INTO public."WhatsappCampaignImage"(
                "ImagePath",
                "WhatsappCampaignId")
                VALUES ($1, $2);`;
                const values = [image.path, campaignId];
                db.query(query, values, (error, result) => {
                  if (error) {
                    reject(error);
                  }
                  resolve(result.rows);
                });
              });
            });

            Promise.all(queries)
              .then((results) => {
                if (contactType === "private") {
                  Messages.sendPrivateMessage(
                    campaignData.Title,
                    campaignData.Description,
                    campaignImages[0].path,
                    Cap,
                    Agente,
                    db
                  );
                } else if (contactType === "business") {
                  Messages.sendCompanyMessage(
                    campaignData.Title,
                    campaignData.Description,
                    campaignImages[0].path,
                    Cap,
                    Agente,
                    db
                  );
                } else {
                  Messages.sendPremiumMessage(
                    campaignData.Title,
                    campaignData.Description,
                    campaignImages[0].path,
                    Cap,
                    Agente,
                    db
                  );
                }
                resolve(results);
              })
              .catch((error) => {
                reject(error);
              });
          });
        });
      }
    });
  }

  static DeleteEmailCampaign(db, campaignId) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM public."EmailCampaign" WHERE "EmailCampaignId" = $1;`;
      const values = [campaignId];
      db.query(query, values, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static DeleteWhatsappCampaign(db, campaignId) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM public."WhatsappCampaign" WHERE "WhatsappCampaignId" = $1;`;
      const values = [campaignId];
      db.query(query, values, (error, result) => {
        if (error) {
          reject(error);
        }
        const query = `DELETE FROM public."WhatsappCampaignImage" WHERE "WhatsappCampaignId" = $1;`;
        db.query(query, values, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      });
    });
  }

  static CheckWhatsappBlock(db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM public."Utils" WHERE "name" = 'blockWhatsappCampaign';`;
      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        }
        console.log(result.rows[0]);
        resolve(result.rows[0].value);
      });
    });
  }
}

module.exports = CampaignModel;
