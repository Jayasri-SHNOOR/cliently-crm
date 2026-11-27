
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

const TENANTS_API = "/api/super-admin/tenants";

const DEFAULT_TENANT = {
  company: "",
  admin: "Mounika",
  email: "",
  plan: "Starter",
  environment: "Production",
  status: "Pending",
  date: new Date().toISOString().slice(0, 10),
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function inputDate(value) {
  if (!value || value === "—") {
    return new Date().toISOString().slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

export default function useTenants() {
  const [tenants, setTenants] = useState([]);
  const [tenantError, setTenantError] = useState("");
  const [tenantsLoading, setTenantsLoading] = useState(true);

  const [selectedTenant, setSelectedTenant] = useState(null);

  const [tenantQuery, setTenantQuery] = useState("");
  const [tenantStatusFilter, setTenantStatusFilter] =
    useState("All");
  const [tenantPlanFilter, setTenantPlanFilter] =
    useState("All");

  const [tenantFormOpen, setTenantFormOpen] =
    useState(false);
  const [tenantFormMode, setTenantFormMode] =
    useState("create");

  const tenantAdminNames = [
    "Jeya Karthiga",
    "Arun Balaji",
    "Priyanga",
    "Mounika",
  ];

  const [tenantDraft, setTenantDraft] = useState({
    ...DEFAULT_TENANT,
  });

  const [tenantSaving, setTenantSaving] =
    useState(false);

  const [tenantActionError, setTenantActionError] =
    useState("");

  const [tenantActionSuccess, setTenantActionSuccess] =
    useState("");

  // ----------------------------------------
  // Tenant statistics
  // ----------------------------------------

  const totalTenants = tenants.length;

  const activeTenants = tenants.filter(
    (tenant) =>
      String(tenant.status || "").toLowerCase() ===
      "active"
  ).length;

  const pendingTenants = tenants.filter(
    (tenant) =>
      String(tenant.status || "").toLowerCase() ===
      "pending"
  ).length;

  const blockedTenants = tenants.filter(
    (tenant) =>
      String(tenant.status || "").toLowerCase() ===
      "blocked"
  ).length;

  // ----------------------------------------
  // Fetch tenants using CLIENTLY session
  // ----------------------------------------

  async function refreshTenantData(showLoader = false) {
    if (showLoader) {
      setTenantsLoading(true);
    }

    try {
      const result = await apiFetch(TENANTS_API);

      if (result.success === false) {
        throw new Error(
          result.message || "Unable to load tenants"
        );
      }

      const records = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.tenants)
          ? result.tenants
          : [];

      const formattedTenants = records.map((tenant) => ({
        ...tenant,

        company:
          tenant.company ||
          tenant.organization ||
          tenant.name ||
          "Unnamed tenant",

        admin:
          tenant.admin ||
          tenant.ownerName ||
          tenant.email ||
          "—",

        plan: tenant.plan || "Starter",

        environment:
          tenant.environment || "Production",

        status: tenant.status || "Pending",

        date: formatDate(
          tenant.date || tenant.createdAt
        ),

        originalDate:
          tenant.date || tenant.createdAt || null,
      }));

      setTenants(formattedTenants);
      setTenantError("");
    } catch (error) {
      console.error(
        "Error fetching tenants:",
        error
      );

      setTenantError(
        error.message ||
          "Unable to load tenants. Please try again."
      );
    } finally {
      setTenantsLoading(false);
    }
  }

  // ----------------------------------------
  // Initial loading and automatic refresh
  // ----------------------------------------

  useEffect(() => {
    const firstLoad = window.setTimeout(() => {
      refreshTenantData(true);
    }, 0);

    const refreshTimer = window.setInterval(() => {
      refreshTenantData(false);
    }, 30000);

    return () => {
      window.clearTimeout(firstLoad);
      window.clearInterval(refreshTimer);
    };
  }, []);

  // ----------------------------------------
  // Search and filters
  // ----------------------------------------

  const filteredTenants = tenants.filter((tenant) => {
    const query = tenantQuery.trim().toLowerCase();

    const matchesQuery =
      !query ||
      [
        tenant.company,
        tenant.admin,
        tenant.email,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );

    const matchesStatus =
      tenantStatusFilter === "All" ||
      String(tenant.status || "").toLowerCase() ===
        tenantStatusFilter.toLowerCase();

    const matchesPlan =
      tenantPlanFilter === "All" ||
      String(tenant.plan || "").toLowerCase() ===
        tenantPlanFilter.toLowerCase();

    return (
      matchesQuery &&
      matchesStatus &&
      matchesPlan
    );
  });

  // ----------------------------------------
  // Open create/edit tenant form
  // ----------------------------------------

  function openTenantForm(mode, tenant = null) {
    setTenantFormMode(mode);
    setTenantActionError("");
    setTenantActionSuccess("");

    if (tenant) {
      setTenantDraft({
        company: tenant.company || "",
        admin: tenant.admin || "",
        email: tenant.email || "",
        plan: tenant.plan || "Starter",
        environment:
          tenant.environment || "Production",
        status: tenant.status || "Pending",
        date: inputDate(
          tenant.originalDate || tenant.date
        ),
      });
    } else {
      setTenantDraft({
        ...DEFAULT_TENANT,
        date: new Date().toISOString().slice(0, 10),
      });
    }

    setSelectedTenant(
      mode === "edit" ? tenant : null
    );

    setTenantFormOpen(true);
  }

  // ----------------------------------------
  // Create or update tenant
  // ----------------------------------------

  async function saveTenant(event) {
    event.preventDefault();

    setTenantSaving(true);
    setTenantActionError("");
    setTenantActionSuccess("");

    try {
      const editing =
        tenantFormMode === "edit" &&
        Boolean(selectedTenant?._id);

      const url = editing
        ? `${TENANTS_API}/${selectedTenant._id}`
        : TENANTS_API;

      const result = await apiFetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tenantDraft),
      });

      if (result.success === false) {
        throw new Error(
          result.message || "Unable to save tenant"
        );
      }

      await refreshTenantData(false);

      setTenantFormOpen(false);
      setSelectedTenant(null);

      setTenantActionSuccess(
        editing
          ? "Tenant updated successfully."
          : "Tenant created successfully."
      );
    } catch (error) {
      console.error("Save tenant error:", error);

      setTenantActionError(
        error.message || "Unable to save tenant."
      );
    } finally {
      setTenantSaving(false);
    }
  }

  // ----------------------------------------
  // Change tenant status
  // ----------------------------------------

  async function updateTenantStatus(tenant, status) {
    setTenantActionError("");

    try {
      const result = await apiFetch(
        `${TENANTS_API}/${tenant._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (result.success === false) {
        throw new Error(
          result.message || "Status update failed"
        );
      }

      await refreshTenantData(false);

      setSelectedTenant(result.data || tenant);

      setTenantActionSuccess(
        `${tenant.company} status updated to ${status}.`
      );

      setTenantActionError("");
    } catch (error) {
      console.error(
        "Update tenant status error:",
        error
      );

      setTenantActionError(
        error.message || "Status update failed."
      );
    }
  }

  // ----------------------------------------
  // Delete tenant
  // ----------------------------------------

  async function deleteTenantRecord(tenant) {
    const confirmed = window.confirm(
      `Delete ${tenant.company}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setTenantActionError("");

    try {
      const result = await apiFetch(
        `${TENANTS_API}/${tenant._id}`,
        {
          method: "DELETE",
        }
      );

      if (result.success === false) {
        throw new Error(
          result.message || "Tenant deletion failed"
        );
      }

      setSelectedTenant(null);

      await refreshTenantData(false);

      setTenantActionSuccess(
        "Tenant deleted successfully."
      );

      setTenantActionError("");
    } catch (error) {
      console.error(
        "Delete tenant error:",
        error
      );

      setTenantActionError(
        error.message || "Tenant deletion failed."
      );
    }
  }

  // ----------------------------------------
  // Return existing hook interface
  // ----------------------------------------

  return {
    tenants,
    tenantError,
    tenantsLoading,

    selectedTenant,
    setSelectedTenant,

    tenantQuery,
    setTenantQuery,

    tenantStatusFilter,
    setTenantStatusFilter,

    tenantPlanFilter,
    setTenantPlanFilter,

    tenantFormOpen,
    setTenantFormOpen,

    tenantFormMode,

    tenantDraft,
    setTenantDraft,

    tenantSaving,

    tenantActionError,
    tenantActionSuccess,

    tenantAdminNames,

    totalTenants,
    activeTenants,
    pendingTenants,
    blockedTenants,

    filteredTenants,

    refreshTenantData,
    openTenantForm,
    saveTenant,
    updateTenantStatus,
    deleteTenantRecord,
  };
}
