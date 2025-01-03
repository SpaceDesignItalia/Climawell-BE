class ProductsModel {
  static getAllProducts(db) {
    return new Promise((resolve, reject) => {
      const query = `
            SELECT 
                p.*,
                c.*,
                CASE 
                    WHEN fp."ProductId" IS NOT NULL THEN true 
                    ELSE false 
                END AS "isFeatured"
            FROM "Product" p
            LEFT JOIN "Category" c ON p."CategoryId" = c."CategoryId"
            LEFT JOIN "FeaturedProduct" fp ON p."ProductId" = fp."ProductId"`;

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
        SELECT * 
        FROM "Product"
        LEFT JOIN "Category" ON "Product"."CategoryId" = "Category"."CategoryId"
        JOIN "Productimage" ON "Product"."ProductId" = "Productimage"."ProductId"
        JOIN "FeaturedProduct" ON "Product"."ProductId" = "FeaturedProduct"."idproduct"
        LEFT JOIN "ModelGroup" ON "Product"."ProductModelGroupId" = "ModelGroup"."ProductModelId"`;

      db.query(query, (error, result) => {
        if (error) {
          reject(error);
        } else {
          const groupedProducts = result.rows.reduce((acc, row) => {
            const productId = row.ProductId;

            if (!acc[productId]) {
              acc[productId] = {
                ...row,
                images: [],
              };
            }

            acc[productId].images.push({
              ProductImageId: row.ProductImageId,
              ProductImageUrl: row.ProductImageUrl,
            });

            return acc;
          }, {});

          Object.values(groupedProducts).forEach((product) => {
            product.images.sort((a, b) => a.ProductImageId - b.ProductImageId);
          });

          resolve(Object.values(groupedProducts));
        }
      });
    });
  }

  static getProductById(ProductId, db) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM "Product"
        LEFT JOIN "Category" ON "Product"."CategoryId" = "Category"."CategoryId"
        JOIN "Productimage" ON "Product"."ProductId" = "Productimage"."ProductId"
        LEFT JOIN "ModelGroup" ON "Product"."ProductModelGroupId" = "ModelGroup"."ProductModelId"
        WHERE "Product"."ProductId" = $1`;

      db.query(query, [ProductId], (error, result) => {
        if (error) {
          reject(error);
        } else {
          if (result.rows.length === 0) {
            resolve(null);
          } else {
            const productData = result.rows[0];
            const images = result.rows.map((row) => ({
              ProductImageId: row.ProductImageId,
              ProductImageUrl: row.ProductImageUrl,
            }));

            resolve({
              ...productData,
              images,
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

  static async getProductModelGroupById(id, db) {
    try {
      const query = `SELECT * FROM "ProductModelGroup" WHERE "ProductModelGroupId" = $1`;
      const { rows } = await db.query(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(
        "Errore nel recupero del gruppo di modelli del prodotto:",
        error
      );
      throw new Error(
        "Impossibile recuperare il gruppo di modelli del prodotto"
      );
    }
  }

  static async searchProductByName(searchQuery, db) {
    try {
      const query = `
        SELECT * FROM "Product"
        LEFT JOIN "Category" ON "Product"."CategoryId" = "Category"."CategoryId"
        LEFT JOIN "ModelGroup" ON "Product"."ProductModelGroupId" = "ModelGroup"."ProductModelId"
        WHERE "Product"."ProductName" ILIKE $1`;
      const { rows: products } = await db.query(query, [`%${searchQuery}%`]);

      // Aggiungere il flag IsFeatured a ogni prodotto
      for (let product of products) {
        const isFeatured = await ProductsModel.isFeatured(
          product.ProductId,
          db
        );
        product.IsFeatured = isFeatured;
      }

      return products;
    } catch (error) {
      console.error("Errore nella ricerca del prodotto:", error);
      throw new Error("Impossibile completare la ricerca del prodotto");
    }
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

  static addProduct(product, files, db) {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          ProductName,
          ProductDescription,
          ProductAmount,
          UnitPrice,
          Height,
          Width,
          Depth,
          Weight,
          CategoryId,
          ProductModelGroupId,
        } = product;

        const query = `
          INSERT INTO "Product" (
            "ProductName",
            "ProductDescription",
            "ProductAmount",
            "UnitPrice",
            "Height",
            "Width",
            "Depth",
            "Weight",
            "CategoryId",
            "ProductModelGroupId"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING "ProductId"`;

        const newProduct = await db.query(query, [
          ProductName,
          ProductDescription,
          ProductAmount,
          UnitPrice,
          Height,
          Width,
          Depth,
          Weight,
          CategoryId,
          ProductModelGroupId,
        ]);

        const productId = newProduct.rows[0].ProductId;

        const uploadDir = path.join(__dirname, "../public/uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const imagePromises = files.map((file) => {
          const fileName = `${Date.now()}-${file.originalname}`;
          const filePath = path.join(uploadDir, fileName);

          fs.writeFileSync(filePath, file.buffer);

          return db.query(
            `INSERT INTO "Productimage" ("ProductId", "ProductImageUrl") VALUES ($1, $2)`,
            [productId, `/uploads/${fileName}`]
          );
        });

        await Promise.all(imagePromises);
        resolve(productId);
      } catch (error) {
        reject(error);
      }
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

  static async deleteProduct(id, db) {
    try {
      const query = `DELETE FROM "Product" WHERE "ProductId" = $1`;
      const result = await db.query(query, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error("Errore nell'eliminazione del prodotto:", error);
      throw new Error("Impossibile eliminare il prodotto");
    }
  }

  static async deleteCategory(Category, db) {
    return new Promise((resolve, reject) => {
      try {
        const query = `DELETE FROM "Category" WHERE "CategoryId" = $1`;
        db.query(query, [Category.CategoryId], (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      } catch (error) {
        console.error("Errore nell'eliminazione della categoria:", error);
        throw new Error("Impossibile eliminare la categoria");
      }
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
}

module.exports = ProductsModel;
