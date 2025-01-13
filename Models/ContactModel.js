class ContactModel {
  static GetAllPrivate(isPremium, db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT "CustomerId", 
       CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", 
       "CustomerEmail", 
       "CustomerPhone", 
       "PolicyAccepted", 
       "JConto", 
       "Cap" 
        FROM public."Customer"
        WHERE ($1 = true AND "IsPremium" = true) OR ($1 = false)
        ORDER BY "CustomerId" ASC;
        `;
      db.query(query, [isPremium], (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
        return;
      });
    });
  }

  static GetAllCompany(isPremium, db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * 
      FROM public."Company" 
      WHERE ($1 = true AND "IsPremium" = true) OR ($1 = false)
      ORDER BY "CompanyId" ASC;
      `;
      db.query(query, [isPremium], (error, result) => {
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
            "PolicyDocumentUrl",
            "IsPremium",
            "Cap"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;
          const values = [
            ContactData.CustomerName,
            ContactData.CustomerSurname,
            ContactData.CustomerEmail,
            ContactData.CustomerPhone,
            ContactData.PolicyAccepted,
            PrivacyFile,
            ContactData.isPremium ? true : false,
            ContactData.Cap,
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
            "CompanyVAT",
            "IsPremium",
            "Cap"
          ) VALUES ($1, $2, $3, $4, $5, $6);`;
          const values = [
            ContactData.CompanyName,
            ContactData.CompanyEmail,
            ContactData.CompanyPhone,
            ContactData.CompanyVAT,
            ContactData.isPremium ? true : false,
            ContactData.Cap,
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
        "Cap"
      ) VALUES ($1, $2, $3, 'test', $4, $5);`;

      companies.forEach((company) => {
        const values = [
          company.CompanyName,
          company.CompanyEmail,
          company.CompanyPhone,
          company.JConto,
          company.Cap,
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
        "Cap"
      ) VALUES ($1, $2, $3, $4, true, 'test', $5, $6);`;

      customers.forEach((customer) => {
        const values = [
          customer.CustomerName,
          customer.CustomerSurname,
          customer.CustomerEmail,
          customer.CustomerPhone,
          customer.JConto,
          customer.Cap,
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

  static GetAllCaps(db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT DISTINCT "Cap" FROM public."Customer" ORDER BY "Cap" ASC;`;
      const queryCompany = `SELECT DISTINCT "Cap" FROM public."Company" ORDER BY "Cap" ASC;`;

      db.query(queryCompany, (error, resultCompany) => {
        if (error) {
          return reject(error);
        }

        db.query(query, (error, resultCustomer) => {
          if (error) {
            return reject(error);
          }

          const caps = new Set([
            ...resultCompany.rows.map((row) => row.Cap),
            ...resultCustomer.rows.map((row) => row.Cap),
          ]);

          const capObjects = Array.from(caps)
            .sort()
            .map((cap) => ({ Cap: cap }));

          const filteredCaps = capObjects.filter(
            (cap) => cap.Cap !== null && cap.Cap !== ""
          );
          resolve(filteredCaps);
        });
      });
    });
  }

  static GetPrivatesByCap(cap, db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT "CustomerId", CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", "CustomerEmail", "CustomerPhone", "PolicyAccepted", "JConto", "Cap" FROM public."Customer" 
      WHERE "Cap" = $1
      ORDER BY "CustomerId" ASC `;

      db.query(query, [cap], (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static GetPrivatesPremiumByCap(cap, db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT "CustomerId", CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", "CustomerEmail", "CustomerPhone", "PolicyAccepted", "JConto", "Cap" FROM public."Customer" 
      WHERE "Cap" = $1 AND "IsPremium" = true
      ORDER BY "CustomerId" ASC `;

      db.query(query, [cap], (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static GetCompaniesByCap(cap, db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM public."Company" 
      WHERE "Cap" = $1
      ORDER BY "CompanyId" ASC `;

      db.query(query, [cap], (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static GetCompaniesPremiumByCap(cap, db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM public."Company" 
      WHERE "Cap" = $1 AND "IsPremium" = true
      ORDER BY "CompanyId" ASC `;

      db.query(query, [cap], (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static UpdateContact(db, ContactData, ContactType) {
    return new Promise((resolve, reject) => {
      if (ContactType === "private") {
        const query = `UPDATE public."Customer" SET 
        "CustomerName" = $1, 
        "CustomerSurname" = $2, 
        "CustomerEmail" = $3, 
        "CustomerPhone" = $4, 
        "PolicyAccepted" = $5, 
        "JConto" = $6, 
        "Cap" = $7 
        WHERE "CustomerId" = $8;`;
        const values = [
          ContactData.CustomerName,
          ContactData.CustomerSurname,
          ContactData.CustomerEmail,
          ContactData.CustomerPhone,
          ContactData.PolicyAccepted,
          ContactData.JConto,
          ContactData.Cap,
          ContactData.CustomerId,
        ];

        db.query(query, values, (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        });
      } else {
        const query = `UPDATE public."Company" SET 
        "CompanyName" = $1, 
        "CompanyEmail" = $2, 
        "CompanyPhone" = $3, 
        "JConto" = $4, 
        "Cap" = $5 
        WHERE "CompanyId" = $6;`;
        const values = [
          ContactData.CompanyName,
          ContactData.CompanyEmail,
          ContactData.CompanyPhone,
          ContactData.JConto,
          ContactData.Cap,
          ContactData.CompanyId,
        ];

        db.query(query, values, (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        });
      }
    });
  }

  static GetPrivateById(id, db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM public."Customer" WHERE "CustomerId" = $1;`;

      db.query(query, [id], (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows[0]);
      });
    });
  }

  static GetCompanyById(id, db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM public."Company" WHERE "CompanyId" = $1;`;

      db.query(query, [id], (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows[0]);
      });
    });
  }
}
module.exports = ContactModel;
