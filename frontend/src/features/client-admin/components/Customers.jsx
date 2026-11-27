
import { useEffect, useState } from "react";
import {
  Search, Plus, Users, UserCheck, UserX, X,
  Pencil, Trash2, Eye, Mail, Phone, Building2
} from "lucide-react";
import api from "../services/api";
import "./Customers.css";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(false);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "Active",
    address: ""
  };

  const [form, setForm] = useState(emptyForm);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/customers");
      const data = res.data;
      setCustomers(
        Array.isArray(data) ? data : data.customers || []
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const query = search.toLowerCase();

    const matchesSearch = [
      customer.name,
      customer.email,
      customer.phone,
      customer.company
    ].some((value) => String(value || "").toLowerCase().includes(query));

    const matchesFilter =
      filter === "All" || customer.status === filter;

    return matchesSearch && matchesFilter;
  });

  const activeCount = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  const inactiveCount = customers.filter(
    (customer) => customer.status === "Inactive"
  ).length;

  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModal(true);
  };

  const openEditModal = (customer) => {
    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      status: customer.status || "Active",
      address: customer.address || ""
    });
    setEditingId(customer._id || customer.id);
    setModal(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      if (editingId) {
        await api.patch(`/customers/${editingId}`, form);
      } else {
        await api.post("/customers", form);
      }

      setModal(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadCustomers();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save customer."
      );
    }
  };

  const handleDelete = async (customer) => {
    const id = customer._id || customer.id;

    if (!window.confirm(`Delete ${customer.name}?`)) return;

    try {
      setError("");
      await api.delete(`/customers/${id}`);
      setCustomers((prev) =>
        prev.filter((item) => (item._id || item.id) !== id)
      );
      if (viewCustomer && (viewCustomer._id || viewCustomer.id) === id) {
        setViewCustomer(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete customer."
      );
    }
  };

  const initials = (name = "") =>
    name.split(" ").filter(Boolean).slice(0, 2)
      .map((part) => part[0].toUpperCase()).join("") || "?";

  return (
    <div className="customers-page">
      <div className="customers-heading">
        <div>
          <h1>Customers</h1>
          <p>Manage your customer relationships and contact details.</p>
        </div>

        <button className="customer-primary-btn" onClick={openAddModal}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="customer-stats">
        <div className="customer-stat-card">
          <div className="customer-stat-icon total-icon"><Users /></div>
          <div>
            <p>Total Customers</p>
            <h2>{customers.length}</h2>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-icon active-icon"><UserCheck /></div>
          <div>
            <p>Active Customers</p>
            <h2>{activeCount}</h2>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-icon inactive-icon"><UserX /></div>
          <div>
            <p>Inactive Customers</p>
            <h2>{inactiveCount}</h2>
          </div>
        </div>
      </div>

      {error && (
        <div className="customer-error">
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}

      <div className="customers-table-card">
        <div className="customers-toolbar">
          <div className="customer-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search name, email, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="customers-table-wrap">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Company</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="customer-empty">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="customer-empty">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer._id || customer.id}>
                    <td>
                      <div className="customer-identity">
                        <div className="customer-avatar">
                          {initials(customer.name)}
                        </div>
                        <div>
                          <strong>{customer.name}</strong>
                          <span>{customer.email || "No email"}</span>
                        </div>
                      </div>
                    </td>

                    <td>{customer.company || "—"}</td>
                    <td>{customer.phone || "—"}</td>

                    <td>
                      <span className={`customer-status ${
                        customer.status === "Active" ? "status-active" : "status-inactive"
                      }`}>
                        {customer.status || "Unknown"}
                      </span>
                    </td>

                    <td>
                      <div className="customer-actions">
                        <button title="View" onClick={() => setViewCustomer(customer)}>
                          <Eye size={17} />
                        </button>
                        <button title="Edit" onClick={() => openEditModal(customer)}>
                          <Pencil size={17} />
                        </button>
                        <button
                          className="customer-delete-btn"
                          title="Delete"
                          onClick={() => handleDelete(customer)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="customers-table-footer">
          Showing {loading ? 0 : filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {modal && (
        <div className="customer-modal-overlay" onClick={() => setModal(false)}>
          <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="customer-modal-heading">
              <div>
                <h2>{editingId ? "Edit Customer" : "Add Customer"}</h2>
                <p>Enter the customer information below.</p>
              </div>
              <button type="button" onClick={() => setModal(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="customer-form-grid">
                <label>
                  Full Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </label>

                <label>
                  Email *
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                  />
                </label>

                <label>
                  Phone
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </label>

                <label>
                  Company
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Company name"
                  />
                </label>

                <label>
                  Status
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>

                <label className="customer-full-width">
                  Address
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Customer address"
                    rows="3"
                  />
                </label>
              </div>

              <div className="customer-modal-actions">
                <button type="button" className="customer-cancel-btn" onClick={() => setModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="customer-primary-btn">
                  {editingId ? "Save Changes" : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewCustomer && (
        <div className="customer-modal-overlay" onClick={() => setViewCustomer(null)}>
          <div className="customer-modal customer-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="customer-modal-heading">
              <div>
                <h2>Customer Details</h2>
                <p>Contact information and account status.</p>
              </div>
              <button onClick={() => setViewCustomer(null)}><X /></button>
            </div>

            <div className="customer-detail-profile">
              <div className="customer-avatar customer-avatar-large">
                {initials(viewCustomer.name)}
              </div>
              <h3>{viewCustomer.name}</h3>
              <span className={`customer-status ${
                viewCustomer.status === "Active" ? "status-active" : "status-inactive"
              }`}>
                {viewCustomer.status || "Unknown"}
              </span>
            </div>

            <div className="customer-detail-list">
              <div><Mail size={18} /><span><small>Email</small>{viewCustomer.email || "—"}</span></div>
              <div><Phone size={18} /><span><small>Phone</small>{viewCustomer.phone || "—"}</span></div>
              <div><Building2 size={18} /><span><small>Company</small>{viewCustomer.company || "—"}</span></div>
              <div><Building2 size={18} /><span><small>Address</small>{viewCustomer.address || "—"}</span></div>
            </div>

            <div className="customer-modal-actions">
              <button className="customer-cancel-btn" onClick={() => setViewCustomer(null)}>
                Close
              </button>
              <button className="customer-primary-btn" onClick={() => {
                setViewCustomer(null);
                openEditModal(viewCustomer);
              }}>
                <Pencil size={16} /> Edit Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
