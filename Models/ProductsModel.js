const fs = require("fs");
const path = require("path");

class ProductsModel {
  static getAllProducts(db) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
            p.*,
            c.*,
            pd."DiscountPercentage",
            CASE 
                WHEN fp."ProductId" IS NOT NULL THEN true 
                ELSE false 
            END AS "isFeatured",
            (SELECT pi."ProductImageUrl"
             FROM "Productimage" pi
             WHERE pi."ProductId" = p."ProductId"
             ORDER BY pi."ProductImageId" ASC
             LIMIT 1) AS "FirstImage"
        FROM "Product" p
        LEFT JOIN "Category" c ON p."CategoryId" = c."CategoryId"
        LEFT JOIN "FeaturedProduct" fp ON p."ProductId" = fp."ProductId"
        LEFT JOIN "ProductDiscount" pd ON p."ProductId" = pd."ProductId"
      `;

      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.rows);
        }
      });
    });
  }

  static isFeatured(id, db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM "FeaturedProduct" WHERE "idproduct" = $1`;

      db.query(query, [id], (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.rows.length > 0);
        }
      });
    });
  }

  static getFeaturedProducts(db) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
            p.*,
            c.*,
            pd."DiscountPercentage",
            CASE 
                WHEN fp."ProductId" IS NOT NULL THEN true 
                ELSE false 
            END AS "isFeatured",
            (SELECT pi."ProductImageUrl"
             FROM "Productimage" pi
             WHERE pi."ProductId" = p."ProductId"
             ORDER BY pi."ProductImageId" ASC
             LIMIT 1) AS "FirstImage"
        FROM "Product" p
        LEFT JOIN "Category" c ON p."CategoryId" = c."CategoryId"
        JOIN "FeaturedProduct" fp ON p."ProductId" = fp."ProductId"
        LEFT JOIN "ProductDiscount" pd ON p."ProductId" = pd."ProductId"
      `;

      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.rows);
        }
      });
    });
  }

  static getProductById(ProductId, db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT 
              p.*,
              c.*,
              pd."DiscountPercentage",
              CASE 
                  WHEN fp."ProductId" IS NOT NULL THEN true 
                  ELSE false 
              END AS "isFeatured",
              pi."ProductImageId",
              pi."ProductImageUrl"
          FROM "Product" p
          LEFT JOIN "Category" c ON p."CategoryId" = c."CategoryId"
          LEFT JOIN "FeaturedProduct" fp ON p."ProductId" = fp."ProductId"
          LEFT JOIN "ProductDiscount" pd ON p."ProductId" = pd."ProductId"
          LEFT JOIN "Productimage" pi ON pi."ProductId" = p."ProductId"
          WHERE p."ProductId" = $1`;

      db.query(query, [ProductId], (error, result) => {
        if (error) {
          reject(error);
        } else {
          if (result.rows.length === 0) {
            resolve(null);
          } else {
            const productData = result.rows[0];
            const ProductImages = result.rows.map((row) => ({
              ProductImageId: row.ProductImageId,
              ProductImageUrl: row.ProductImageUrl,
            }));

            resolve({
              ...productData,
              ProductImages,
            });
          }
        }
      });
    });
  }

  static async getCategoryById(CategoryId, db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT "CategoryName" FROM "Category" WHERE "CategoryId" = $1`;
      db.query(query, [CategoryId], (error, result) => {
        if (error) {
          reject(error);
        } else {
          if (result.rows.length === 0) {
            reject(
              Object.assign(
                new Error("Non esiste nessuna categoria con questo Id!"),
                { status: 404 }
              )
            );
          } else {
            resolve(result.rows[0]);
          }
        }
      });
    });
  }

  static async getImagesByProductId(ProductId, db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM "Productimage" WHERE "ProductId" = $1`;
      db.query(query, [ProductId], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.rows);
        }
      });
    });
  }

  static async getAllCategories(db) {
    try {
      const query = `SELECT * FROM "Category"`;
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Errore nel recupero delle categorie:", error);
      throw new Error("Impossibile recuperare le categorie");
    }
  }

  static searchProductByName(productName, db) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
            p.*,
            c.*,
            pd."DiscountPercentage",
            CASE 
                WHEN fp."ProductId" IS NOT NULL THEN true 
                ELSE false 
            END AS "isFeatured",
            (SELECT pi."ProductImageUrl"
             FROM "Productimage" pi
             WHERE pi."ProductId" = p."ProductId"
             ORDER BY pi."ProductImageId" ASC
             LIMIT 1) AS "FirstImage"
        FROM "Product" p
        LEFT JOIN "Category" c ON p."CategoryId" = c."CategoryId"
        LEFT JOIN "FeaturedProduct" fp ON p."ProductId" = fp."ProductId"
        LEFT JOIN "ProductDiscount" pd ON p."ProductId" = pd."ProductId"
        WHERE p."ProductName" ILIKE $1;
      `;

      const values = [`%${productName}%`]; // Per una ricerca parziale

      db.query(query, values, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.rows);
        }
      });
    });
  }

  static searchFeaturedProductByName(productName, db) {
    return new Promise((resolve, reject) => {
      const query = `

        SELECT

            p.*,
            c.*,
            pd."DiscountPercentage",
            CASE
                WHEN fp."ProductId" IS NOT NULL THEN true
                ELSE false
            END AS "isFeatured",
            (SELECT pi."ProductImageUrl"


              FROM "Productimage" pi
              WHERE pi."ProductId" = p."ProductId"
              ORDER BY pi."ProductImageId" ASC
              LIMIT 1) AS "FirstImage"
        FROM "Product" p
        LEFT JOIN "Category" c ON p."CategoryId" = c."CategoryId"
        JOIN "FeaturedProduct" fp ON p."ProductId" = fp."ProductId"
        LEFT JOIN "ProductDiscount" pd ON p."ProductId" = pd."ProductId"
        WHERE p."ProductName" ILIKE $1;
      `;
      const values = [`%${productName}%`];

      db.query(query, values, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.rows);
        }
      });
    });
  }

  static orderProductsBy(db, order, orderBy, searchQuery) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
            p.*,
            c.*,
            pd."DiscountPercentage",
            CASE
                WHEN fp."ProductId" IS NOT NULL THEN true
                ELSE false
            END AS "isFeatured",
            (SELECT pi."ProductImageUrl"
              FROM "Productimage" pi
              WHERE pi."ProductId" = p."ProductId"
              ORDER BY pi."ProductImageId" ASC
              LIMIT 1) AS "FirstImage"
        FROM "Product" p
        LEFT JOIN "Category" c ON p."CategoryId" = c."CategoryId"
        LEFT JOIN "FeaturedProduct" fp ON p."ProductId" = fp."ProductId"
        LEFT JOIN "ProductDiscount" pd ON p."ProductId" = pd."ProductId"
        WHERE p."ProductName" ILIKE '%' || $1 || '%'
        ORDER BY "${orderBy}" ${order};
      `;

      db.query(query, [searchQuery], (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.rows);
        }
      });
    });
  }

  static orderFeaturedProductsBy(db, order, orderBy, searchQuery) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
            p.*,
            c.*,
            pd."DiscountPercentage",
            CASE
                WHEN fp."ProductId" IS NOT NULL THEN true
                ELSE false
            END AS "isFeatured",
            (SELECT pi."ProductImageUrl"
              FROM "Productimage" pi
              WHERE pi."ProductId" = p."ProductId"
              ORDER BY pi."ProductImageId" ASC
              LIMIT 1) AS "FirstImage"
        FROM "Product" p
        LEFT JOIN "Category" c ON p."CategoryId" = c."CategoryId"
        JOIN "FeaturedProduct" fp ON p."ProductId" = fp."ProductId"
        LEFT JOIN "ProductDiscount" pd ON p."ProductId" = pd."ProductId"
        WHERE p."ProductName" ILIKE '%' || $1 || '%'
        ORDER BY "${orderBy}" ${order};
      `;

      db.query(query, [searchQuery], (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.rows);
        }
      });
    });
  }

  static async searchCategoryByName(searchQuery, db) {
    try {
      const query = `SELECT * FROM "Category" WHERE "CategoryName" ILIKE $1`;
      const { rows } = await db.query(query, [`%${searchQuery}%`]);
      return rows;
    } catch (error) {
      console.error("Errore nella ricerca della categoria:", error);
      throw new Error("Impossibile completare la ricerca della categoria");
    }
  }

  static async getWarehouseStats(db) {
    return new Promise((resolve, reject) => {
      const query = `
         SELECT 
        (SELECT COUNT(*) FROM public."Product") AS "TotalProducts",
        (SELECT COUNT(*) FROM public."Category") AS "TotalCategories",
        (SELECT SUM("ProductAmount") FROM public."Product") AS "TotalPieces";
      `;
      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows[0]);
      });
    });
  }

  static async getCategoryStats(db) {
    return new Promise((resolve, reject) => {
      const query = `
      SELECT 
        c."CategoryName", 
        ROUND(COUNT(p."ProductId") * 100.0 / (SELECT COUNT(*) FROM "Product"), 2) AS "Percentage"
      FROM 
        "Product" p
      JOIN 
        "Category" c ON p."CategoryId" = c."CategoryId"
      GROUP BY 
        c."CategoryName"
      ORDER BY 
        "Percentage" DESC;`; // Ordina in base alla percentuale, opzionale
      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows); // Restituisci tutte le righe
      });
    });
  }

  static async getWarehouseValue(db) {
    return new Promise((resolve, reject) => {
      const query = `
         SELECT 
          SUM("ProductAmount" * "UnitPrice") AS "TotalValue"
        FROM public."Product";`;
      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows[0]);
      });
    });
  }
  static async getWarehouseValueYear(db) {
    return new Promise((resolve, reject) => {
      const query = `SELECT EXTRACT(YEAR FROM "Date") AS year, EXTRACT(MONTH FROM "Date") AS month, AVG("StockValue") AS "monthly_avg"
      FROM public."WarehouseValue" WHERE EXTRACT(YEAR FROM "Date") = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY year, month
      ORDER BY year, month;`;

      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static async updateWarehouseValue(db) {
    return new Promise((resolve, reject) => {
      const query = `INSERT INTO public."WarehouseValue" ("StockValue")
      VALUES ((SELECT SUM(p."ProductAmount" * p."UnitPrice") FROM public."Product" p));`;

      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result.rows);
      });
    });
  }

  static addProduct(product, files, db) {
    return new Promise((resolve, reject) => {
      // Controlla se esiste un prodotto con lo stesso nome
      const checkQuery = `
      SELECT "ProductId" 
      FROM public."Product" 
      WHERE LOWER("ProductName") = LOWER($1);
    `;

      db.query(checkQuery, [product.ProductName], (checkError, checkResult) => {
        if (checkError) {
          cleanUpFiles(files);
          return reject(checkError);
        }

        if (checkResult.rows.length > 0) {
          cleanUpFiles(files);
          return reject(
            Object.assign(
              new Error("Un prodotto con questo nome esiste già."),
              { status: 409 }
            )
          );
        }

        // Query per inserire un nuovo prodotto
        const insertQuery = `
        INSERT INTO public."Product"("ProductName", "ProductDescription", "ProductAmount", 
        "UnitPrice", "Height", "Width", "Depth", "Weight", "CategoryId")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING "ProductId";
      `;

        const insertValues = [
          product.ProductName,
          product.ProductDescription,
          product.ProductAmount,
          product.ProductPrice,
          product.ProductHeight,
          product.ProductWidth,
          product.ProductDepth,
          product.ProductWeight,
          product.CategoryId,
        ];

        db.query(insertQuery, insertValues, (insertError, insertResult) => {
          if (insertError) {
            cleanUpFiles(files);
            return reject(insertError);
          }

          const productId = insertResult.rows[0].ProductId;

          // Gestisci l'inserimento del prodotto in evidenza se richiesto
          const handleFeatured = () =>
            new Promise((resolveFeatured, rejectFeatured) => {
              if (product.IsFeatured === "true") {
                const featuredQuery = `
                INSERT INTO public."FeaturedProduct"("ProductId")
                VALUES ($1);
              `;

                db.query(featuredQuery, [productId], (featuredError) => {
                  if (featuredError) {
                    rejectFeatured(featuredError);
                  } else {
                    resolveFeatured();
                  }
                });
              } else {
                resolveFeatured();
              }
            });

          // Inserisci le immagini
          const handleImages = () =>
            Promise.all(
              files.map((file) => {
                return new Promise((resolveImage, rejectImage) => {
                  const imageQuery = `
                  INSERT INTO "Productimage" ("ProductId", "ProductImageUrl")
                  VALUES ($1, $2);
                `;
                  db.query(
                    imageQuery,
                    [productId, file.filename],
                    (imageError) => {
                      if (imageError) {
                        rejectImage(imageError);
                      } else {
                        resolveImage();
                      }
                    }
                  );
                });
              })
            );

          // Esegui le operazioni in sequenza
          handleFeatured()
            .then(handleImages)
            .then(() => {
              resolve({ productId });
            })
            .catch((error) => {
              cleanUpFiles(files);
              reject(error);
            });
        });
      });
    });
  }

  static addCategory(CategoryName, db) {
    return new Promise((resolve, reject) => {
      // Step 1: Check if the category already exists
      const checkQuery = `SELECT "CategoryId" FROM "Category" WHERE "CategoryName" = $1`;
      db.query(checkQuery, [CategoryName], (checkError, checkResult) => {
        if (checkError) {
          reject(checkError);
        } else if (checkResult.rows.length > 0) {
          // Category already exists
          reject(new Error("Una categoria con questo nome esiste già."));
        } else {
          // Step 2: If the category doesn't exist, insert it
          const insertQuery = `
              INSERT INTO "Category" ("CategoryName")
              VALUES ($1) RETURNING "CategoryId"`;
          db.query(insertQuery, [CategoryName], (insertError, insertResult) => {
            if (insertError) {
              reject(insertError);
            } else {
              resolve(insertResult.rows[0].CategoryId); // Return the inserted category ID
            }
          });
        }
      });
    });
  }

  static async uploadImage(productId, file, db) {
    try {
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(__dirname, "../public/uploads", fileName);

      // Sposta il file nella directory di upload
      fs.writeFileSync(filePath, file.buffer);

      // Salva il percorso nel database
      const query = `
        INSERT INTO "Productimage" ("ProductId", "ProductImageUrl")
        VALUES ($1, $2)`;
      await db.query(query, [productId, `/uploads/${fileName}`]);

      return true;
    } catch (error) {
      console.error("Errore nel caricamento dell'immagine:", error);
      throw new Error("Impossibile caricare l'immagine");
    }
  }

  static deleteProduct(Product, db) {
    return new Promise(async (resolve, reject) => {
      try {
        const selectFileToDeleteQuery = `SELECT * FROM "Productimage" WHERE "ProductId" = $1`;

        db.query(
          selectFileToDeleteQuery,
          [Product.ProductId],
          (selectFileToDeleteError, selectFileToDeleteResult) => {
            if (selectFileToDeleteError) {
              return reject(selectFileToDeleteError);
            }
            cleanUpFiles(selectFileToDeleteResult.rows);
          }
        );

        const deleteImagesQuery = `
        DELETE FROM "Productimage"
        WHERE "ProductId" = $1;
      `;
        await db.query(deleteImagesQuery, [Product.ProductId]);

        const deleteProductQuery = `
        DELETE FROM public."Product"
        WHERE "ProductId" = $1;
      `;
        await db.query(deleteProductQuery, [Product.ProductId]);

        resolve({ success: true });
      } catch (error) {
        reject(error);
      }
    });
  }

  static async deleteCategory(Category, db) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM "Category" WHERE "CategoryId" = $1`;
      db.query(query, [Category.CategoryId], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  static updateCategory(categoryId, categoryName, db) {
    return new Promise((resolve, reject) => {
      // Verifica se esiste un'altra categoria con lo stesso nome
      const checkQuery = `
        SELECT "CategoryId"
        FROM "Category"
        WHERE "CategoryName" = $1 AND "CategoryId" != $2`;

      db.query(
        checkQuery,
        [categoryName, categoryId],
        (checkError, checkResult) => {
          if (checkError) {
            return reject(
              Object.assign(
                new Error("Errore durante la verifica della categoria."),
                { status: 500 }
              )
            );
          }

          if (checkResult.rowCount > 0) {
            // Categoria duplicata trovata
            return reject(
              Object.assign(
                new Error("Una categoria con questo nome esiste già."),
                { status: 409 }
              )
            );
          }

          // Esegui l'aggiornamento della categoria
          const updateQuery = `
          UPDATE "Category"
          SET "CategoryName" = $1
          WHERE "CategoryId" = $2`;

          db.query(updateQuery, [categoryName, categoryId], (error, result) => {
            if (error) {
              return reject(
                Object.assign(
                  new Error("Errore durante l'aggiornamento della categoria."),
                  { status: 500 }
                )
              );
            }

            resolve(result); // true se aggiornato, false altrimenti
          });
        }
      );
    });
  }

  static async updateProduct(productData, files, db) {
    return new Promise((resolve, reject) => {
      // Step 1: Update the product details
      const updateQuery = `
        UPDATE public."Product"
        SET "ProductName" = $1,
            "ProductDescription" = $2,
            "ProductAmount" = $3,
            "UnitPrice" = $4,
            "Height" = $5,
            "Width" = $6,
            "Depth" = $7,
            "Weight" = $8,
            "CategoryId" = $9
        WHERE "ProductId" = $10
        RETURNING "ProductId";
      `;

      db.query(
        updateQuery,
        [
          productData.ProductName,
          productData.ProductDescription,
          productData.ProductAmount,
          productData.ProductPrice,
          productData.ProductHeight,
          productData.ProductWidth,
          productData.ProductDepth,
          productData.ProductWeight,
          productData.CategoryId,
          productData.ProductId,
        ],
        (updateError, updateResult) => {
          if (updateError) {
            cleanUpFiles(files);
            return reject(updateError);
          }

          const productId = updateResult.rows[0].ProductId;

          // Step 2: Update the featured status
          const updateFeaturedQuery = `
            DELETE FROM public."FeaturedProduct"
            WHERE "ProductId" = $1;
          `;

          db.query(updateFeaturedQuery, [productId], (featuredError) => {
            if (featuredError) {
              cleanUpFiles(files);
              return reject(featuredError);
            }

            if (productData.IsFeatured === "true") {
              const insertFeaturedQuery = `
                INSERT INTO public."FeaturedProduct"("ProductId")
                VALUES ($1);
              `;

              db.query(insertFeaturedQuery, [productId], (insertError) => {
                if (insertError) {
                  cleanUpFiles(files);
                  return reject(insertError);
                }
              });
            }

            // Verifica e conversione della stringa in array
            if (typeof productData.OldImages === "string") {
              try {
                productData.OldImages = JSON.parse(productData.OldImages);
              } catch (error) {
                console.error("Errore durante il parsing di OldImages:", error);
                productData.OldImages = []; // Inizializza come array vuoto in caso di errore
              }
            }

            // Assicurati che sia un array anche dopo il parsing
            if (!Array.isArray(productData.OldImages)) {
              productData.OldImages = [];
            }

            // Generazione della query
            const oldImageIds =
              productData.OldImages.length > 0
                ? productData.OldImages.join(",")
                : null;

            let selectFileToDeleteQuery;
            if (oldImageIds) {
              // Caso: ci sono ID da escludere
              selectFileToDeleteQuery = `SELECT * FROM public."Productimage" WHERE "ProductId" = $1 AND "ProductImageId" NOT IN (${oldImageIds});`;
            } else {
              // Caso: nessun ID da escludere
              selectFileToDeleteQuery = `SELECT * FROM public."Productimage" WHERE "ProductId" = $1`;
            }
            db.query(
              selectFileToDeleteQuery,
              [productId],
              (selectFileToDeleteError, selectFileToDeleteResult) => {
                if (selectFileToDeleteError) {
                  return reject(selectFileToDeleteError);
                }
                cleanUpFiles(selectFileToDeleteResult.rows);
              }
            );

            let updateImagesQuery;
            if (oldImageIds) {
              // Caso: ci sono ID da escludere
              updateImagesQuery = `
                DELETE FROM public."Productimage"
                WHERE "ProductId" = $1 
                AND "ProductImageId" NOT IN (${oldImageIds});
              `;
            } else {
              // Caso: nessun ID da escludere
              updateImagesQuery = `
                DELETE FROM public."Productimage"
                WHERE "ProductId" = $1;
              `;
            }

            db.query(updateImagesQuery, [productId], (deleteImagesError) => {
              if (deleteImagesError) {
                return reject(deleteImagesError);
              }

              const insertImagesQuery = `
                INSERT INTO public."Productimage"("ProductId", "ProductImageUrl")
                VALUES ($1, $2);
              `;

              const imageInsertPromises = files.map((file) => {
                return new Promise((imageResolve, imageReject) => {
                  db.query(
                    insertImagesQuery,
                    [productId, file.filename],
                    (imageError) => {
                      if (imageError) {
                        imageReject(imageError);
                      } else {
                        imageResolve();
                      }
                    }
                  );
                });
              });

              Promise.all(imageInsertPromises)
                .then(() => {
                  resolve({ productId });
                })
                .catch((imageError) => {
                  cleanUpFiles(files);
                  reject(imageError);
                });
            });
          });
        }
      );
    });
  }
}

// Funzione di utilità per eliminare i file
function cleanUpFiles(files) {
  files.forEach((file) => {
    const filePath = path.resolve(
      __dirname,
      "..",
      "public/uploads/ProductImages",
      file.ProductImageUrl
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(
          `Errore durante l'eliminazione del file: ${filePath}`,
          err
        );
      }
    });
  });
}

module.exports = ProductsModel;
