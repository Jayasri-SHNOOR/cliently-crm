
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  CalendarDays,
  UserRound,
  Clock3,
  AlertCircle,
  FileText,
  Save,
  CheckCircle2,
  Loader2,
  Pencil,
  X,
  Plus,
  Trash2,
  ListChecks,
} from "lucide-react";

import { opsApi } from "../../services/opsApi";
import "./WorkOrderDetail.css";

const STATUSES = [
  "Planned",
  "In Progress",
  "On Hold",
  "Completed",
  "Cancelled",
];

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const BADGE_COLORS = {
  Planned: ["#EAF6F3", "#123C3A"],
  "In Progress": ["#E6F0FF", "#1D4ED8"],
  "On Hold": ["#FFF4E5", "#B45309"],
  Completed: ["#E7F7EE", "#15803D"],
  Cancelled: ["#F1F3F3", "#637875"],
  Low: ["#F1F3F3", "#637875"],
  Medium: ["#E6F0FF", "#1D4ED8"],
  High: ["#FFF4E5", "#B45309"],
  Urgent: ["#FDECEC", "#B91C1C"],
};

function Badge({ value }) {
  const [background, color] =
    BADGE_COLORS[value] || ["#F1F3F3", "#637875"];

  return (
    <span
      className="ops-wod-badge"
      style={{ backgroundColor: background, color }}
    >
      {value || "—"}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDateInput(value) {
  return value ? String(value).slice(0, 10) : "";
}

function makeEditForm(order) {
  return {
    title: order.title || "",
    description: order.description || "",
    customerName: order.customer?.name || "",
    customerCompany: order.customer?.company || "",
    customerEmail: order.customer?.email || "",
    customerPhone: order.customer?.phone || "",
    priority: order.priority || "Medium",
    assignedTo: order.assignedTo?._id || "",
    productId: order.productId?._id || "",
    startDate: toDateInput(order.startDate),
    dueDate: toDateInput(order.dueDate),
  };
}

function WorkOrderDetail() {
  const { id } = useParams();

  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusSuccess, setStatusSuccess] = useState("");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  const [staff, setStaff] = useState([]);
  const [products, setProducts] = useState([]);
  const [optionsError, setOptionsError] = useState("");

  // Milestone state
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDueDate, setMilestoneDueDate] =
    useState("");
  const [addingMilestone, setAddingMilestone] =
    useState(false);

  const [milestoneError, setMilestoneError] = useState("");
  const [milestoneSuccess, setMilestoneSuccess] =
    useState("");

  const [editingMilestoneId, setEditingMilestoneId] =
    useState(null);
  const [editingMilestoneTitle, setEditingMilestoneTitle] =
    useState("");
  const [editingMilestoneDueDate, setEditingMilestoneDueDate] =
    useState("");
  const [busyMilestoneId, setBusyMilestoneId] =
    useState(null);

  // ==========================================
  // LOAD WORK ORDER
  // ==========================================

  useEffect(() => {
    let active = true;

    async function loadPage() {
      setLoading(true);
      setError("");
      setEditing(false);
      setEditSuccess("");
      setStatusSuccess("");
      setMilestoneError("");
      setMilestoneSuccess("");
      setEditingMilestoneId(null);

      try {
        const response = await opsApi.getWorkOrder(id);

        if (!active) return;

        const order = response?.data || null;

        setWorkOrder(order);
        setSelectedStatus(order?.status || "");
        setEditForm(order ? makeEditForm(order) : null);
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load work order."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [id]);

  // ==========================================
  // LOAD STAFF AND PRODUCTS
  // ==========================================

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setOptionsError("");

      try {
        const [staffResponse, productResponse] =
          await Promise.all([
            opsApi.listStaff({ limit: 100 }),
            opsApi.listProducts({ limit: 100 }),
          ]);

        if (!active) return;

        setStaff(
          Array.isArray(staffResponse?.data)
            ? staffResponse.data
            : []
        );

        setProducts(
          Array.isArray(productResponse?.data)
            ? productResponse.data
            : []
        );
      } catch (err) {
        if (active) {
          setOptionsError(
            err.message ||
              "Unable to load staff and products."
          );
        }
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  // ==========================================
  // SAVE STATUS
  // ==========================================

  async function handleSaveStatus(event) {
    event.preventDefault();

    if (!workOrder || savingStatus) return;

    setStatusError("");
    setStatusSuccess("");

    if (!STATUSES.includes(selectedStatus)) {
      setStatusError("Please select a valid status.");
      return;
    }

    if (selectedStatus === workOrder.status) return;

    setSavingStatus(true);

    try {
      const response = await opsApi.updateWorkOrder(id, {
        status: selectedStatus,
      });

      if (!response?.data) {
        throw new Error(
          "Unable to confirm status update."
        );
      }

      setWorkOrder(response.data);
      setSelectedStatus(response.data.status);
      setStatusSuccess("Status updated successfully.");
    } catch (err) {
      setStatusError(
        err.message || "Unable to update status."
      );
    } finally {
      setSavingStatus(false);
    }
  }

  // ==========================================
  // EDIT WORK ORDER
  // ==========================================

  function updateField(field, value) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));

    setEditError("");
    setEditSuccess("");
  }

  function startEditing() {
    if (!workOrder) return;

    setEditForm(makeEditForm(workOrder));
    setEditError("");
    setEditSuccess("");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditError("");
    setEditForm(makeEditForm(workOrder));
  }

  async function handleSaveEdit(event) {
    event.preventDefault();

    if (!workOrder || !editForm || savingEdit) return;

    setEditError("");
    setEditSuccess("");

    if (!editForm.title.trim()) {
      setEditError("Work order title is required.");
      return;
    }

    if (editForm.title.trim().length > 150) {
      setEditError(
        "Title must be 150 characters or fewer."
      );
      return;
    }

    if (editForm.description.length > 5000) {
      setEditError(
        "Description must be 5000 characters or fewer."
      );
      return;
    }

    if (!editForm.customerName.trim()) {
      setEditError("Customer name is required.");
      return;
    }

    if (
      editForm.startDate &&
      editForm.dueDate &&
      editForm.dueDate < editForm.startDate
    ) {
      setEditError(
        "Due date cannot be earlier than start date."
      );
      return;
    }

    const payload = {
      title: editForm.title.trim(),
      description: editForm.description,
      customer: {
        name: editForm.customerName.trim(),
        company: editForm.customerCompany.trim(),
        email: editForm.customerEmail.trim(),
        phone: editForm.customerPhone.trim(),
      },
      priority: editForm.priority,
      assignedTo: editForm.assignedTo || null,
      productId: editForm.productId || null,
      startDate: editForm.startDate || null,
      dueDate: editForm.dueDate || null,
    };

    setSavingEdit(true);

    try {
      const response = await opsApi.updateWorkOrder(
        id,
        payload
      );

      if (!response?.data) {
        throw new Error(
          "Unable to confirm work order update."
        );
      }

      setWorkOrder(response.data);
      setSelectedStatus(response.data.status);
      setEditForm(makeEditForm(response.data));
      setEditing(false);
      setEditSuccess(
        "Work order updated successfully."
      );
    } catch (err) {
      setEditError(
        err.message || "Unable to update work order."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  // ==========================================
  // REFRESH AFTER MILESTONE ACTION
  // ==========================================

  async function refreshWorkOrder() {
    const response = await opsApi.getWorkOrder(id);

    if (!response?.data) {
      throw new Error(
        "Unable to refresh work order details."
      );
    }

    setWorkOrder(response.data);
    setSelectedStatus(response.data.status);
  }

  // ==========================================
  // ADD MILESTONE
  // ==========================================

  async function handleAddMilestone(event) {
    event.preventDefault();

    if (addingMilestone || busyMilestoneId) return;

    const title = milestoneTitle.trim();

    setMilestoneError("");
    setMilestoneSuccess("");

    if (!title) {
      setMilestoneError(
        "Milestone title is required."
      );
      return;
    }

    setAddingMilestone(true);

    try {
      await opsApi.addWorkOrderMilestone(id, {
        title,
        dueDate: milestoneDueDate || null,
      });

      await refreshWorkOrder();

      setMilestoneTitle("");
      setMilestoneDueDate("");
      setMilestoneSuccess(
        "Milestone added successfully."
      );
    } catch (err) {
      setMilestoneError(
        err.message || "Unable to add milestone."
      );
    } finally {
      setAddingMilestone(false);
    }
  }

  // ==========================================
  // TOGGLE MILESTONE
  // ==========================================

  async function handleToggleMilestone(milestone) {
    if (busyMilestoneId || addingMilestone) return;

    setMilestoneError("");
    setMilestoneSuccess("");
    setBusyMilestoneId(milestone._id);

    try {
      await opsApi.updateWorkOrderMilestone(
        id,
        milestone._id,
        { done: !milestone.done }
      );

      await refreshWorkOrder();
    } catch (err) {
      setMilestoneError(
        err.message || "Unable to update milestone."
      );
    } finally {
      setBusyMilestoneId(null);
    }
  }

  // ==========================================
  // EDIT MILESTONE
  // ==========================================

  function startEditingMilestone(milestone) {
    setEditingMilestoneId(milestone._id);
    setEditingMilestoneTitle(milestone.title || "");
    setEditingMilestoneDueDate(
      toDateInput(milestone.dueDate)
    );
    setMilestoneError("");
    setMilestoneSuccess("");
  }

  function cancelEditingMilestone() {
    setEditingMilestoneId(null);
    setEditingMilestoneTitle("");
    setEditingMilestoneDueDate("");
  }

  async function handleSaveMilestone(event) {
    event.preventDefault();

    if (!editingMilestoneId || busyMilestoneId) return;

    const title = editingMilestoneTitle.trim();

    if (!title) {
      setMilestoneError(
        "Milestone title is required."
      );
      return;
    }

    setMilestoneError("");
    setMilestoneSuccess("");
    setBusyMilestoneId(editingMilestoneId);

    try {
      await opsApi.updateWorkOrderMilestone(
        id,
        editingMilestoneId,
        {
          title,
          dueDate: editingMilestoneDueDate || null,
        }
      );

      await refreshWorkOrder();
      cancelEditingMilestone();

      setMilestoneSuccess(
        "Milestone updated successfully."
      );
    } catch (err) {
      setMilestoneError(
        err.message || "Unable to save milestone."
      );
    } finally {
      setBusyMilestoneId(null);
    }
  }

  // ==========================================
  // DELETE MILESTONE
  // ==========================================

  async function handleDeleteMilestone(milestone) {
    if (busyMilestoneId || addingMilestone) return;

    const confirmed = window.confirm(
      `Delete milestone "${milestone.title}"?`
    );

    if (!confirmed) return;

    setMilestoneError("");
    setMilestoneSuccess("");
    setBusyMilestoneId(milestone._id);

    try {
      await opsApi.deleteWorkOrderMilestone(
        id,
        milestone._id
      );

      await refreshWorkOrder();

      if (editingMilestoneId === milestone._id) {
        cancelEditingMilestone();
      }

      setMilestoneSuccess(
        "Milestone deleted successfully."
      );
    } catch (err) {
      setMilestoneError(
        err.message || "Unable to delete milestone."
      );
    } finally {
      setBusyMilestoneId(null);
    }
  }

  // ==========================================
  // PROGRESS VALUES
  // ==========================================

  const milestones = Array.isArray(
    workOrder?.milestones
  )
    ? workOrder.milestones
    : [];

  const milestonesTotal =
    workOrder?.milestonesTotal ??
    milestones.length;

  const milestonesDone =
    workOrder?.milestonesDone ??
    milestones.filter((item) => item.done).length;

  const progress = Math.min(
    100,
    Math.max(
      0,
      Number(workOrder?.progress) || 0
    )
  );

  const milestoneBusy =
    Boolean(busyMilestoneId) || addingMilestone;

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="ops-workorder-detail">
      <Link
        to="/operations/work-orders"
        className="ops-wod-back"
      >
        <ArrowLeft size={17} />
        Back to Work Orders
      </Link>

      {loading ? (
        <div className="ops-wod-message">
          Loading work order details...
        </div>
      ) : error ? (
        <div
          className="ops-wod-message ops-wod-error"
          role="alert"
        >
          <AlertCircle size={20} />
          {error}
        </div>
      ) : !workOrder ? (
        <div className="ops-wod-message">
          Work order not found.
        </div>
      ) : (
        <>
          {/* HEADER */}

          <div className="ops-wod-header">
            <div className="ops-wod-header-main">
              <div className="ops-wod-icon">
                <ClipboardList size={24} />
              </div>

              <div>
                <p className="ops-wod-number">
                  WO-
                  {String(
                    workOrder.number || 0
                  ).padStart(4, "0")}
                </p>

                <h1>
                  {workOrder.title || "Untitled"}
                </h1>
              </div>
            </div>

            <Badge value={workOrder.status} />
          </div>

          {editSuccess && (
            <p
              className="ops-wod-save-success"
              role="status"
            >
              <CheckCircle2 size={17} />
              {editSuccess}
            </p>
          )}

          <div className="ops-wod-layout">
            {/* WORK ORDER INFORMATION */}

            <section className="ops-wod-card">
              <div className="ops-wod-card-heading">
                <FileText size={19} />
                <h2>Work Order Information</h2>

                {!editing && (
                  <button
                    type="button"
                    className="ops-wod-edit-button"
                    onClick={startEditing}
                  >
                    <Pencil size={16} />
                    Edit Work Order
                  </button>
                )}
              </div>

              {editing && editForm ? (
                <form
                  className="ops-wod-edit-form"
                  onSubmit={handleSaveEdit}
                >
                  <div className="ops-wod-edit-grid">
                    <label className="ops-wod-edit-field">
                      <span>Title *</span>
                      <input
                        type="text"
                        required
                        maxLength={150}
                        value={editForm.title}
                        onChange={(event) =>
                          updateField(
                            "title",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label className="ops-wod-edit-field">
                      <span>Priority</span>
                      <select
                        value={editForm.priority}
                        onChange={(event) =>
                          updateField(
                            "priority",
                            event.target.value
                          )
                        }
                      >
                        {PRIORITIES.map((priority) => (
                          <option
                            key={priority}
                            value={priority}
                          >
                            {priority}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="ops-wod-edit-field">
                      <span>Customer Name *</span>
                      <input
                        type="text"
                        required
                        value={editForm.customerName}
                        onChange={(event) =>
                          updateField(
                            "customerName",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label className="ops-wod-edit-field">
                      <span>Company</span>
                      <input
                        type="text"
                        value={editForm.customerCompany}
                        onChange={(event) =>
                          updateField(
                            "customerCompany",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label className="ops-wod-edit-field">
                      <span>Customer Email</span>
                      <input
                        type="email"
                        value={editForm.customerEmail}
                        onChange={(event) =>
                          updateField(
                            "customerEmail",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label className="ops-wod-edit-field">
                      <span>Customer Phone</span>
                      <input
                        type="tel"
                        value={editForm.customerPhone}
                        onChange={(event) =>
                          updateField(
                            "customerPhone",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label className="ops-wod-edit-field">
                      <span>Assigned Staff</span>
                      <select
                        value={editForm.assignedTo}
                        onChange={(event) =>
                          updateField(
                            "assignedTo",
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          Unassigned
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
                    </label>

                    <label className="ops-wod-edit-field">
                      <span>Product</span>
                      <select
                        value={editForm.productId}
                        onChange={(event) =>
                          updateField(
                            "productId",
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          No product
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
                    </label>

                    <label className="ops-wod-edit-field">
                      <span>Start Date</span>
                      <input
                        type="date"
                        value={editForm.startDate}
                        onChange={(event) =>
                          updateField(
                            "startDate",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label className="ops-wod-edit-field">
                      <span>Due Date</span>
                      <input
                        type="date"
                        min={
                          editForm.startDate || undefined
                        }
                        value={editForm.dueDate}
                        onChange={(event) =>
                          updateField(
                            "dueDate",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label className="ops-wod-edit-field ops-wod-edit-full">
                      <span>Description</span>
                      <textarea
                        rows={5}
                        maxLength={5000}
                        value={editForm.description}
                        onChange={(event) =>
                          updateField(
                            "description",
                            event.target.value
                          )
                        }
                      />
                    </label>
                  </div>

                  {optionsError && (
                    <p
                      className="ops-wod-save-error"
                      role="alert"
                    >
                      <AlertCircle size={16} />
                      {optionsError}
                    </p>
                  )}

                  {editError && (
                    <p
                      className="ops-wod-save-error"
                      role="alert"
                    >
                      <AlertCircle size={16} />
                      {editError}
                    </p>
                  )}

                  <div className="ops-wod-edit-actions">
                    <button
                      type="button"
                      className="ops-wod-cancel-button"
                      disabled={savingEdit}
                      onClick={cancelEditing}
                    >
                      <X size={17} />
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="ops-wod-save-button"
                      disabled={savingEdit}
                    >
                      {savingEdit ? (
                        <>
                          <Loader2
                            size={17}
                            className="ops-wod-spinner"
                          />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={17} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="ops-wod-fields">
                  <div className="ops-wod-field">
                    <span>Status</span>
                    <Badge value={workOrder.status} />
                  </div>

                  <div className="ops-wod-field">
                    <span>Priority</span>
                    <Badge value={workOrder.priority} />
                  </div>

                  <div className="ops-wod-field">
                    <span>Customer</span>
                    <strong>
                      {workOrder.customer?.name || "—"}
                    </strong>
                  </div>

                  <div className="ops-wod-field">
                    <span>
                      <UserRound size={16} />
                      Assigned To
                    </span>
                    <strong>
                      {workOrder.assignedTo?.name ||
                        "Unassigned"}
                    </strong>
                  </div>

                  <div className="ops-wod-field">
                    <span>Product</span>
                    <strong>
                      {workOrder.productId?.name || "—"}
                    </strong>
                  </div>

                  <div className="ops-wod-field">
                    <span>
                      <CalendarDays size={16} />
                      Start Date
                    </span>
                    <strong>
                      {formatDate(workOrder.startDate)}
                    </strong>
                  </div>

                  <div className="ops-wod-field">
                    <span>
                      <CalendarDays size={16} />
                      Due Date
                    </span>
                    <strong>
                      {formatDate(workOrder.dueDate)}
                    </strong>
                  </div>

                  <div className="ops-wod-field">
                    <span>
                      <Clock3 size={16} />
                      Created On
                    </span>
                    <strong>
                      {formatDate(workOrder.createdAt)}
                    </strong>
                  </div>

                  <div className="ops-wod-field">
                    <span>Last Updated</span>
                    <strong>
                      {formatDate(workOrder.updatedAt)}
                    </strong>
                  </div>
                </div>
              )}
            </section>

            {/* DESCRIPTION */}

            <section className="ops-wod-card">
              <div className="ops-wod-card-heading">
                <FileText size={19} />
                <h2>Description</h2>
              </div>

              <p className="ops-wod-description">
                {workOrder.description ||
                  "No description provided."}
              </p>
            </section>

            {/* PROGRESS */}

            <section className="ops-wod-card">
              <div className="ops-wod-card-heading">
                <ListChecks size={19} />
                <h2>Work Order Progress</h2>
              </div>

              <div className="ops-wod-progress-summary">
                <strong>{progress}% Complete</strong>
                <span>
                  {milestonesDone} of {milestonesTotal}{" "}
                  milestones completed
                </span>
              </div>

              <div
                className="ops-wod-progress-track"
                role="progressbar"
                aria-label="Work order progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div
                  className="ops-wod-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </section>

            {/* MILESTONES */}

            <section className="ops-wod-card">
              <div className="ops-wod-card-heading">
                <ListChecks size={19} />
                <h2>Milestones</h2>
              </div>

              {milestoneError && (
                <p
                  className="ops-wod-save-error"
                  role="alert"
                >
                  <AlertCircle size={16} />
                  {milestoneError}
                </p>
              )}

              {milestoneSuccess && (
                <p
                  className="ops-wod-save-success"
                  role="status"
                >
                  <CheckCircle2 size={16} />
                  {milestoneSuccess}
                </p>
              )}

              {milestones.length === 0 ? (
                <p className="ops-wod-description">
                  No milestones added yet.
                </p>
              ) : (
                <div className="ops-wod-milestone-list">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone._id}
                      className={`ops-wod-milestone-item ${
                        milestone.done
                          ? "ops-wod-milestone-done"
                          : ""
                      }`}
                    >
                      {editingMilestoneId ===
                      milestone._id ? (
                        <form
                          className="ops-wod-milestone-edit"
                          onSubmit={handleSaveMilestone}
                        >
                          <input
                            type="text"
                            required
                            aria-label="Milestone title"
                            value={editingMilestoneTitle}
                            onChange={(event) =>
                              setEditingMilestoneTitle(
                                event.target.value
                              )
                            }
                            disabled={milestoneBusy}
                          />

                          <input
                            type="date"
                            aria-label="Milestone due date"
                            value={
                              editingMilestoneDueDate
                            }
                            onChange={(event) =>
                              setEditingMilestoneDueDate(
                                event.target.value
                              )
                            }
                            disabled={milestoneBusy}
                          />

                          <div className="ops-wod-milestone-actions">
                            <button
                              type="submit"
                              className="ops-wod-save-button"
                              disabled={milestoneBusy}
                            >
                              <Save size={15} />
                              Save
                            </button>

                            <button
                              type="button"
                              className="ops-wod-cancel-button"
                              onClick={
                                cancelEditingMilestone
                              }
                              disabled={milestoneBusy}
                            >
                              <X size={15} />
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <label className="ops-wod-milestone-main">
                            <input
                              type="checkbox"
                              checked={Boolean(
                                milestone.done
                              )}
                              disabled={milestoneBusy}
                              onChange={() =>
                                handleToggleMilestone(
                                  milestone
                                )
                              }
                            />

                            <span className="ops-wod-milestone-text">
                              <strong>
                                {milestone.title}
                              </strong>

                              {milestone.dueDate && (
                                <small>
                                  <CalendarDays
                                    size={13}
                                  />
                                  Due:{" "}
                                  {formatDate(
                                    milestone.dueDate
                                  )}
                                </small>
                              )}
                            </span>
                          </label>

                          <div className="ops-wod-milestone-actions">
                            <button
                              type="button"
                              className="ops-wod-milestone-icon-button"
                              aria-label={`Edit ${milestone.title}`}
                              title="Edit milestone"
                              disabled={milestoneBusy}
                              onClick={() =>
                                startEditingMilestone(
                                  milestone
                                )
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              className="ops-wod-milestone-icon-button ops-wod-milestone-delete"
                              aria-label={`Delete ${milestone.title}`}
                              title="Delete milestone"
                              disabled={milestoneBusy}
                              onClick={() =>
                                handleDeleteMilestone(
                                  milestone
                                )
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ADD MILESTONE */}

              <form
                className="ops-wod-add-milestone"
                onSubmit={handleAddMilestone}
              >
                <h3>Add New Milestone</h3>

                <div className="ops-wod-milestone-form-grid">
                  <label className="ops-wod-edit-field">
                    <span>Milestone Title *</span>
                    <input
                      type="text"
                      required
                      placeholder="Enter milestone title"
                      value={milestoneTitle}
                      onChange={(event) =>
                        setMilestoneTitle(
                          event.target.value
                        )
                      }
                      disabled={milestoneBusy}
                    />
                  </label>

                  <label className="ops-wod-edit-field">
                    <span>Due Date (Optional)</span>
                    <input
                      type="date"
                      value={milestoneDueDate}
                      onChange={(event) =>
                        setMilestoneDueDate(
                          event.target.value
                        )
                      }
                      disabled={milestoneBusy}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="ops-wod-save-button"
                  disabled={milestoneBusy}
                >
                  {addingMilestone ? (
                    <>
                      <Loader2
                        size={17}
                        className="ops-wod-spinner"
                      />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Add Milestone
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* STATUS UPDATE */}

            <section className="ops-wod-card ops-wod-status-card">
              <div className="ops-wod-card-heading">
                <CheckCircle2 size={19} />
                <h2>Update Work Order Status</h2>
              </div>

              <form onSubmit={handleSaveStatus}>
                <label
                  className="ops-wod-status-label"
                  htmlFor="ops-wod-status"
                >
                  Work Order Status
                </label>

                <select
                  id="ops-wod-status"
                  className="ops-wod-status-select"
                  value={selectedStatus}
                  disabled={savingStatus || savingEdit}
                  onChange={(event) => {
                    setSelectedStatus(event.target.value);
                    setStatusError("");
                    setStatusSuccess("");
                  }}
                >
                  {STATUSES.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ))}
                </select>

                {statusError && (
                  <p
                    className="ops-wod-save-error"
                    role="alert"
                  >
                    <AlertCircle size={16} />
                    {statusError}
                  </p>
                )}

                {statusSuccess && (
                  <p
                    className="ops-wod-save-success"
                    role="status"
                  >
                    <CheckCircle2 size={16} />
                    {statusSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  className="ops-wod-save-button"
                  disabled={
                    savingStatus ||
                    savingEdit ||
                    selectedStatus === workOrder.status
                  }
                >
                  {savingStatus ? (
                    <>
                      <Loader2
                        size={17}
                        className="ops-wod-spinner"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save Status
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default WorkOrderDetail;
