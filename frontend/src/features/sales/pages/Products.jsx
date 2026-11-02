
import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Search,
  Package,
  Laptop,
  Headphones,
  Smartphone,
  Monitor,
  SlidersHorizontal,
} from "lucide-react";

function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/products")
      .then((response) => {
        const items = response.products || [];

        setProducts(
          items.map((item) => {
            const stock = Number(item.stockQuantity ?? 0);
            const status =
              stock === 0
                ? "Out of Stock"
                : stock <= 5
                  ? "Low Stock"
                  : "In Stock";

            return {
              id: item._id,
              name: item.productName || "Unnamed Product",
              category: item.categoryName || "Uncategorized",
              sku: item.sku || item._id,
              price: Number(item.price ?? 0),
              stock,
              icon: Laptop,
              status,
            };
          })
        );
      })
      .catch((err) => {
        console.error("Products API error:", err);
        setError("Unable to load products. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    "All",
    ...new Set(products.map((product) => product.category)),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      `${product.name} ${product.sku} ${product.category}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" ||
      product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= 5
  ).length;

  const outOfStock = products.filter(
    (product) => product.stock === 0
  ).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>View products, categories, pricing and stock availability.</p>
        </div>
      </div>

      <div className="product-summary">
        <div className="product-summary-card">
          <span>Total Products</span>
          <h2>{products.length}</h2>
          <Package size={22} />
        </div>

        <div className="product-summary-card">
          <span>Categories</span>
          <h2>{categories.length - 1}</h2>
          <SlidersHorizontal size={22} />
        </div>

        <div className="product-summary-card">
          <span>Low Stock</span>
          <h2>{lowStock}</h2>
          <span className="product-summary-note">Needs attention</span>
        </div>

        <div className="product-summary-card">
          <span>Out of Stock</span>
          <h2>{outOfStock}</h2>
          <span className="product-summary-note">Unavailable items</span>
        </div>
      </div>

      <div className="leads-card products-card">
        <div className="products-toolbar">
          <div>
            <h2>Product Inventory</h2>
            <p className="section-description">
              Browse the available product catalogue.
            </p>
          </div>

          <div className="products-filters">
            <div className="products-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="leads-table-wrapper">
          {loading ? (
            <p>Loading products...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <table className="leads-table products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU / ID</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="products-empty">
                      No products match your search.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const Icon = product.icon;

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="product-name-cell">
                            <div className="product-icon">
                              <Icon size={20} />
                            </div>
                            <strong>{product.name}</strong>
                          </div>
                        </td>
                        <td>{product.sku}</td>
                        <td>{product.category}</td>
                        <td>{formatPrice(product.price)}</td>
                        <td>{product.stock}</td>
                        <td>
                          <span
                            className={`product-status ${
                              product.status === "In Stock"
                                ? "in-stock"
                                : product.status === "Low Stock"
                                  ? "low-stock"
                                  : "out-of-stock"
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="products-footer">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>
    </div>
  );
}

export default Products;