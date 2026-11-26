
import React, { useEffect, useMemo, useState } from "react";
import {
  UsersRound,
  UserCheck,
  UserX,
  UserPlus,
  Search,
  RefreshCw,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Mail,
  Phone,
  ShieldCheck,
  CalendarDays,
  Clock3,
  CheckCircle2,
  AlertCircle,
  UserRound,
  LoaderCircle,
  Inbox,
  Info
} from "lucide-react";

import { apiFetch } from "../../../lib/api";
import "./Users.css";

const EMPTY_FORM = {
  name: "",
  email: "",
  mobileNumber: ""
};

const EMPTY_PAGINATION = {
  page: 1,
  total: 0,
  totalPages: 0
};

function formatDate(value) {
  if (!value) return "Never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getInitials(name) {
  return String(name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getRoleLabel(role) {
  const labels = {
    SUPER_ADMIN: "Super Admin",
    CLIENT_ADMIN: "Client Admin",
    SALES_EXECUTIVE: "Sales Executive",
    OPERATIONAL_STAFF: "Operational Staff"
  };

  return labels[role] || role || "Unknown";
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "10",
          search
        });

        const response = await apiFetch(
          `/api/super-admin/users?${params.toString()}`
        );

        if (cancelled) return;

        setUsers(
          Array.isArray(response?.users)
            ? response.users
            : []
        );

        setPagination(
          response?.pagination || EMPTY_PAGINATION
        );
      } catch (err) {
        if (cancelled) return;

        setError(err.message || "Unable to load users.");
        setUsers([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [page, search, refreshKey]);

  useEffect(() => {
    if (!showAddUser && !selectedUser) return;

    function handleEscape(event) {
      if (event.key !== "Escape") return;

      if (selectedUser) {
        setSelectedUser(null);
      } else if (!saving) {
        setShowAddUser(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showAddUser, selectedUser, saving]);

  const activeUsers = users.filter(
    (user) => user.status === "Active"
  ).length;

  const inactiveUsers = users.filter(
    (user) => user.status === "Inactive"
  ).length;

  const displayedUsers = useMemo(() => {
    let result = [...users];

    if (statusFilter !== "All") {
      result = result.filter(
        (user) => user.status === statusFilter
      );
    }

    if (roleFilter !== "All") {
      result = result.filter(
        (user) => user.role === roleFilter
      );
    }

    result.sort((a, b) => {
      if (sortBy === "name-asc") {
        return String(a.name || "").localeCompare(
          String(b.name || "")
        );
      }

      if (sortBy === "name-desc") {
        return String(b.name || "").localeCompare(
          String(a.name || "")
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
        );
      }

      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    });

    return result;
  }, [users, statusFilter, roleFilter, sortBy]);

  const filtersActive =
    Boolean(search) ||
    statusFilter !== "All" ||
    roleFilter !== "All" ||
    sortBy !== "newest";

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setRoleFilter("All");
    setSortBy("newest");
    setPage(1);
  }

  function refreshUsers() {
    setNotification(null);
    setRefreshKey((previous) => previous + 1);
  }

  function openAddUser() {
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setShowAddUser(true);
  }

  function closeAddUser() {
    if (saving) return;

    setShowAddUser(false);
    setFormError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));

    if (formError) setFormError("");
  }

  async function handleAddUser(event) {
    event.preventDefault();

    if (saving) return;

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const mobileNumber = form.mobileNumber.trim();

    if (!name || !email) {
      setFormError("Name and email are required.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const result = await apiFetch(
        "/api/super-admin/users",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            mobileNumber
          })
        }
      );

      setShowAddUser(false);
      setForm({ ...EMPTY_FORM });

      setNotification({
        type: "success",
        message:
          result?.message ||
          "User created. Account activation is pending."
      });

      setSearch("");
      setStatusFilter("All");
      setRoleFilter("All");
      setSortBy("newest");
      setPage(1);
      setRefreshKey((previous) => previous + 1);
    } catch (err) {
      setFormError(
        err.message || "Unable to create user."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sa-users-page sa-users-redesign">
      {/* PAGE HEADER */}
      <header className="sa-um-header">
        <div className="sa-um-heading">
          <div className="sa-um-heading-icon">
            <UsersRound size={25} />
          </div>

          <div>
            <div className="sa-um-eyebrow">
              PLATFORM ADMINISTRATION
            </div>

            <h1>Users Management</h1>

            <p>
              Manage platform administrators, monitor
              access and maintain user accounts.
            </p>
          </div>
        </div>

        <div className="sa-um-header-actions">
          <button
            type="button"
            className="sa-um-outline-btn"
            onClick={refreshUsers}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "sa-um-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            className="sa-um-primary-btn"
            onClick={openAddUser}
          >
            <UserPlus size={18} />
            Add User
          </button>
        </div>
      </header>

      {/* NOTIFICATION */}
      {notification && (
        <div
          className={`sa-um-notice sa-um-notice-${notification.type}`}
          role="status"
        >
          <CheckCircle2 size={19} />
          <span>{notification.message}</span>

          <button
            type="button"
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <section className="sa-um-stats">
        <div className="sa-um-stat-card">
          <div className="sa-um-stat-top">
            <span className="sa-um-stat-icon total">
              <UsersRound size={21} />
            </span>

            <span className="sa-um-stat-caption">
              Platform
            </span>
          </div>

          <strong>{loading ? "—" : pagination.total}</strong>
          <span className="sa-um-stat-label">
            Total Platform Users
          </span>

          <div className="sa-um-stat-footer">
            <span className="sa-um-dot" />
            Registered administrators
          </div>
        </div>

        <div className="sa-um-stat-card">
          <div className="sa-um-stat-top">
            <span className="sa-um-stat-icon active">
              <UserCheck size={21} />
            </span>

            <span className="sa-um-stat-caption">
              Current page
            </span>
          </div>

          <strong>{loading ? "—" : activeUsers}</strong>
          <span className="sa-um-stat-label">
            Active Users
          </span>

          <div className="sa-um-stat-footer">
            <span className="sa-um-dot green" />
            Active accounts on this page
          </div>
        </div>

        <div className="sa-um-stat-card">
          <div className="sa-um-stat-top">
            <span className="sa-um-stat-icon inactive">
              <UserX size={21} />
            </span>

            <span className="sa-um-stat-caption">
              Current page
            </span>
          </div>

          <strong>{loading ? "—" : inactiveUsers}</strong>
          <span className="sa-um-stat-label">
            Inactive Users
          </span>

          <div className="sa-um-stat-footer">
            <span className="sa-um-dot amber" />
            Inactive accounts on this page
          </div>
        </div>
      </section>

      {/* USER DIRECTORY */}
      <section className="sa-um-directory">
        <div className="sa-um-directory-heading">
          <div>
            <h2>Platform Users</h2>
            <p>
              Browse and inspect registered platform
              administrators.
            </p>
          </div>

          <span className="sa-um-count">
            {pagination.total} users
          </span>
        </div>

        {/* FILTER TOOLBAR */}
        <div className="sa-um-toolbar">
          <div className="sa-um-search">
            <Search size={19} />

            <input
              type="search"
              placeholder="Search by name or email..."
              aria-label="Search platform users"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="sa-um-filter-group">
            <div className="sa-um-select-wrap">
              <Filter size={16} />

              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="sa-um-select-wrap">
              <ShieldCheck size={16} />

              <select
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
              >
                <option value="All">All Roles</option>
                <option value="SUPER_ADMIN">
                  Super Admin
                </option>
              </select>
            </div>

            <div className="sa-um-select-wrap">
              <ArrowUpDown size={16} />

              <select
                aria-label="Sort users"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
              </select>
            </div>
          </div>
        </div>

        {filtersActive && (
          <div className="sa-um-filter-info">
            <span>
              <Info size={14} />
              Status and sorting filters apply to the
              current page.
            </span>

            <button
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="sa-um-error" role="alert">
            <AlertCircle size={20} />
            <div>
              <strong>Unable to load users</strong>
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={refreshUsers}
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div
            className="sa-um-loading"
            role="status"
          >
            <LoaderCircle
              size={27}
              className="sa-um-spin"
            />
            <span>Loading platform users...</span>
          </div>
        )}

        {/* USER TABLE */}
        {!loading && !error && (
          <>
            <div className="sa-um-table-wrap">
              <table className="sa-um-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Joined</th>
                    <th className="sa-um-action-col">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {displayedUsers.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="sa-um-user-cell">
                          <span className="sa-um-avatar">
                            {getInitials(user.name)}
                          </span>

                          <div className="sa-um-user-info">
                            <strong>
                              {user.name || "Unnamed User"}
                            </strong>

                            <span>{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="sa-um-role-badge">
                          <ShieldCheck size={13} />
                          {getRoleLabel(user.role)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`sa-um-status ${
                            user.status === "Active"
                              ? "is-active"
                              : "is-inactive"
                          }`}
                        >
                          <span className="sa-um-status-dot" />
                          {user.status || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <span className="sa-um-date">
                          {formatDate(user.lastLoginAt)}
                        </span>
                      </td>

                      <td>
                        <span className="sa-um-date">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="sa-um-view-btn"
                          onClick={() =>
                            setSelectedUser(user)
                          }
                          aria-label={`View ${user.name}`}
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {displayedUsers.length === 0 && (
              <div className="sa-um-empty">
                <span className="sa-um-empty-icon">
                  <Inbox size={30} />
                </span>

                <h3>No users found</h3>

                <p>
                  Try adjusting your filters or search
                  to find matching users.
                </p>

                {filtersActive && (
                  <button
                    type="button"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* PAGINATION */}
            <div className="sa-um-pagination">
              <span>
                Page {page} of{" "}
                {Math.max(1, pagination.totalPages)}
                {" · "}
                {pagination.total} total users
              </span>

              <div className="sa-um-page-buttons">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((previous) =>
                      Math.max(1, previous - 1)
                    )
                  }
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <span className="sa-um-page-number">
                  {page}
                </span>

                <button
                  type="button"
                  disabled={
                    page >= pagination.totalPages
                  }
                  onClick={() =>
                    setPage((previous) => previous + 1)
                  }
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div
          className="sa-um-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedUser(null);
            }
          }}
        >
          <div
            className="sa-um-modal sa-um-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sa-um-details-title"
          >
            <div className="sa-um-modal-top">
              <div>
                <span className="sa-um-modal-eyebrow">
                  USER PROFILE
                </span>
                <h2 id="sa-um-details-title">
                  User Details
                </h2>
                <p>
                  Platform administrator information
                </p>
              </div>

              <button
                type="button"
                className="sa-um-modal-close"
                onClick={() => setSelectedUser(null)}
                aria-label="Close user details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="sa-um-profile">
              <span className="sa-um-profile-avatar">
                {getInitials(selectedUser.name)}
              </span>

              <h3>{selectedUser.name}</h3>
              <p>{selectedUser.email}</p>

              <span
                className={`sa-um-status ${
                  selectedUser.status === "Active"
                    ? "is-active"
                    : "is-inactive"
                }`}
              >
                <span className="sa-um-status-dot" />
                {selectedUser.status}
              </span>
            </div>

            <div className="sa-um-detail-list">
              <div className="sa-um-detail-row">
                <span>
                  <UserRound size={17} />
                  Full Name
                </span>
                <strong>{selectedUser.name}</strong>
              </div>

              <div className="sa-um-detail-row">
                <span>
                  <Mail size={17} />
                  Email
                </span>
                <strong>{selectedUser.email}</strong>
              </div>

              <div className="sa-um-detail-row">
                <span>
                  <ShieldCheck size={17} />
                  Role
                </span>
                <strong>
                  {getRoleLabel(selectedUser.role)}
                </strong>
              </div>

              <div className="sa-um-detail-row">
                <span>
                  <Clock3 size={17} />
                  Last Login
                </span>
                <strong>
                  {formatDate(selectedUser.lastLoginAt)}
                </strong>
              </div>

              <div className="sa-um-detail-row">
                <span>
                  <CalendarDays size={17} />
                  Joined
                </span>
                <strong>
                  {formatDate(selectedUser.createdAt)}
                </strong>
              </div>
            </div>

            <div className="sa-um-modal-footer">
              <button
                type="button"
                className="sa-um-outline-btn"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUser && (
        <div
          className="sa-um-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddUser();
            }
          }}
        >
          <div
            className="sa-um-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sa-um-add-title"
          >
            <div className="sa-um-modal-top">
              <div className="sa-um-modal-title-group">
                <span className="sa-um-modal-icon">
                  <UserPlus size={22} />
                </span>

                <div>
                  <span className="sa-um-modal-eyebrow">
                    USER MANAGEMENT
                  </span>

                  <h2 id="sa-um-add-title">
                    Add New User
                  </h2>

                  <p>
                    Create a new platform administrator.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="sa-um-modal-close"
                onClick={closeAddUser}
                disabled={saving}
                aria-label="Close Add User"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="sa-um-modal-body">
                <div className="sa-um-form-field">
                  <label htmlFor="sa-new-name">
                    Full Name <em>*</em>
                  </label>

                  <div className="sa-um-input-icon">
                    <UserRound size={18} />

                    <input
                      id="sa-new-name"
                      name="name"
                      type="text"
                      placeholder="Enter full name"
                      autoComplete="name"
                      value={form.name}
                      onChange={handleFormChange}
                      maxLength={100}
                      disabled={saving}
                      required
                    />
                  </div>
                </div>

                <div className="sa-um-form-field">
                  <label htmlFor="sa-new-email">
                    Email Address <em>*</em>
                  </label>

                  <div className="sa-um-input-icon">
                    <Mail size={18} />

                    <input
                      id="sa-new-email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleFormChange}
                      disabled={saving}
                      required
                    />
                  </div>
                </div>

                <div className="sa-um-form-field">
                  <label htmlFor="sa-new-mobile">
                    Mobile Number
                  </label>

                  <div className="sa-um-input-icon">
                    <Phone size={18} />

                    <input
                      id="sa-new-mobile"
                      name="mobileNumber"
                      type="tel"
                      placeholder="Enter mobile number"
                      autoComplete="tel"
                      value={form.mobileNumber}
                      onChange={handleFormChange}
                      maxLength={20}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="sa-um-form-field">
                  <label htmlFor="sa-new-role">
                    Assigned Role
                  </label>

                  <div className="sa-um-input-icon">
                    <ShieldCheck size={18} />

                    <select
                      id="sa-new-role"
                      value="SUPER_ADMIN"
                      disabled
                    >
                      <option value="SUPER_ADMIN">
                        Super Admin
                      </option>
                    </select>
                  </div>
                </div>

                <div className="sa-um-form-note">
                  <Info size={18} />

                  <span>
                    The account will be created in
                    inactive status. Secure activation
                    must be completed before login.
                  </span>
                </div>

                {formError && (
                  <div
                    className="sa-um-form-error"
                    role="alert"
                  >
                    <AlertCircle size={18} />
                    {formError}
                  </div>
                )}
              </div>

              <div className="sa-um-modal-footer">
                <button
                  type="button"
                  className="sa-um-outline-btn"
                  onClick={closeAddUser}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="sa-um-primary-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="sa-um-spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
