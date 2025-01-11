class ContactModel {
  static GetAllPrivate(db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT "CustomerId", CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", "CustomerEmail", "CustomerPhone", "PolicyAccepted", "JConto"
      FROM public."Customer" ORDER BY "CustomerId" ASC `;

      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static GetAllCompany(db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM public."Company" ORDER BY "CompanyId" ASC `;

      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static AddContact(db, ContactData, ContactType, PrivacyFile) {
    return new Promise((resolve, reject) => {
      if (ContactType === "private") {
        // Controllo esistenza cliente privato con la stessa email
        const checkEmailQuery = `SELECT COUNT(*) FROM public."Customer" WHERE "CustomerEmail" = $1;`;
        const emailValue = [ContactData.CustomerEmail];

        db.query(checkEmailQuery, emailValue, (error, result) => {
          if (error) {
            return reject(error);
          }

          const emailExists = parseInt(result.rows[0].count) > 0;

          if (emailExists) {
            return reject(new Error("Esiste già un cliente con questa email."));
          }

          // Inserimento del nuovo cliente privato
          const query = `INSERT INTO public."Customer"(
            "CustomerName", 
            "CustomerSurname", 
            "CustomerEmail", 
            "CustomerPhone", 
            "PolicyAccepted", 
            "PolicyDocumentUrl"
          ) VALUES ($1, $2, $3, $4, $5, $6);`;
          const values = [
            ContactData.CustomerName,
            ContactData.CustomerSurname,
            ContactData.CustomerEmail,
            ContactData.CustomerPhone,
            ContactData.PolicyAccepted,
            PrivacyFile,
          ];

          db.query(query, values, (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          });
        });
      } else {
        // Controllo esistenza azienda con lo stesso nome e Partita IVA
        const checkCompanyQuery = `SELECT COUNT(*) FROM public."Company" WHERE "CompanyName" = $1 AND "CompanyVAT" = $2;`;
        const companyValues = [ContactData.CompanyName, ContactData.CompanyVAT];

        db.query(checkCompanyQuery, companyValues, (error, result) => {
          if (error) {
            return reject(error);
          }

          const companyExists = parseInt(result.rows[0].count) > 0;
          if (companyExists) {
            return reject(
              new Error("Esiste già un'azienda con questo nome e Partita IVA.")
            );
          }

          // Inserimento della nuova azienda
          const query = `INSERT INTO public."Company"(
            "CompanyName", 
            "CompanyEmail", 
            "CompanyPhone", 
            "CompanyVAT"
          ) VALUES ($1, $2, $3, $4);`;
          const values = [
            ContactData.CompanyName,
            ContactData.CompanyEmail,
            ContactData.CompanyPhone,
            ContactData.CompanyVAT,
          ];

          db.query(query, values, (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          });
        });
      }
    });
  }

  static UploadContacts(db, companies, customers) {
    return new Promise((resolve, reject) => {
      // Query per eliminare ed inserire le aziende
      const deleteCompanyQuery = `DELETE FROM public."Company" WHERE "CompanyName" = $1;`;
      const insertCompanyQuery = `INSERT INTO public."Company"(
        "CompanyName", 
        "CompanyEmail", 
        "CompanyPhone", 
        "CompanyVAT",
        "JConto",
        "Cap",
        "Citta",
        "Provincia"
      ) VALUES ($1, $2, $3, 'test', $4, $5, $6, $7);`;

      companies.forEach((company) => {
        const values = [
          company.CompanyName,
          company.CompanyEmail,
          company.CompanyPhone,
          company.JConto,
          company.Cap,
          company.Citta,
          company.Provincia,
        ];

        // Elimina prima la riga esistente con lo stesso CompanyName
        db.query(deleteCompanyQuery, [company.CompanyName], (error, result) => {
          if (error) {
            return reject(error);
          }

          // Poi inserisci la nuova riga
          db.query(insertCompanyQuery, values, (error, result) => {
            if (error) {
              return reject(error);
            }
          });
        });
      });

      // Query per eliminare ed inserire i clienti
      const deleteCustomerQuery = `DELETE FROM public."Customer" WHERE "CustomerName" = $1 AND "CustomerSurname" = $2;`;
      const insertCustomerQuery = `INSERT INTO public."Customer"(
        "CustomerName", 
        "CustomerSurname", 
        "CustomerEmail", 
        "CustomerPhone", 
        "PolicyAccepted", 
        "PolicyDocumentUrl",
        "JConto",
        "Cap",
        "Citta",
        "Provincia"
      ) VALUES ($1, $2, $3, $4, true, 'test', $5, $6, $7, $8);`;

      customers.forEach((customer) => {
        const values = [
          customer.CustomerName,
          customer.CustomerSurname,
          customer.CustomerEmail,
          customer.CustomerPhone,
          customer.JConto,
          customer.Cap,
          customer.Citta,
          customer.Provincia,
        ];

        // Elimina prima la riga esistente con lo stesso CustomerName e CustomerSurname
        db.query(
          deleteCustomerQuery,
          [customer.CustomerName, customer.CustomerSurname],
          (error, result) => {
            if (error) {
              return reject(error);
            }

            // Poi inserisci la nuova riga
            db.query(insertCustomerQuery, values, (error, result) => {
              if (error) {
                return reject(error);
              }
            });
          }
        );
      });

      resolve();
    });
  }

  static DeletePrivateContact(db, CampaignToken) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM public."Customer" WHERE "CampaignToken" = $1;`;

      db.query(query, [CampaignToken], (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    });
  }

  static DeleteCompanyContact(db, CampaignToken) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM public."Company" WHERE "CampaignToken" = $1;`;

      db.query(query, [CampaignToken], (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    });
  }
}
module.exports = ContactModel;
