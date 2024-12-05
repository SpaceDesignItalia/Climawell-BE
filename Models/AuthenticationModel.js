const bcrypt = require("bcrypt");

class StafferModel {
  static loginStaffer(db, LoginData) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM public."Staffer" WHERE "StafferEmail" = $1`;

      db.query(query, [LoginData.email], (error, result) => {
        if (error) {
          reject(error);
        } else {
          if (result.rows.length === 1) {
            const isPasswordValid = bcrypt.compareSync(
              LoginData.password,
              result.rows[0].StafferPassword
            );
            if (isPasswordValid) {
              resolve(result.rows[0]);
            } else {
              reject(false);
            }
          } else {
            resolve(false);
          }
        }
      });
    });
  }

  static passwordRecovery(db, Email, recoveryCode) {
    return new Promise((resolve, reject) => {
      const updateQuery = `UPDATE public."Staffer" SET "RecoveryCode" = $1 WHERE "StafferEmail" = $2`;

      db.query(updateQuery, [recoveryCode, Email], (error, result) => {
        if (error) {
          reject(error);
        } else {
          // Imposta il timer per cancellare il RecoveryCode dopo 5 minuti
          setTimeout(() => {
            const clearQuery = `UPDATE public."Staffer" SET "RecoveryCode" = NULL WHERE "StafferEmail" = $1`;

            db.query(clearQuery, [Email], (error, result) => {
              if (error) {
                console.error(
                  "Errore durante la cancellazione del RecoveryCode:",
                  error
                );
              }
            });
          }, 5 * 60 * 1000); // 5 minuti in millisecondi

          resolve(result);
        }
      });
    });
  }

  static ResetPassword(db, Email, Code, newPassword) {
    return new Promise((resolve, reject) => {
      const checkCode = `SELECT * FROM public."Staffer" WHERE "RecoveryCode" = $1 AND "StafferEmail" = $2`;
      db.query(checkCode, [Code, Email], (error, result) => {
        if (error) {
          reject(error);
        } else {
          if (result.rows.length === 1) {
            const updateQuery = `UPDATE public."Staffer" SET "StafferPassword" = $1 WHERE "RecoveryCode" = $2`;

            db.query(updateQuery, [newPassword, Code], (error, result) => {
              if (error) {
                reject(error);
              } else {
                bcrypt.hash(newPassword, 10, (hashError, hashedPassword) => {
                  if (hashError) {
                    reject(hashError);
                  }

                  const query = `UPDATE public."Staffer" SET "StafferPassword" = $1 WHERE "StafferEmail" = $2 AND "RecoveryCode" = $3`;

                  const values = [hashedPassword, Email, Code];

                  db.query(query, values, (error, resultUpdate) => {
                    if (error) {
                      reject(error);
                    } else {
                      resolve(resultUpdate);
                    }
                  });
                });
              }
            });
          } else {
            reject(false);
          }
        }
      });
    });
  }
}
module.exports = StafferModel;
