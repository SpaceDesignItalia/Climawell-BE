const Products = require("../Models/ProductsModel");
const path = require("path");
const fs = require("fs");
const { query } = require("express");

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
  static async searchCategoryByName(req, res, db) {
    try {
      const categories = await Products.searchCategoryByName(
        req.query.searchQuery,
        db
      );
      if (categories) {
        res.status(200).json(categories);
      } else {
        res.status(500).send("Ricerca della categoria fallita");
      }
    } catch (error) {
      console.error("Errore nella ricerca della categoria:", error);
      res.status(500).send("Ricerca della categoria fallita");
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
  static async addCategory(req, res, db) {
    try {
      const category = req.body;
      const newCategory = await Products.addCategory(category, db);
      if (newCategory) {
        res.status(200).json(newCategory);
      } else {
        res.status(500).send("Aggiunta della categoria fallita");
      }
    } catch (error) {
      console.error("Errore nell'aggiunta della categoria:", error);
      res.status(500).send("Aggiunta della categoria fallita");
    }
  }
  static async uploadImage(req, res, db) {
    try {
      const productId = req.body.ProductId;
      const files = req.files;

      console.log("files", files);

      const uploadedImages = await Products.uploadImage(productId, files, db);
      if (uploadedImages) {
        res.status(200).json(uploadedImages);
      } else {
        res.status(500).send("Caricamento delle immagini fallito");
      }
    } catch (error) {
      console.error("Errore nel caricamento delle immagini:", error);
      res.status(500).send("Caricamento delle immagini fallito");
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

  static async updateCategory(req, res, db) {
    try {
      const categoryId = req.body.CategoryId.categoryId;
      const categoryName = req.body.CategoryName;
      const updatedCategory = await Products.updateCategory(
        categoryId,
        categoryName,
        db
      );
      if (updatedCategory) {
        res.status(200).json(updatedCategory);
      } else {
        res.status(500).send("Aggiornamento della categoria fallito");
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento della categoria:", error);
      res.status(500).send("Aggiornamento della categoria fallito");
    }
  }
}

module.exports = ProductsController;
