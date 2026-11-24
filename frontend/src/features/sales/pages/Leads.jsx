
import { useState, useEffect } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import api from "../services/api";

function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/sales/leads");

      setLeads(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Leads API error:", err);
      setError(err.message || "Unable to load leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const name = lead.name || "";
    const company = lead.company || "";
    const contact = `${lead.email || ""} ${lead.phone || ""}`;

    const matchesSearch =
      `${name} ${company} ${contact}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Leads</h1>
          <p>Manage and follow up with your assigned leads.</p>
        </div>

       
      </div>

      <div className="leads-card">
        <div className="leads-card-header">
          <div>
            <h2>Your Leads</h2>
            <p className="section-description">
              Leads assigned to you
            </p>
          </div>

          <div className="lead-count">
            {filteredLeads.length} Leads
          </div>
        </div>

        <div className="lead-toolbar">
          <div className="lead-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-button"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Demo">Demo</option>
            <option value="Proposal">Proposal</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        {error && (
          <div role="alert" style={{ color: "#b42318", margin: "12px" }}>
            {error}

            <button
              type="button"
              className="filter-button"
              onClick={fetchLeads}
              style={{ marginLeft: "12px" }}
            >
              Retry
            </button>
          </div>
        )}

        <div className="table-container">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Source</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Last Contacted</th>
                <th>Next Follow-up</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9">Loading leads...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9">Unable to display leads.</td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    {searchTerm || statusFilter !== "All"
                      ? "No matching leads found."
                      : "No leads available."}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const name = lead.name || "Unnamed";
                  const company = lead.company || "—";
                  const contact =
                    [lead.email, lead.phone].filter(Boolean).join(" / ") || "—";
                  const source = lead.source || "—";
                  const status = lead.status || "New";

                  return (
                    <tr key={lead._id}>
                      <td>
                        <div className="lead-name">
                          <div className="lead-avatar">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <strong>{name}</strong>
                        </div>
                      </td>

                      <td>{company}</td>
                      <td>{contact}</td>
                      <td>{source}</td>

                      <td>
                        <span
                          className={`lead-status status-${String(status)
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>—</td>
                      <td>—</td>
                      <td>—</td>

                      <td>
                        <button
                          type="button"
                          className="action-button"
                          aria-label={`More options for ${name}`}
                          title="More options"
                          onClick={() =>
                            window.alert(
                              "Lead actions will be added after confirming the assignment workflow."
                            )
                          }
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Leads;
