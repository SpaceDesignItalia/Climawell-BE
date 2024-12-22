class ProductsModel {
  static async getAllProducts(db) {
    try {
      const products = await db.query(
        `SELECT * FROM "Product"
         LEFT JOIN "Category" ON "Product"."CategoryId" = "Category"."CategoryId"
         JOIN "Productimage" ON "Product"."ProductId" = "Productimage"."ProductId"
         LEFT JOIN "ModelGroup" ON "Product"."ProductModelGroupId" = "ModelGroup"."ProductModelId"`
      );

      const groupedProducts = products.rows.reduce((acc, row) => {
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

      return Object.values(groupedProducts);
    } catch (error) {
      console.error("Errore nel recupero dei prodotti:", error);
      return null;
    }
  }

  static async isFeatured(id, db) {
    try {
      const product = await db.query(
        `SELECT * FROM "FeaturedProduct" WHERE "idproduct" = $1`,
        [id]
      );

      return product.rows.length > 0;
    } catch (error) {
      console.error("Errore nel recupero del prodotto in evidenza:", error);
      return null;
    }
  }

  static async getFeaturedProducts(db) {
    try {
      const products = await db.query(
        `SELECT * 
          FROM "Product"
            LEFT JOIN "Category" ON "Product"."CategoryId" = "Category"."CategoryId"
            JOIN "Productimage" ON "Product"."ProductId" = "Productimage"."ProductId"
            JOIN "FeaturedProduct" ON "Product"."ProductId" = "FeaturedProduct"."idproduct"
            LEFT JOIN "ModelGroup" ON "Product"."ProductModelGroupId" = "ModelGroup"."ProductModelId";
`
      );

      const groupedProducts = products.rows.reduce((acc, row) => {
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

      return Object.values(groupedProducts);
    } catch (error) {
      console.error("Errore nel recupero dei prodotti in evidenza:", error);
      return null;
    }
  }

  static async getProductById(id, db) {
    try {
      const product = await db.query(
        `SELECT * FROM "Product"
         LEFT JOIN "Category" ON "Product"."CategoryId" = "Category"."CategoryId"
         JOIN "Productimage" ON "Product"."ProductId" = "Productimage"."ProductId"
         JOIN "FeaturedProduct" ON "Product"."ProductId" = "FeaturedProduct"."idproduct"
         LEFT JOIN "ModelGroup" ON "Product"."ProductModelGroupId" = "ModelGroup"."ProductModelId"
         WHERE "Product"."ProductId" = $1`,
        [id]
      );

      if (product.rows.length === 0) return null;

      const productData = product.rows[0];
      const images = product.rows.map((row) => ({
        ProductImageId: row.ProductImageId,
        ProductImageUrl: row.ProductImageUrl,
      }));

      return {
        ...productData,
        images,
      };
    } catch (error) {
      console.error("Errore nel recupero del prodotto:", error);
      return null;
    }
  }

  static async getCategoryById(id, db) {
    try {
      const category = await db.query(
        `SELECT "CategoryName" FROM "Category" WHERE "CategoryId" = $1`,
        [id]
      );

      return category.rows;
    } catch (error) {
      console.error("Errore nel recupero della categoria:", error);
      return null;
    }
  }

  static async getImagesByProductId(id, db) {
    try {
      const images = await db.query(
        `SELECT * FROM "Productimage" WHERE "ProductId" = $1`,
        [id]
      );

      return images.rows;
    } catch (error) {
      console.error("Errore nel recupero delle immagini:", error);
      return null;
    }
  }

  static async getAllCategories(db) {
    try {
      const categories = await db.query(`SELECT * FROM "Category"`);

      return categories.rows;
    } catch (error) {
      console.error("Errore nel recupero delle categorie:", error);
      return null;
    }
  }

  static async getProductModelGroupById(id, db) {
    try {
      const productModelGroup = await db.query(
        `SELECT * FROM "ProductModelGroup" WHERE "ProductModelGroupId" = $1`,
        [id]
      );

      return productModelGroup.rows;
    } catch (error) {
      console.error(
        "Errore nel recupero del gruppo di modelli del prodotto:",
        error
      );
      return null;
    }
  }

  static async searchProductByName(searchQuery, db) {
    try {
      const products = await db.query(
        `SELECT * FROM "Product"
         LEFT JOIN "Category" ON "Product"."CategoryId" = "Category"."CategoryId"
         JOIN "FeaturedProduct" ON "Product"."ProductId" = "FeaturedProduct"."idproduct"
         LEFT JOIN "ModelGroup" ON "Product"."ProductModelGroupId" = "ModelGroup"."ProductModelId"
         WHERE "Product"."ProductName" ILIKE $1`,
        [`%${searchQuery}%`]
      );

      for (let product of products.rows) {
        const isFeatured = await ProductsModel.isFeatured(
          product.ProductId,
          db
        );
        product.IsFeatured = isFeatured;
      }

      return products.rows;
    } catch (error) {
      console.error("Errore nella ricerca del prodotto:", error);
      return null;
    }
  }

  static async searchCategoryByName(searchQuery, db) {
    try {
      const categories = await db.query(
        `SELECT * FROM "Category" WHERE "CategoryName" ILIKE $1`,
        [`%${searchQuery}%`]
      );

      return categories.rows;
    } catch (error) {
      console.error("Errore nella ricerca della categoria:", error);
      return null;
    }
  }

  static async addProduct(product, files, db) {
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

      // Inserimento del prodotto nel database
      const newProduct = await db.query(
        `INSERT INTO "Product" (
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
         RETURNING "ProductId"`,
        [
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
        ]
      );

      const productId = newProduct.rows[0].ProductId;

      // Percorso base per salvare le immagini
      const uploadDir = path.join(__dirname, "../public/uploads");

      // Creazione della directory se non esiste
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Salvataggio delle immagini e inserimento nel database
      const imagePromises = files.map(async (file) => {
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(uploadDir, fileName);

        // Sposta il file nella directory di upload
        fs.writeFileSync(filePath, file.buffer);

        // Salva il percorso nel database
        await db.query(
          `INSERT INTO "Productimage" ("ProductId", "ProductImageUrl")
           VALUES ($1, $2)`,
          [productId, `/uploads/${fileName}`]
        );
      });

      // Attendi il completamento di tutte le promesse
      await Promise.all(imagePromises);

      return productId;
    } catch (error) {
      console.error("Errore nell'aggiunta del prodotto:", error);
      return null;
    }
  }
  static async addCategory(category, db) {
    try {
      const { CategoryName } = category;

      const newCategory = await db.query(
        `INSERT INTO "Category" ("CategoryName") VALUES ($1) RETURNING "CategoryId"`,
        [CategoryName]
      );

      return newCategory.rows[0].CategoryId;
    } catch (error) {
      console.error("Errore nell'aggiunta della categoria:", error);
      return null;
    }
  }

  static async uploadImage(productId, file, db) {
    try {
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(__dirname, "../public/uploads", fileName);

      // Sposta il file nella directory di upload
      fs.writeFileSync(filePath, file.buffer);

      // Salva il percorso nel database
      await db.query(
        `INSERT INTO "Productimage" ("ProductId", "ProductImageUrl")
         VALUES ($1, $2)`,
        [productId, `/uploads/${fileName}`]
      );

      return true;
    } catch (error) {
      console.error("Errore nel caricamento dell'immagine:", error);
      return false;
    }
  }

  static async deleteProduct(id, db) {
    try {
      await db.query(`DELETE FROM "Product" WHERE "ProductId" = $1`, [id]);

      return true;
    } catch (error) {
      console.error("Errore nell'eliminazione del prodotto:", error);
      return false;
    }
  }

  static async deleteCategory(id, db) {
    try {
      await db.query(`DELETE FROM "Category" WHERE "CategoryId" = $1`, [id]);

      return true;
    } catch (error) {
      console.error("Errore nell'eliminazione della categoria:", error);
      return false;
    }
  }

  static async updateCategory(categoryId, categoryName, db) {
    try {
      await db.query(
        `UPDATE "Category" SET "CategoryName" = $1 WHERE "CategoryId" = $2`,
        [categoryName, categoryId]
      );

      return true;
    } catch (error) {
      console.error("Errore nell'aggiornamento della categoria:", error);
      return false;
    }
  }
}

module.exports = ProductsModel;
