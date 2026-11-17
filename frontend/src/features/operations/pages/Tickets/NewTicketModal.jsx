
import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { opsApi } from "../../services/opsApi";
import "./NewTicketModal.css";

const initialForm = {
  subject: "",
  customerName: "",
  company: "",
  email: "",
  phone: "",
  category: "General",
  priority: "Medium",
  assignedTo: "",
  productId: "",
  description: "",
};

function NewTicketModal({
  onClose,
  onCreated,
  staff = [],
  products = [],
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    if (!form.subject.trim() || !form.customerName.trim()) {
      setError("Subject and Customer Name are required.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      subject: form.subject.trim(),
      customer: {
        name: form.customerName.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      },
      category: form.category,
      priority: form.priority,
      description: form.description.trim(),
    };

    if (form.assignedTo) {
      payload.assignedTo = form.assignedTo;
    }

    if (form.productId) {
      payload.productId = form.productId;
    }

    try {
      const response = await opsApi.createTicket(payload);
      onCreated?.(response.data);
    } catch (err) {
      setError(err.message || "Unable to create ticket.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="ops-new-ticket-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div
        className="ops-new-ticket-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ops-new-ticket-title"
      >
        <div className="ops-new-ticket-header">
          <div>
            <h2 id="ops-new-ticket-title">Create New Ticket</h2>
            <p>Record a new customer support request.</p>
          </div>

          <button
            type="button"
            className="ops-new-ticket-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ops-new-ticket-body">
            {error && (
              <div className="ops-new-ticket-error" role="alert">
                {error}
              </div>
            )}

            <div className="ops-new-ticket-field">
              <label htmlFor="ops-new-subject">
                Subject <span>*</span>
              </label>
              <input
                id="ops-new-subject"
                name="subject"
                value={form.subject}
                onChange={updateField}
                placeholder="Describe the customer issue"
                maxLength={200}
                required
              />
            </div>

            <h3 className="ops-new-ticket-section">
              Customer Information
            </h3>

            <div className="ops-new-ticket-grid">
              <div className="ops-new-ticket-field">
                <label htmlFor="ops-new-customer">
                  Customer Name <span>*</span>
                </label>
                <input
                  id="ops-new-customer"
                  name="customerName"
                  value={form.customerName}
                  onChange={updateField}
                  placeholder="Customer name"
                  required
                />
              </div>

              <div className="ops-new-ticket-field">
                <label htmlFor="ops-new-company">
                  Company
                </label>
                <input
                  id="ops-new-company"
                  name="company"
                  value={form.company}
                  onChange={updateField}
                  placeholder="Company name"
                />
              </div>

              <div className="ops-new-ticket-field">
                <label htmlFor="ops-new-email">
                  Email
                </label>
                <input
                  id="ops-new-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="customer@example.com"
                />
              </div>

              <div className="ops-new-ticket-field">
                <label htmlFor="ops-new-phone">
                  Phone
                </label>
                <input
                  id="ops-new-phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <h3 className="ops-new-ticket-section">
              Ticket Information
            </h3>

            <div className="ops-new-ticket-grid">
              <div className="ops-new-ticket-field">
                <label htmlFor="ops-new-category">
                  Category
                </label>
                <select
                  id="ops-new-category"
                  name="category"
                  value={form.category}
                  onChange={updateField}
                >
                  <option value="General">General</option>
                  <option value="Technical">Technical</option>
                  <option value="Billing">Billing</option>
                  <option value="Delivery">Delivery</option>
                </select>
              </div>

              <div className="ops-new-ticket-field">
                <label htmlFor="ops-new-priority">
                  Priority
                </label>
                <select
                  id="ops-new-priority"
                  name="priority"
                  value={form.priority}
                  onChange={updateField}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="ops-new-ticket-field">
                <label htmlFor="ops-new-assignee">
                  Assigned Staff
                </label>
                <select
                  id="ops-new-assignee"
                  name="assignedTo"
                  value={form.assignedTo}
                  onChange={updateField}
                >
                  <option value="">Unassigned</option>
                  {staff.map((person) => (
                    <option key={person._id} value={person._id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ops-new-ticket-field">
                <label htmlFor="ops-new-product">
                  Product
                </label>
                <select
                  id="ops-new-product"
                  name="productId"
                  value={form.productId}
                  onChange={updateField}
                >
                  <option value="">No product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ops-new-ticket-field">
              <label htmlFor="ops-new-description">
                Description
              </label>
              <textarea
                id="ops-new-description"
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="Provide additional details about the issue..."
                rows={5}
              />
            </div>

            <p className="ops-new-ticket-required">
              * Required fields
            </p>
          </div>

          <div className="ops-new-ticket-footer">
            <button
              type="button"
              className="ops-new-ticket-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="ops-new-ticket-submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="ops-new-ticket-spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Create Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewTicketModal;
