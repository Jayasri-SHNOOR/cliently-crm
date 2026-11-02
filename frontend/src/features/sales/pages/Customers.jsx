
import { useEffect, useState } from "react";
import api from "../services/api";

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/customers")
      .then((response) => {
        setCustomers(response.customers || []);
      })
      .catch((err) => {
        console.error("Customers API error:", err);
        setError("Unable to load customers. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredCustomers = customers.filter((customer) =>
    [
      customer.name,
      customer.company,
      customer.email,
      customer.phone,
      customer.city,
      customer.address,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>View and manage your assigned customers.</p>
        </div>
      </div>

      <div className="leads-card">
        <div className="leads-card-header">
          <div>
            <h2>Your Customers</h2>
            <p className="section-description">
              Customers assigned to you
            </p>
          </div>

          <div className="lead-count">
            {filteredCustomers.length} Customers
          </div>
        </div>

        <div className="lead-toolbar">
          <div className="lead-search">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <p>Loading customers...</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : (
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total Sales</th>
                  <th>No. of Sales</th>
                  <th>Latest Sale</th>
                  <th>Payment Status</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="9">No customers found.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const name =
                      customer.name ||
                      customer.customerName ||
                      `Customer ${customer.userId || ""}`.trim();

                    const status = customer.status || "Active";
                    const paymentStatus =
                      customer.latestPaymentStatus || "";

                    return (
                      <tr
                        key={
                          customer._id ||
                          customer.email ||
                          customer.userId
                        }
                      >
                        <td>
                          <div className="lead-name">
                            <div className="lead-avatar">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <strong>{name}</strong>
                          </div>
                        </td>

                        <td>{customer.company || "—"}</td>
                        <td>{customer.email || "—"}</td>
                        <td>{customer.phone || "—"}</td>

                        <td>
                          <strong>
                            {formatCurrency(customer.totalSales)}
                          </strong>
                        </td>

                        <td>{customer.salesCount ?? 0}</td>

                        <td>{formatDate(customer.latestSaleDate)}</td>

                        <td>
                          {paymentStatus ? (
                            <span
                              className={
                                paymentStatus.toLowerCase() === "paid"
                                  ? "lead-status status-qualified"
                                  : "lead-status status-contacted"
                              }
                            >
                              {paymentStatus}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              status === "Active"
                                ? "lead-status status-qualified"
                                : "lead-status status-contacted"
                            }
                          >
                            {status}
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
      </div>
    </div>
  );
}

export default Customers;