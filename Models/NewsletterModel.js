class NewsletterModel {
    
    static GetAllEmail(db) {
      return new Promise((resolve, reject) => {
        const query = `SELECT * FROM public."Newsletter" ORDER BY "NewsletterId" ASC `;
  
        db.query(query, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result.rows);
          console.log(result.rows);
        });
      });
    }

    static async PostEmail(db, email) {
      console.log("Valore ricevuto per email:", email);
      const query = `INSERT INTO public."Newsletter" ("NewsletterEmail") VALUES ($1) RETURNING *`;
      return db.query(query, [email]);
    }
  }
  module.exports = NewsletterModel;
  