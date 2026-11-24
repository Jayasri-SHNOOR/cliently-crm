
import { useEffect, useState } from "react";
import {
  X,
  ClipboardList,
  Loader2,
} from "lucide-react";

import { opsApi } from "../../services/opsApi";

import "./NewWorkOrderModal.css";

// ==========================================
// FORM DEFAULT VALUES
// ==========================================

const INITIAL_FORM = {
  title: "",
  description: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  customerCompany: "",
  status: "Planned",
  priority: "Medium",
  assignedTo: "",
  productId: "",
  startDate: "",
  dueDate: "",
};

const STATUSES = [
  "Planned",
  "In Progress",
  "On Hold",
  "Completed",
  "Cancelled",
];

const PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

// ==========================================
// NEW WORK ORDER MODAL
// ==========================================

function NewWorkOrderModal({
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState(INITIAL_FORM);

  const [staff, setStaff] = useState([]);
  const [products, setProducts] = useState([]);

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [optionsError, setOptionsError] =
    useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ========================================
  // LOAD STAFF AND PRODUCTS
  // ========================================

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);
      setOptionsError("");

      try {
        const [staffResponse, productsResponse] =
          await Promise.all([
            opsApi.staff(),
            opsApi.products(),
          ]);

        if (!active) return;

        setStaff(
          Array.isArray(staffResponse?.data)
            ? staffResponse.data
            : []
        );

        setProducts(
          Array.isArray(productsResponse?.data)
            ? productsResponse.data
            : []
        );
      } catch (err) {
        if (!active) return;

        setOptionsError(
          err.message ||
            "Unable to load staff and products."
        );
      } finally {
        if (active) {
          setLoadingOptions(false);
        }
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  // ========================================
  // UPDATE FORM FIELD
  // ========================================

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  // ========================================
  // SUBMIT FORM
  // ========================================

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const title = form.title.trim();
    const customerName = form.customerName.trim();

    if (!title) {
      setError("Work order title is required.");
      return;
    }

    if (title.length > 150) {
      setError(
        "Work order title cannot exceed 150 characters."
      );
      return;
    }

    if (!customerName) {
      setError("Customer name is required.");
      return;
    }

    if (form.description.trim().length > 5000) {
      setError(
        "Description cannot exceed 5000 characters."
      );
      return;
    }

    if (
      form.startDate &&
      form.dueDate &&
      form.dueDate < form.startDate
    ) {
      setError(
        "Due date cannot be earlier than start date."
      );
      return;
    }

    const payload = {
      title,
      description: form.description.trim(),

      customer: {
        name: customerName,
        email: form.customerEmail.trim(),
        phone: form.customerPhone.trim(),
        company: form.customerCompany.trim(),
      },

      status: form.status,
      priority: form.priority,

      assignedTo: form.assignedTo || null,
      productId: form.productId || null,

      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
    };

    setSaving(true);

    try {
      await onCreated(payload);
      onClose();
    } catch (err) {
      setError(
        err.message ||
          "Unable to create work order."
      );
    } finally {
      setSaving(false);
    }
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div
      className="ops-wo-modal-overlay"
      onMouseDown={(event) => {
        if (
          !saving &&
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="ops-wo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ops-new-wo-title"
      >
        {/* MODAL HEADER */}

        <div className="ops-wo-modal-header">
          <div className="ops-wo-modal-heading">
            <span className="ops-wo-modal-icon">
              <ClipboardList size={21} />
            </span>

            <div>
              <h2 id="ops-new-wo-title">
                New Work Order
              </h2>

              <p>
                Create a task for your operations team.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="ops-wo-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL FORM */}

        <form onSubmit={handleSubmit}>
          <div className="ops-wo-modal-body">
            {error && (
              <div
                className="ops-wo-modal-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {optionsError && (
              <div
                className="ops-wo-modal-error"
                role="alert"
              >
                {optionsError}
              </div>
            )}

            {/* WORK ORDER TITLE */}

            <div className="ops-wo-modal-field">
              <label htmlFor="ops-wo-title">
                Work Order Title *
              </label>

              <input
                id="ops-wo-title"
                name="title"
                value={form.title}
                onChange={updateField}
                placeholder="Enter work order title"
                maxLength={150}
                required
                disabled={saving}
              />
            </div>

            {/* DESCRIPTION */}

            <div className="ops-wo-modal-field">
              <label htmlFor="ops-wo-description">
                Description
              </label>

              <textarea
                id="ops-wo-description"
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="Describe the work to be completed..."
                maxLength={5000}
                rows={4}
                disabled={saving}
              />
            </div>

            {/* CUSTOMER INFORMATION */}

            <div className="ops-wo-modal-field">
              <label htmlFor="ops-wo-customer-name">
                Customer Name *
              </label>

              <input
                id="ops-wo-customer-name"
                name="customerName"
                value={form.customerName}
                onChange={updateField}
                placeholder="Enter customer name"
                required
                disabled={saving}
              />
            </div>

            <div className="ops-wo-modal-grid">
              <div className="ops-wo-modal-field">
                <label htmlFor="ops-wo-customer-company">
                  Customer Company
                </label>

                <input
                  id="ops-wo-customer-company"
                  name="customerCompany"
                  value={form.customerCompany}
                  onChange={updateField}
                  placeholder="Company name"
                  disabled={saving}
                />
              </div>

              <div className="ops-wo-modal-field">
                <label htmlFor="ops-wo-customer-email">
                  Customer Email
                </label>

                <input
                  id="ops-wo-customer-email"
                  name="customerEmail"
                  type="email"
                  value={form.customerEmail}
                  onChange={updateField}
                  placeholder="customer@example.com"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="ops-wo-modal-field">
              <label htmlFor="ops-wo-customer-phone">
                Customer Phone
              </label>

              <input
                id="ops-wo-customer-phone"
                name="customerPhone"
                type="tel"
                value={form.customerPhone}
                onChange={updateField}
                placeholder="Enter customer phone number"
                disabled={saving}
              />
            </div>

            {/* STATUS AND PRIORITY */}

            <div className="ops-wo-modal-grid">
              <div className="ops-wo-modal-field">
                <label htmlFor="ops-wo-status">
                  Status
                </label>

                <select
                  id="ops-wo-status"
                  name="status"
                  value={form.status}
                  onChange={updateField}
                  disabled={saving}
                >
                  {STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ops-wo-modal-field">
                <label htmlFor="ops-wo-priority">
                  Priority
                </label>

                <select
                  id="ops-wo-priority"
                  name="priority"
                  value={form.priority}
                  onChange={updateField}
                  disabled={saving}
                >
                  {PRIORITIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* STAFF AND PRODUCT */}

            <div className="ops-wo-modal-grid">
              <div className="ops-wo-modal-field">
                <label htmlFor="ops-wo-assigned">
                  Assign To
                </label>

                <select
                  id="ops-wo-assigned"
                  name="assignedTo"
                  value={form.assignedTo}
                  onChange={updateField}
                  disabled={saving || loadingOptions}
                >
                  <option value="">
                    {loadingOptions
                      ? "Loading staff..."
                      : "Unassigned"}
                  </option>

                  {staff.map((person) => (
                    <option
                      key={person._id}
                      value={person._id}
                    >
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ops-wo-modal-field">
                <label htmlFor="ops-wo-product">
                  Product
                </label>

                <select
                  id="ops-wo-product"
                  name="productId"
                  value={form.productId}
                  onChange={updateField}
                  disabled={saving || loadingOptions}
                >
                  <option value="">
                    {loadingOptions
                      ? "Loading products..."
                      : "No product selected"}
                  </option>

                  {products.map((product) => (
                    <option
                      key={product._id}
                      value={product._id}
                    >
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* START AND DUE DATES */}

            <div className="ops-wo-modal-grid">
              <div className="ops-wo-modal-field">
                <label htmlFor="ops-wo-start-date">
                  Start Date
                </label>

                <input
                  id="ops-wo-start-date"
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={updateField}
                  disabled={saving}
                />
              </div>

              <div className="ops-wo-modal-field">
                <label htmlFor="ops-wo-due-date">
                  Due Date
                </label>

                <input
                  id="ops-wo-due-date"
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
                  min={form.startDate || undefined}
                  onChange={updateField}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* MODAL FOOTER */}

          <div className="ops-wo-modal-footer">
            <button
              type="button"
              className="ops-wo-modal-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="ops-wo-modal-submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="ops-wo-modal-spinner"
                  />
                  Creating...
                </>
              ) : (
                "Create Work Order"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewWorkOrderModal;
