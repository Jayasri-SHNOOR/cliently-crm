import { useEffect, useState } from "react";

export default function useTenants() {
  const [tenants, setTenants] = useState([]);
  const [tenantError, setTenantError] = useState("");
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantQuery, setTenantQuery] = useState("");
  const [tenantStatusFilter, setTenantStatusFilter] = useState("All");
  const [tenantPlanFilter, setTenantPlanFilter] = useState("All");
  const [tenantFormOpen, setTenantFormOpen] = useState(false);
  const [tenantFormMode, setTenantFormMode] = useState("create");
  const tenantAdminNames = ["Jeya Karthiga", "Arun Balaji", "Priyanga", "Mounika"];
  const [tenantDraft, setTenantDraft] = useState({ company: "", admin: "Mounika", email: "", plan: "Starter", environment: "Production", status: "Pending", date: new Date().toISOString().slice(0, 10) });
  const [tenantSaving, setTenantSaving] = useState(false);
  const [tenantActionError, setTenantActionError] = useState("");
  const [tenantActionSuccess, setTenantActionSuccess] = useState("");

  // Tenant summary counts are calculated from the records returned by the backend API.
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(
    (tenant) => String(tenant.status || "").toLowerCase() === "active"
  ).length;
  const pendingTenants = tenants.filter(
    (tenant) => String(tenant.status || "").toLowerCase() === "pending"
  ).length;
  const blockedTenants = tenants.filter(
    (tenant) => String(tenant.status || "").toLowerCase() === "blocked"
  ).length;

  async function refreshTenantData(showLoader = false) {
    if (showLoader) setTenantsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/super-admin/tenants");
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(result.message || `Request failed: ${response.status}`);
      }
      const records = Array.isArray(result.data) ? result.data : Array.isArray(result.tenants) ? result.tenants : [];
      const formattedTenants = records.map((tenant) => ({
        ...tenant,
        company: tenant.company || tenant.organization || tenant.name || "Unnamed tenant",
        admin: tenant.admin || tenant.ownerName || tenant.email || "—",
        plan: tenant.plan || "Starter",
        environment: tenant.environment || "Production",
        status: tenant.status || "Pending",
        date: tenant.date ? new Date(tenant.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
      }));
      setTenants(formattedTenants);
      setTenantError("");
    } catch (error) {
      console.error("Error fetching tenants:", error);
      setTenantError(error.message || "Unable to load tenants. Check that the backend is running.");
    } finally {
      setTenantsLoading(false);
    }
  }

  useEffect(() => {
    refreshTenantData(true);
    const refreshTimer = window.setInterval(() => refreshTenantData(false), 30000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const filteredTenants = tenants.filter((tenant) => {
    const query = tenantQuery.trim().toLowerCase();
    const matchesQuery = !query || [tenant.company, tenant.admin, tenant.email].some((value) => String(value || "").toLowerCase().includes(query));
    const matchesStatus = tenantStatusFilter === "All" || String(tenant.status).toLowerCase() === tenantStatusFilter.toLowerCase();
    const matchesPlan = tenantPlanFilter === "All" || String(tenant.plan).toLowerCase() === tenantPlanFilter.toLowerCase();
    return matchesQuery && matchesStatus && matchesPlan;
  });

  function openTenantForm(mode, tenant = null) {
    setTenantFormMode(mode);
    setTenantActionError("");
    setTenantActionSuccess("");
    setTenantDraft(tenant ? {
      company: tenant.company || "", admin: tenant.admin || "", email: tenant.email || "",
      plan: tenant.plan || "Starter", environment: tenant.environment || "Production",
      status: tenant.status || "Pending",
      date: tenant.date && tenant.date !== "—" ? new Date(tenant.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    } : { company: "", admin: "Mounika", email: "", plan: "Starter", environment: "Production", status: "Pending", date: new Date().toISOString().slice(0, 10) });
    setSelectedTenant(mode === "edit" ? tenant : null);
    setTenantFormOpen(true);
  }

  async function saveTenant(event) {
    event.preventDefault();
    setTenantSaving(true);
    setTenantActionError("");
    setTenantActionSuccess("");
    try {
      const editing = tenantFormMode === "edit" && selectedTenant?._id;
      const response = await fetch(`http://localhost:5000/api/super-admin/tenants${editing ? `/${selectedTenant._id}` : ""}`, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenantDraft),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.message || "Unable to save tenant");
      await refreshTenantData(false);
      setTenantFormOpen(false);
      setSelectedTenant(null);
      setTenantActionSuccess(editing ? "Tenant updated successfully." : "Tenant created successfully.");
    } catch (error) {
      setTenantActionError(error.message || "Unable to save tenant.");
    } finally {
      setTenantSaving(false);
    }
  }

  async function updateTenantStatus(tenant, status) {
    try {
      const response = await fetch(`http://localhost:5000/api/super-admin/tenants/${tenant._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.message || "Status update failed");
      await refreshTenantData(false);
      setSelectedTenant(result.data || tenant);
      setTenantActionSuccess(`${tenant.company} status updated to ${status}.`);
      setTenantActionError("");
    } catch (error) { setTenantActionError(error.message); }
  }

  async function deleteTenantRecord(tenant) {
    if (!window.confirm(`Delete ${tenant.company}? This action cannot be undone.`)) return;
    try {
      const response = await fetch(`http://localhost:5000/api/super-admin/tenants/${tenant._id}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.message || "Tenant deletion failed");
      setSelectedTenant(null);
      await refreshTenantData(false);
      setTenantActionSuccess("Tenant deleted successfully.");
      setTenantActionError("");
    } catch (error) { setTenantActionError(error.message); }
  }
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
    deleteTenantRecord
  };

}