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
      const ProductId = req.params.id;
      const product = await Products.getProductById(ProductId, db);
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
      const CategoryId = req.query.CategoryId;
      const category = await Products.getCategoryById(CategoryId, db);
      if (category) {
        res.status(200).json(category);
      } else {
        res.status(500).send("Recupero della categoria fallito");
      }
    } catch (error) {
      if (error.status == 404) {
        console.error("Errore nel recupero della categoria:", error);
        res.status(404).send("Non esiste nessuna categoria con questo Id!");
      } else {
        console.error("Errore nel recupero della categoria:", error);
        res.status(500).send("Recupero della categoria fallito");
      }
    }
  }
  static async getImagesByProductId(req, res, db) {
    try {
      const ProductId = req.query.ProductId;

      const images = await Products.getImagesByProductId(ProductId, db);
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

  static async addProduct(req, res, db) {
    try {
      const product = req.body;
      const images = req.files;

      console.log("Prodotto: ", req.params);
      console.log("Immagini: ", req.files);

      /* await Products.addProduct(product, images, db); */
    } catch (error) {
      console.error("Errore nell'aggiunta del prodotto:", error);
      res.status(500).send("Aggiunta del prodotto fallita");
    }
  }

  static async addCategory(req, res, db) {
    try {
      const CategoryName = req.body.CategoryName;
      await Products.addCategory(CategoryName, db);

      res.status(200).send("Categoria creata ");
    } catch (error) {
      console.error("Errore nell'aggiunta della categoria:", error);

      // Se l'errore è relativo al nome duplicato, risponde con 409 Conflict
      if (error.message === "Una categoria con questo nome esiste già.") {
        res.status(409).send("Esiste già una categoria con questo nome.");
      } else {
        // Altrimenti, restituisce un errore generico
        res.status(500).send("Aggiunta della categoria fallita");
      }
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
      const CategoryData = req.query.CategoryData;
      await Products.deleteCategory(CategoryData, db);
      res.status(200).send("Categoria eliminata con successo!");
    } catch (error) {
      console.error("Errore nell'eliminazione della categoria:", error);
      res.status(500).send("Eliminazione della categoria fallita");
    }
  }

  static async updateCategory(req, res, db) {
    try {
      const CategoryId = req.body.CategoryId;
      const CategoryName = req.body.CategoryName;
      await Products.updateCategory(CategoryId, CategoryName, db);

      res.status(200).send("Categoria aggiornata con successo.");
    } catch (error) {
      if (error.status == 409) {
        console.error("Errore nella modifica della categoria:", error);
        res.status(409).send("Esiste un altra categoria con questo nome.");
      } else {
        console.error("Errore nella modifica della categoria:", error);
        res.status(500).send("Modifica della categoria fallito");
      }
    }
  }
}

module.exports = ProductsController;
