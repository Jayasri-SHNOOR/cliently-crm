
import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Search,
  Package,
  SlidersHorizontal,
  Laptop,
} from "lucide-react";

function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/sales/products")
      .then((response) => {
        const items = response.products || [];

        setProducts(
          items.map((item) => ({
            id: item._id,
            name: item.name || "Unnamed Product",
            code: item.code || item._id,
            category: item.category || "Uncategorized",
            type: item.type || "Product",
            price: Number(item.price ?? 0),
            status: item.status || "Inactive",
          }))
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
      `${product.name} ${product.code} ${product.category}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" ||
      product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const activeProducts = products.filter(
    (product) => product.status === "Active"
  ).length;

  const inactiveProducts = products.filter(
    (product) => product.status === "Inactive"
  ).length;

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>View products, categories, pricing and availability.</p>
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
          <span>Active Products</span>
          <h2>{activeProducts}</h2>
          <span className="product-summary-note">Available products</span>
        </div>

        <div className="product-summary-card">
          <span>Inactive Products</span>
          <h2>{inactiveProducts}</h2>
          <span className="product-summary-note">Currently unavailable</span>
        </div>
      </div>

      <div className="leads-card products-card">
        <div className="products-toolbar">
          <div>
            <h2>Product Catalogue</h2>
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
                  <th>Product Code</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Price</th>
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
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-name-cell">
                          <div className="product-icon">
                            <Laptop size={20} />
                          </div>
                          <strong>{product.name}</strong>
                        </div>
                      </td>

                      <td>{product.code}</td>
                      <td>{product.category}</td>
                      <td>{product.type}</td>
                      <td>{formatPrice(product.price)}</td>

                      <td>
                        <span
                          className={`product-status ${
                            product.status === "Active"
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))
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
