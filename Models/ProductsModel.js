class ProductsModel {
  static async getAllProducts(db) {
    try {
      const products = await db.query('SELECT * FROM "Product"');

      return products.rows;
    } catch (error) {
      console.error("Errore nel recupero dei prodotti:", error);
      return null;
    }
  }
  static async getCategoryById(id, db) {
    try {
      const category = await db.query(
        'SELECT "CategoryName" FROM "Category" WHERE "CategoryId" = $1',
        [id]
      );

      return category.rows;
    } catch (error) {
      console.error("Errore nel recupero della categoria:", error);
      return null;
    }
  }
  static async searchProductByName(searchQuery, db) {
    try {
      console.log(searchQuery);
      const products = await db.query(
        'SELECT * FROM "Product" WHERE "ProductName" ILIKE $1',
        [`%${searchQuery}%`]
      );

      return products.rows;
    } catch (error) {
      console.error("Errore nella ricerca del prodotto:", error);
      return null;
    }
  }
}
module.exports = ProductsModel;
