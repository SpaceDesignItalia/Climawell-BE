class ProductsModel {
  static async getAllProducts(db) {
    try {
      const products = await db.query(
        `SELECT * FROM "Product"
         LEFT JOIN "Category" ON "Product"."CategoryId" = "Category"."CategoryId"
         JOIN "Productimage" ON "Product"."ProductId" = "Productimage"."ProductId"`
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
        `SELECT * FROM "Product" 

          JOIN "Category" ON "Product"."CategoryId" = "Category"."CategoryId"
          JOIN "Productimage" ON "Product"."ProductId" = "Productimage"."ProductId"
          JOIN "FeaturedProduct" ON "Product"."ProductId" = "FeaturedProduct"."idproduct"`
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
         JOIN "Category" ON "Product"."CategoryId" = "Category"."CategoryId"
         JOIN "Productimage" ON "Product"."ProductId" = "Productimage"."ProductId"
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
         JOIN "Category" ON "Product"."CategoryId" = "Category"."CategoryId"
         JOIN "Productimage" ON "Product"."ProductId" = "Productimage"."ProductId"
         WHERE "Product"."ProductName" ILIKE $1`,
        [`%${searchQuery}%`]
      );

      return products.rows;
    } catch (error) {
      console.error("Errore nella ricerca del prodotto:", error);
      return null;
    }
  }

  static async addProduct(productData, db) {
    const {
      ProductName,
      ProductDescription,
      ProductPrice,
      ProductStock,
      CategoryId,
    } = productData;

    try {
      const newProduct = await db.query(
        `INSERT INTO "Product" ("ProductName", "ProductDescription", "ProductPrice", "ProductStock", "CategoryId")
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          ProductName,
          ProductDescription,
          ProductPrice,
          ProductStock,
          CategoryId,
        ]
      );

      return newProduct.rows[0];
    } catch (error) {
      console.error("Errore nell'aggiunta del prodotto:", error);
      return null;
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
}

module.exports = ProductsModel;
