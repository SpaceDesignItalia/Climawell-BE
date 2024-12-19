class CampaignModel {
  static AddNewCampaign(
    db,
    campaignData,
    campaignType,
    contactType,
    campaignImages
  ) {
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
}

module.exports = CampaignModel;
