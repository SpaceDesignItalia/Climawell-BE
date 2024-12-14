const Products = require("../Models/ProductsModel");

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
}

module.exports = ProductsController;
