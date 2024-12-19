const Products = require("../Models/ProductsModel");
const path = require("path");
const fs = require("fs");

class ProductsController {
  static async getAllProducts(req, res, db) {
    try {
      const products = await Products.getAllProducts(db);
      if (products) {
        res.status(200).json(products);
      } else {
        res.status(500).send("Recupero dei prodotti fallito");
      }
    } catch (error) {
      console.error("Errore nel recupero dei prodotti:", error);
      res.status(500).send("Recupero dei prodotti fallito");
    }
  }
  static async isFeatured(req, res, db) {
    try {
      const isFeatured = await Products.isFeatured(req.params.id, db);
      if (isFeatured) {
        res.status(200).json(isFeatured);
      } else {
        res.status(500).send("Recupero del prodotto in evidenza fallito");
      }
    } catch (error) {
      console.error("Errore nel recupero del prodotto in evidenza:", error);
      res.status(500).send("Recupero del prodotto in evidenza fallito");
    }
  }
  static async getFeaturedProducts(req, res, db) {
    try {
      const products = await Products.getFeaturedProducts(db);
      if (products) {
        res.status(200).json(products);
      } else {
        res.status(500).send("Recupero dei prodotti in evidenza fallito");
      }
    } catch (error) {
      console.error("Errore nel recupero dei prodotti in evidenza:", error);
      res.status(500).send("Recupero dei prodotti in evidenza fallito");
    }
  }
  static async getProductById(req, res, db) {
    try {
      const product = await Products.getProductById(req.params.id, db);
      if (product) {
        res.status(200).json(product);
      } else {
        res.status(500).send("Recupero del prodotto fallito");
      }
    } catch (error) {
      console.error("Errore nel recupero del prodotto:", error);
      res.status(500).send("Recupero del prodotto fallito");
    }
  }
  static async getCategoryById(req, res, db) {
    try {
      const category = await Products.getCategoryById(req.params.id, db);
      if (category) {
        res.status(200).json(category);
      } else {
        res.status(500).send("Recupero della categoria fallito");
      }
    } catch (error) {
      console.error("Errore nel recupero della categoria:", error);
      res.status(500).send("Recupero della categoria fallito");
    }
  }
  static async getImagesByProductId(req, res, db) {
    try {
      const images = await Products.getImagesByProductId(req.params.id, db);
      if (images) {
        res.status(200).json(images);
      } else {
        res.status(500).send("Recupero delle immagini fallito");
      }
    } catch (error) {
      console.error("Errore nel recupero delle immagini:", error);
      res.status(500).send("Recupero delle immagini fallito");
    }
  }
  static async getAllCategories(req, res, db) {
    try {
      const categories = await Products.getAllCategories(db);
      if (categories) {
        res.status(200).json(categories);
      } else {
        res.status(500).send("Recupero delle categorie fallito");
      }
    } catch (error) {
      console.error("Errore nel recupero delle categorie:", error);
      res.status(500).send("Recupero delle categorie fallito");
    }
  }
  static async getProductModelGroupById(req, res, db) {
    try {
      const productModelGroup = await Products.getProductModelGroupById(
        req.params.id,
        db
      );
      if (productModelGroup) {
        res.status(200).json(productModelGroup);
      } else {
        res.status(500).send("Recupero del gruppo di modelli fallito");
      }
    } catch (error) {
      console.error("Errore nel recupero del gruppo di modelli:", error);
      res.status(500).send("Recupero del gruppo di modelli fallito");
    }
  }
  static async searchProductByName(req, res, db) {
    try {
      const products = await Products.searchProductByName(
        req.query.searchQuery,
        db
      );
      if (products) {
        res.status(200).json(products);
      } else {
        res.status(500).send("Ricerca del prodotto fallita");
      }
    } catch (error) {
      console.error("Errore nella ricerca del prodotto:", error);
      res.status(500).send("Ricerca del prodotto fallita");
    }
  }
  static async getImageByPath(req, res, db) {
    try {
      const imagePath = req.params.path;
      const publicDirectory = path.join(__dirname, "../public/uploads/");

      const filePath = path.join(publicDirectory, imagePath);

      if (fs.existsSync(filePath)) {
        const imageBuffer = fs.readFileSync(filePath);

        const extname = path.extname(filePath).toLowerCase();
        let contentType = "application/octet-stream";

        if (extname === ".jpg" || extname === ".jpeg") {
          contentType = "image/jpeg";
        } else if (extname === ".png") {
          contentType = "image/png";
        } else if (extname === ".gif") {
          contentType = "image/gif";
        } else if (extname === ".webp") {
          contentType = "image/webp";
        }

        res.setHeader("Content-Type", contentType);
        res.status(200).send(imageBuffer);
      } else {
        console.error("Immagine non trovata:", imagePath);
        res.status(404).send("Immagine non trovata");
      }
    } catch (error) {
      console.error("Errore nel recupero dell'immagine:", error);
      res.status(500).send("Errore nel recupero dell'immagine");
    }
  }
  static async addProduct(req, res, db) {
    try {
      const product = req.body;
      const newProduct = await Products.addProduct(product, db);
      if (newProduct) {
        res.status(200).json(newProduct);
      } else {
        res.status(500).send("Aggiunta del prodotto fallita");
      }
    } catch (error) {
      console.error("Errore nell'aggiunta del prodotto:", error);
      res.status(500).send("Aggiunta del prodotto fallita");
    }
  }
  static async deleteProduct(req, res, db) {
    try {
      const productId = req.params.id;
      const deletedProduct = await Products.deleteProduct(productId, db);
      if (deletedProduct) {
        res.status(200).json(deletedProduct);
      } else {
        res.status(500).send("Eliminazione del prodotto fallita");
      }
    } catch (error) {
      console.error("Errore nell'eliminazione del prodotto:", error);
      res.status(500).send("Eliminazione del prodotto fallita");
    }
  }
  static async deleteCategory(req, res, db) {
    try {
      const categoryId = req.params.id;
      const deletedCategory = await Products.deleteCategory(categoryId, db);
      if (deletedCategory) {
        res.status(200).json(deletedCategory);
      } else {
        res.status(500).send("Eliminazione della categoria fallita");
      }
    } catch (error) {
      console.error("Errore nell'eliminazione della categoria:", error);
      res.status(500).send("Eliminazione della categoria fallita");
    }
  }
}

module.exports = ProductsController;
