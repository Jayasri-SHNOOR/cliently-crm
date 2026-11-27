
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import "./UsageMonitoring.css";

export default function UsageMonitoring() {
  const [overview, setOverview] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const overviewResult = await apiFetch(
        "/api/super-admin/usage/overview"
      );

      const tenantResult = await apiFetch(
        "/api/super-admin/usage/tenants"
      );

      setOverview(overviewResult?.data || null);

      setTenants(
        Array.isArray(tenantResult?.data)
          ? tenantResult.data
          : []
      );
    } catch (err) {
      console.error("Usage Monitoring Error:", err);
      setError(
        err.message || "Unable to load usage data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, []);

  const stats = overview?.tenants || {
    total: 0,
    active: 0,
    pending: 0,
    blocked: 0,
  };

  const plans = Array.isArray(overview?.plans)
    ? overview.plans
    : [];

  const subscriptions = Array.isArray(
    overview?.subscriptions?.statuses
  )
    ? overview.subscriptions.statuses
    : [];

  const filteredTenants = tenants.filter((tenant) => {
    const text = [
      tenant.company,
      tenant.admin,
      tenant.email,
      tenant.plan,
      tenant.status,
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div className="usage-monitoring">
      <div className="usage-monitoring-header">
        <div>
          <h2>Usage Monitoring</h2>
          <p>
            Monitor tenant accounts and subscription
            information.
          </p>
        </div>

        <button
          type="button"
          className="usage-monitoring-refresh"
          onClick={loadData}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Data"}
        </button>
      </div>

      {error && (
        <div className="usage-error">
          <strong>Unable to load data: </strong>
          {error}
        </div>
      )}

      {loading && !overview ? (
        <div className="usage-loading">
          Loading Usage Monitoring...
        </div>
      ) : (
        <>
          <div className="usage-monitoring-stats">
            <div className="usage-monitoring-card">
              <span>Total Tenants</span>
              <strong>{stats.total}</strong>
              <small>Registered tenant records</small>
            </div>

            <div className="usage-monitoring-card">
              <span>Active Tenants</span>
              <strong>{stats.active}</strong>
              <small>Active tenant accounts</small>
            </div>

            <div className="usage-monitoring-card">
              <span>Pending Tenants</span>
              <strong>{stats.pending}</strong>
              <small>Awaiting activation</small>
            </div>

            <div className="usage-monitoring-card">
              <span>Blocked Tenants</span>
              <strong>{stats.blocked}</strong>
              <small>Restricted accounts</small>
            </div>
          </div>

          <div className="usage-distribution-grid">
            <div className="usage-distribution-card">
              <h3>Tenant Plan Distribution</h3>

              {plans.length === 0 ? (
                <p>No plan data available.</p>
              ) : (
                plans.map((plan) => (
                  <div
                    className="usage-distribution-item"
                    key={plan.name}
                  >
                    <div className="usage-distribution-label">
                      <span>{plan.name}</span>
                      <strong>{plan.count}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="usage-distribution-card">
              <h3>Subscription Status</h3>

              {subscriptions.length === 0 ? (
                <p>No subscription data available.</p>
              ) : (
                subscriptions.map((item) => (
                  <div
                    className="usage-distribution-item"
                    key={item.name}
                  >
                    <div className="usage-distribution-label">
                      <span>{item.name}</span>
                      <strong>{item.count}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <section className="usage-monitoring-table-card">
            <div className="usage-monitoring-table-header">
              <div>
                <h3>Tenant Usage Overview</h3>
                <p>
                  Showing {filteredTenants.length} tenant
                  records
                </p>
              </div>

              <div className="usage-monitoring-search">
                <input
                  type="search"
                  placeholder="Search tenants..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="usage-table-scroll">
              <table className="usage-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Admin</th>
                    <th>Plan</th>
                    <th>Environment</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant._id}>
                      <td>{tenant.company}</td>
                      <td>{tenant.admin}</td>
                      <td>{tenant.plan}</td>
                      <td>{tenant.environment}</td>
                      <td>
                        <span className="usage-status-badge">
                          {tenant.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredTenants.length === 0 && (
                <div className="usage-empty">
                  No tenant records found.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
