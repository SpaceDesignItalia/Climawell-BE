class ContactModel {
  static GetAllPrivate(isPremium, db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT "CustomerId", 
       CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", 
       "CustomerEmail", 
       "CustomerPhone", 
       "PolicyAccepted", 
       "Agente", 
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

  static SearchPrivateContactByEmail(CustomerEmail, isPremium, db) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          "CustomerId", 
          CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", 
          "CustomerEmail", 
          "CustomerPhone", 
          "PolicyAccepted", 
          "Agente", 
          "Cap" 
        FROM public."Customer"
        WHERE (($1 = true AND "IsPremium" = true) OR ($1 = false))
          AND ("CustomerEmail" ILIKE $2)
        ORDER BY "CustomerId" ASC;
      `;

      db.query(query, [isPremium, `%${CustomerEmail}%`], (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.rows);
        }
      });
    });
  }
  static SearchCompanyContactByEmail(CustomerEmail, isPremium, db) {
    return new Promise((resolve, reject) => {
      const query = `
       SELECT * 
      FROM public."Company" 
      WHERE (($1 = true AND "IsPremium" = true) OR ($1 = false))
        AND ("CompanyName" ILIKE $2)
      ORDER BY "CompanyId" ASC;
      `;

      db.query(query, [isPremium, `%${CustomerEmail}%`], (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.rows);
        }
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
          console.log(ContactData);
          // Inserimento del nuovo cliente privato
          const query = `INSERT INTO public."Customer"(
            "CustomerName", 
            "CustomerSurname", 
            "CustomerEmail", 
            "CustomerPhone", 
            "PolicyAccepted", 
            "PolicyDocumentUrl",
            "IsPremium",
            "Cap",
            "Agente"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`;
          const values = [
            ContactData.CustomerName,
            ContactData.CustomerSurname,
            ContactData.CustomerEmail,
            ContactData.CustomerPhone,
            ContactData.PolicyAccepted,
            PrivacyFile,
            ContactData.isPremium ? true : false,
            ContactData.Cap,
            ContactData.Agente,
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
            "Cap",
            "Agente"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7);`;
          const values = [
            ContactData.CompanyName,
            ContactData.CompanyEmail,
            ContactData.CompanyPhone,
            ContactData.CompanyVAT,
            ContactData.isPremium ? true : false,
            ContactData.Cap,
            ContactData.Agente,
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
        "Agente",
        "Cap"
      ) VALUES ($1, $2, $3, 'test', $4, $5);`;

      companies.forEach((company) => {
        const values = [
          company.CompanyName,
          company.CompanyEmail,
          company.CompanyPhone,
          company.Agente,
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
        "Agente",
        "Cap"
      ) VALUES ($1, $2, $3, $4, true, 'test', $5, $6);`;

      customers.forEach((customer) => {
        const values = [
          customer.CustomerName,
          customer.CustomerSurname,
          customer.CustomerEmail,
          customer.CustomerPhone,
          customer.Agente,
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

  static GetPrivatesByCapAndAgente(capList, agenteList, db) {
    console.log(capList, agenteList);

    return new Promise((resolve, reject) => {
      // Se capList è una stringa, proviamo a parsarla
      if (typeof capList === "string") {
        try {
          capList = JSON.parse(capList); // Parsiamo la stringa JSON
        } catch (error) {
          return reject(new Error("Invalid JSON format in capList"));
        }
      }

      // Se agenteList è una stringa, proviamo a parsarla
      if (typeof agenteList === "string") {
        try {
          agenteList = JSON.parse(agenteList); // Parsiamo la stringa JSON
        } catch (error) {
          return reject(new Error("Invalid JSON format in agenteList"));
        }
      }

      // Se capList e agenteList non sono array, ritorniamo errore
      if (!Array.isArray(capList) || !Array.isArray(agenteList)) {
        return reject(new Error("Both capList and agenteList must be arrays"));
      }

      // Estrai i CAP e gli agenti dalle rispettive liste
      const capValues = capList.map((entry) => `'${entry.Cap}'`); // Aggiungiamo le virgolette
      const agenteValues = agenteList.map((agent) => `'${agent.code}'`); // Aggiungiamo le virgolette

      let query;

      // Se entrambi capList e agenteList sono forniti
      if (capValues.length > 0 && agenteValues.length > 0) {
        query = `SELECT "CustomerId", CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", "CustomerEmail", "CustomerPhone", "PolicyAccepted", "Agente", "Cap"
                      FROM public."Customer"
                      INNER JOIN public."Cap" ON "Customer"."Cap" = "Cap"."cap"
                      WHERE ("Cap" IN (${capValues}) OR "generalCap" IN (${capValues}))
                      AND "Agente" IN (${agenteValues})
                      ORDER BY "CustomerId" ASC`;
        console.log(query);
        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      } else if (capValues.length > 0) {
        // Se solo capList è fornita
        query = `SELECT "CustomerId", CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", "CustomerEmail", "CustomerPhone", "PolicyAccepted", "Agente", "Cap"
                      FROM public."Customer"
                      INNER JOIN public."Cap" ON "Customer"."Cap" = "Cap"."cap"
                      WHERE "Cap" IN ($1) OR "generalCap" IN ($1)
                      ORDER BY "CustomerId" ASC`;
        db.query(query, [capValues], (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      } else if (agenteValues.length > 0) {
        // Se solo agenteList è fornita
        query = `SELECT "CustomerId", CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", "CustomerEmail", "CustomerPhone", "PolicyAccepted", "Agente", "Cap"
                      FROM public."Customer"
                      WHERE "Agente" IN ($1)
                      ORDER BY "CustomerId" ASC`;
        db.query(query, [agenteValues], (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      } else {
        // Se nessun parametro è fornito, restituisci tutti i record
        query = `SELECT "CustomerId", CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", "CustomerEmail", "CustomerPhone", "PolicyAccepted", "Agente", "Cap"
                      FROM public."Customer"
                      ORDER BY "CustomerId" ASC`;
        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      }
    });
  }

  static GetPrivatesPremiumByCapAndAgente(capList, agenteList, db) {
    return new Promise((resolve, reject) => {
      // Se capList è una stringa, proviamo a parsarla
      if (typeof capList === "string") {
        try {
          capList = JSON.parse(capList); // Parsiamo la stringa JSON
        } catch (error) {
          return reject(new Error("Invalid JSON format in capList"));
        }
      }

      // Se agenteList è una stringa, proviamo a parsarla
      if (typeof agenteList === "string") {
        try {
          agenteList = JSON.parse(agenteList); // Parsiamo la stringa JSON
        } catch (error) {
          return reject(new Error("Invalid JSON format in agenteList"));
        }
      }

      // Se capList e agenteList non sono array, ritorniamo errore
      if (!Array.isArray(capList) || !Array.isArray(agenteList)) {
        return reject(new Error("Both capList and agenteList must be arrays"));
      }

      // Estrai i CAP e gli agenti dalle rispettive liste
      const capValues = capList.map((entry) => `'${entry.Cap}'`); // Aggiungiamo le virgolette
      const agenteValues = agenteList.map((agent) => `'${agent.code}'`); // Aggiungiamo le virgolette

      let query;

      // Se entrambi capList e agenteList sono forniti
      if (capValues.length > 0 && agenteValues.length > 0) {
        query = `SELECT "CustomerId", CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", 
                        "CustomerEmail", "CustomerPhone", "PolicyAccepted", "Agente", "Cap" 
                 FROM public."Customer"
                 INNER JOIN public."Cap" ON "Customer"."Cap" = "Cap"."cap"
                 WHERE ("Cap" IN (${capValues}) OR "generalCap" IN (${capValues}))
                 AND "Agente" IN (${agenteValues})
                 AND "IsPremium" = true
                 ORDER BY "CustomerId" ASC`;

        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      } else if (capValues.length > 0) {
        // Se solo capList è fornita
        query = `SELECT "CustomerId", CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", 
                        "CustomerEmail", "CustomerPhone", "PolicyAccepted", "Agente", "Cap" 
                 FROM public."Customer"
                 INNER JOIN public."Cap" ON "Customer"."Cap" = "Cap"."cap"
                 WHERE ("Cap" IN (${capValues}) OR "generalCap" IN (${capValues}))
                 AND "IsPremium" = true
                 ORDER BY "CustomerId" ASC`;

        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      } else if (agenteValues.length > 0) {
        // Se solo agenteList è fornita
        query = `SELECT "CustomerId", CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", 
                        "CustomerEmail", "CustomerPhone", "PolicyAccepted", "Agente", "Cap" 
                 FROM public."Customer"
                 WHERE "Agente" IN (${agenteValues})
                 AND "IsPremium" = true
                 ORDER BY "CustomerId" ASC`;

        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      } else {
        // Se nessun parametro è fornito, restituisci tutti i record
        query = `SELECT "CustomerId", CONCAT("CustomerName", ' ', "CustomerSurname") AS "CustomerFullName", 
                        "CustomerEmail", "CustomerPhone", "PolicyAccepted", "Agente", "Cap" 
                 FROM public."Customer"
                 WHERE "IsPremium" = true
                 ORDER BY "CustomerId" ASC`;

        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      }
    });
  }

  static GetCompaniesByCapAndAgente(capList, agenteList, db) {
    return new Promise((resolve, reject) => {
      // Se capList è una stringa, proviamo a parsarla
      if (typeof capList === "string") {
        try {
          capList = JSON.parse(capList); // Parsiamo la stringa JSON
        } catch (error) {
          return reject(new Error("Invalid JSON format in capList"));
        }
      }

      // Se agenteList è una stringa, proviamo a parsarla
      if (typeof agenteList === "string") {
        try {
          agenteList = JSON.parse(agenteList); // Parsiamo la stringa JSON
        } catch (error) {
          return reject(new Error("Invalid JSON format in agenteList"));
        }
      }

      // Se capList e agenteList non sono array, ritorniamo errore
      if (!Array.isArray(capList) || !Array.isArray(agenteList)) {
        return reject(new Error("Both capList and agenteList must be arrays"));
      }

      // Estrai i CAP e gli agenti dalle rispettive liste
      const capValues = capList.map((entry) => `'${entry.Cap}'`); // Aggiungiamo le virgolette
      const agenteValues = agenteList.map((agent) => `'${agent.code}'`); // Aggiungiamo le virgolette

      let query;

      // Se entrambi capList e agenteList sono forniti
      if (capValues.length > 0 && agenteValues.length > 0) {
        query = `SELECT * FROM public."Company" 
                 INNER JOIN public."Cap" ON "Company"."Cap" = "Cap"."cap"
                 WHERE ("Cap" IN (${capValues}) OR "generalCap" IN (${capValues}))
                 AND "Agente" IN (${agenteValues})
                 ORDER BY "CompanyId" ASC`;

        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      } else if (capValues.length > 0) {
        // Se solo capList è fornita
        query = `SELECT * FROM public."Company" 
                 INNER JOIN public."Cap" ON "Company"."Cap" = "Cap"."cap"
                 WHERE ("Cap" IN (${capValues}) OR "generalCap" IN (${capValues}))
                 ORDER BY "CompanyId" ASC`;

        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      } else if (agenteValues.length > 0) {
        // Se solo agenteList è fornita
        query = `SELECT * FROM public."Company" 
                 WHERE "Agente" IN (${agenteValues})
                 ORDER BY "CompanyId" ASC`;

        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      } else {
        // Se nessun parametro è fornito, restituisci tutti i record
        query = `SELECT * FROM public."Company" 
                 ORDER BY "CompanyId" ASC`;

        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      }
    });
  }

  static GetCompaniesPremiumByCapAndAgente(capList, agenteList, db) {
    return new Promise((resolve, reject) => {
      // Se capList è una stringa, proviamo a parsarla
      if (typeof capList === "string") {
        try {
          capList = JSON.parse(capList); // Parsiamo la stringa JSON
        } catch (error) {
          return reject(new Error("Invalid JSON format in capList"));
        }
      }

      // Se agenteList è una stringa, proviamo a parsarla
      if (typeof agenteList === "string") {
        try {
          agenteList = JSON.parse(agenteList); // Parsiamo la stringa JSON
        } catch (error) {
          return reject(new Error("Invalid JSON format in agenteList"));
        }
      }

      // Se capList e agenteList non sono array, ritorniamo errore
      if (!Array.isArray(capList) || !Array.isArray(agenteList)) {
        return reject(new Error("Both capList and agenteList must be arrays"));
      }

      // Estrai i CAP e gli agenti dalle rispettive liste
      const capValues = capList.map((entry) => `'${entry.Cap}'`); // Aggiungiamo le virgolette
      const agenteValues = agenteList.map((agent) => `'${agent.code}'`); // Aggiungiamo le virgolette

      let query;

      // Se entrambi capList e agenteList sono forniti
      if (capValues.length > 0 && agenteValues.length > 0) {
        query = `SELECT * FROM public."Company" 
                 INNER JOIN public."Cap" ON "Company"."Cap" = "Cap"."cap"
                 WHERE ("Cap" IN (${capValues}) OR "generalCap" IN (${capValues}))
                 AND "Agente" IN (${agenteValues})
                 AND "IsPremium" = true
                 ORDER BY "CompanyId" ASC`;

        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      } else if (capValues.length > 0) {
        // Se solo capList è fornita
        query = `SELECT * FROM public."Company" 
                 INNER JOIN public."Cap" ON "Company"."Cap" = "Cap"."cap"
                 WHERE ("Cap" IN (${capValues}) OR "generalCap" IN (${capValues}))
                 AND "IsPremium" = true
                 ORDER BY "CompanyId" ASC`;

        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      } else if (agenteValues.length > 0) {
        // Se solo agenteList è fornita
        query = `SELECT * FROM public."Company" 
                 WHERE "Agente" IN (${agenteValues})
                 AND "IsPremium" = true
                 ORDER BY "CompanyId" ASC`;

        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      } else {
        // Se nessun parametro è fornito, restituisci tutti i record
        query = `SELECT * FROM public."Company" 
                 WHERE "IsPremium" = true
                 ORDER BY "CompanyId" ASC`;

        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
        });
      }
    });
  }

  static UpdateContact(db, ContactData, ContactType) {
    return new Promise((resolve, reject) => {
      if (ContactType === "Private") {
        console.log("Cliente Privato");
        const query = `UPDATE public."Customer" SET 
        "CustomerName" = $1, 
        "CustomerSurname" = $2, 
        "CustomerEmail" = $3,
        "CustomerPhone" = $4, 
        "Cap" = $5,
        "IsPremium" = $6
        WHERE "CustomerId" = $7;`;
        const values = [
          ContactData.CustomerName,
          ContactData.CustomerSurname,
          ContactData.CustomerEmail,
          ContactData.CustomerPhone,
          ContactData.Cap,
          ContactData.IsPremium ? true : false,
          ContactData.CustomerId,
        ];

        db.query(query, values, (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        });
      } else {
        console.log("Cliente Azienda");
        const query = `UPDATE public."Company" SET 
        "CompanyName" = $1, 
        "CompanyEmail" = $2, 
        "CompanyPhone" = $3, 
        "Cap" = $4,
        "IsPremium" = $5
        WHERE "CompanyId" = $6;`;
        const values = [
          ContactData.CompanyName,
          ContactData.CompanyEmail,
          ContactData.CompanyPhone,
          ContactData.Cap,
          ContactData.IsPremium ? true : false,
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
