
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  Eye,
  X,
  ShieldAlert,
  ScrollText,
  Users,
  Clock3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { apiFetch } from "../../../lib/api";
import "./AuditLogs.css";

const API_PATH = "/api/super-admin/security-logs";
const PAGE_SIZE = 20;

const CATEGORIES = [
  "All Categories",
  "Authentication",
  "Authorization",
  "Data Access",
  "Configuration",
  "System",
  "General",
];

const SEVERITIES = [
  "All Severities",
  "Low",
  "Medium",
  "High",
  "Critical",
];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}

function formatUTC(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toISOString();
}

function csvValue(value) {
  let text = String(value ?? "");

  // Prevent spreadsheet formula execution.
  if (/^\s*[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function getSeverityClass(severity) {
  return ["Low", "Medium", "High", "Critical"]
    .includes(severity)
    ? severity.toLowerCase()
    : "low";
}

function buildQuery(filters, page) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(PAGE_SIZE));

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.category !== "All Categories") {
    params.set("category", filters.category);
  }

  if (filters.severity !== "All Severities") {
    params.set("severity", filters.severity);
  }

  if (filters.fromDate) {
    params.set(
      "from",
      new Date(
        `${filters.fromDate}T00:00:00`
      ).toISOString()
    );
  }

  if (filters.toDate) {
    params.set(
      "to",
      new Date(
        `${filters.toDate}T23:59:59.999`
      ).toISOString()
    );
  }

  return params.toString();
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="audit-stat">
      <div className="audit-stat-top">
        <span>{title}</span>
        <Icon size={20} aria-hidden="true" />
      </div>

      <strong>{value}</strong>

      <small
        style={{
          display: "block",
          marginTop: 7,
          color: "#72847d",
          fontSize: 12,
        }}
      >
        {subtitle}
      </small>
    </div>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [severity, setSeverity] = useState("All Severities");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [lastUpdated, setLastUpdated] = useState(null);

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const detailRequestRef = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      category,
      severity,
      fromDate,
      toDate,
    }),
    [
      debouncedSearch,
      category,
      severity,
      fromDate,
      toDate,
    ]
  );

  const query = useMemo(
    () => buildQuery(filters, page),
    [filters, page]
  );

  useEffect(() => {
    let active = true;

    async function loadLogs() {
      setLoading(true);
      setError("");

      try {
        const result = await apiFetch(
          `${API_PATH}?${query}`
        );

        if (
          !result?.success ||
          !Array.isArray(result.data)
        ) {
          throw new Error(
            "Unexpected audit API response"
          );
        }

        if (!active) return;

        setLogs(result.data);

        setPagination({
          page: result.pagination?.page ?? page,
          limit: result.pagination?.limit ?? PAGE_SIZE,
          total:
            result.pagination?.total ??
            result.data.length,
          totalPages:
            result.pagination?.totalPages ?? 1,
        });

        setLastUpdated(new Date());
      } catch (err) {
        if (!active) return;

        setLogs([]);
        setPagination({
          page,
          limit: PAGE_SIZE,
          total: 0,
          totalPages: 0,
        });

        setError(
          err.message || "Unable to load audit logs"
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLogs();

    return () => {
      active = false;
    };
  }, [query, refreshKey, page]);

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategory("All Categories");
    setSeverity("All Severities");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const openDetails = async (log) => {
    const requestId = ++detailRequestRef.current;

    setSelected(log);
    setDetailLoading(true);
    setDetailError("");

    try {
      const result = await apiFetch(
        `${API_PATH}/${encodeURIComponent(log._id)}`
      );

      if (!result?.success || !result.data) {
        throw new Error(
          "Unable to retrieve event details"
        );
      }

      if (requestId === detailRequestRef.current) {
        setSelected(result.data);
      }
    } catch (err) {
      if (requestId === detailRequestRef.current) {
        setDetailError(
          err.message || "Unable to retrieve details"
        );
      }
    } finally {
      if (requestId === detailRequestRef.current) {
        setDetailLoading(false);
      }
    }
  };

  const closeDetails = () => {
    detailRequestRef.current += 1;
    setSelected(null);
    setDetailError("");
    setDetailLoading(false);
  };

  useEffect(() => {
    if (!selected) return;

    function handleEscape(event) {
      if (event.key === "Escape") {
        closeDetails();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [selected]);

  const exportCSV = () => {
    if (loading || error || logs.length === 0) return;

    setExporting(true);
    setExportError("");

    try {
      // Current page only. Full-history export must
      // be implemented through a permission-checked
      // backend export endpoint.
      const headers = [
        "Event ID",
        "Event",
        "Category",
        "Severity",
        "Actor",
        "Actor ID",
        "Tenant ID",
        "Action",
        "Resource Type",
        "Resource ID",
        "Correlation ID",
        "Details",
        "Occurred At UTC",
      ];

      const rows = logs.map((log) => [
        log.eventId || log._id,
        log.event,
        log.category,
        log.severity,
        log.actor,
        log.actorId,
        log.tenantId,
        log.action,
        log.resourceType,
        log.resourceId,
        log.correlationId,
        log.details,
        formatUTC(log.occurredAt),
      ]);

      const content = [
        headers.map(csvValue).join(","),
        ...rows.map((row) =>
          row.map(csvValue).join(",")
        ),
      ].join("\r\n");

      const blob = new Blob(
        ["\uFEFF", content],
        {
          type: "text/csv;charset=utf-8;",
        }
      );

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download =
        `cliently-audit-logs-page-${page}.csv`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(
        err.message || "CSV export failed"
      );
    } finally {
      setExporting(false);
    }
  };

  const totalEvents = pagination.total;

  const criticalOnPage = logs.filter(
    (log) => log.severity === "Critical"
  ).length;

  const uniqueActorsOnPage = new Set(
    logs
      .map((log) => log.actorId || log.actor)
      .filter(Boolean)
  ).size;

  const loadedAt = lastUpdated ? lastUpdated.getTime() : 0;

  const last24HoursOnPage = logs.filter((log) => {
    const timestamp = new Date(
      log.occurredAt
    ).getTime();

    return (
      Number.isFinite(timestamp) &&
      timestamp >= loadedAt - 86400000 &&
      timestamp <= loadedAt
    );
  }).length;

  const totalPages = Math.max(
    1,
    pagination.totalPages || 1
  );

  const detailFields = selected
    ? [
        ["Event ID", selected.eventId || selected._id],
        ["Event", selected.event],
        ["Category", selected.category],
        ["Severity", selected.severity],
        ["Actor", selected.actor],
        ["Actor ID", selected.actorId],
        ["Tenant ID", selected.tenantId],
        ["Action", selected.action],
        ["Resource Type", selected.resourceType],
        ["Resource ID", selected.resourceId],
        ["Correlation ID", selected.correlationId],
        ["Occurred At (UTC)", formatUTC(selected.occurredAt)],
      ]
    : [];

  return (
    <div className="audit-page">
      <div className="audit-toolbar">
        <div>
          <h2>Platform Activity Overview</h2>
          <p>
            Investigate security events and
            administrative activity across CLIENTLY.
          </p>
        </div>

        <div className="audit-toolbar-actions">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            type="button"
            className="audit-primary"
            onClick={exportCSV}
            disabled={
              loading ||
              exporting ||
              Boolean(error) ||
              logs.length === 0
            }
            title="Export the currently displayed page"
          >
            <Download size={17} />
            {exporting
              ? "Exporting..."
              : "Export Current Page"}
          </button>
        </div>
      </div>

      <div className="audit-stats">
        <StatCard
          title="Total Events"
          value={loading || error ? "—" : totalEvents}
          subtitle="Across matching records"
          icon={ScrollText}
        />

        <StatCard
          title="Critical Events"
          value={
            loading || error
              ? "—"
              : criticalOnPage
          }
          subtitle="On current page"
          icon={ShieldAlert}
        />

        <StatCard
          title="Unique Actors"
          value={
            loading || error
              ? "—"
              : uniqueActorsOnPage
          }
          subtitle="On current page"
          icon={Users}
        />

        <StatCard
          title="Last 24 Hours"
          value={
            loading || error
              ? "—"
              : last24HoursOnPage
          }
          subtitle="On current page"
          icon={Clock3}
        />
      </div>

      <div className="audit-panel">
        <div className="audit-filter-grid">
          <div className="audit-search">
            <Search
              size={18}
              aria-hidden="true"
            />

            <input
              type="search"
              placeholder="Search events, actors or details..."
              aria-label="Search audit logs"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            aria-label="Filter category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            {CATEGORIES.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter severity"
            value={severity}
            onChange={(event) => {
              setSeverity(event.target.value);
              setPage(1);
            }}
          >
            {SEVERITIES.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <input
            type="date"
            aria-label="Start date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => {
              setFromDate(event.target.value);
              setPage(1);
            }}
          />

          <input
            type="date"
            aria-label="End date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => {
              setToDate(event.target.value);
              setPage(1);
            }}
          />

          <button
            type="button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>

        <div className="audit-results-header">
          <span>
            {loading
              ? "Loading audit records..."
              : error
              ? "Unable to load records"
              : `${totalEvents} matching records`}
          </span>

          <span>
            Last updated:{" "}
            {lastUpdated
              ? formatDate(lastUpdated)
              : "Not yet updated"}
          </span>
        </div>

        {exportError && (
          <div
            className="audit-error"
            role="alert"
          >
            {exportError}
          </div>
        )}

        {loading ? (
          <div
            className="audit-empty"
            role="status"
          >
            <RefreshCw size={26} />
            <p>Loading audit records...</p>
          </div>
        ) : error ? (
          <div
            className="audit-error"
            role="alert"
          >
            <ShieldAlert size={28} />

            <p>{error}</p>

            <button
              type="button"
              onClick={refresh}
            >
              Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="audit-empty">
            <ScrollText size={30} />

            <h3>No audit events found</h3>

            <p>
              No events match the selected filters.
            </p>
          </div>
        ) : (
          <>
            <div className="audit-table-scroll">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Event</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td>
                        {formatDate(log.occurredAt)}
                      </td>

                      <td>
                        <span className="audit-event">
                          {log.event || "—"}
                        </span>
                      </td>

                      <td>
                        {log.category || "General"}
                      </td>

                      <td>
                        <span
                          className={`audit-severity ${getSeverityClass(
                            log.severity
                          )}`}
                        >
                          {log.severity || "Low"}
                        </span>
                      </td>

                      <td>
                        {log.actor || "System"}
                      </td>

                      <td>
                        {log.action || "—"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="audit-view"
                          onClick={() =>
                            openDetails(log)
                          }
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="audit-pagination">
              <span>
                Page {page} of {totalPages}
              </span>

              <div>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((value) =>
                      Math.max(1, value - 1)
                    )
                  }
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((value) =>
                      Math.min(
                        totalPages,
                        value + 1
                      )
                    )
                  }
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selected && (
        <div
          className="audit-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >
          <div
            className="audit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-detail-title"
          >
            <div className="audit-modal-header">
              <div>
                <h3 id="audit-detail-title">
                  Audit Event Details
                </h3>

                <p>
                  Recorded security and
                  administrative activity
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <p>Loading event details...</p>
            ) : detailError ? (
              <div
                className="audit-error"
                role="alert"
              >
                {detailError}
              </div>
            ) : (
              <>
                <dl className="audit-detail-grid">
                  {detailFields.map(
                    ([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value || "—"}</dd>
                      </div>
                    )
                  )}
                </dl>

                <h4>Event Description</h4>

                <div className="audit-details-json">
                  {selected.details ||
                    "No additional description recorded."}
                </div>

                {selected.metadata &&
                  Object.keys(
                    selected.metadata
                  ).length > 0 && (
                    <>
                      <h4>Additional Metadata</h4>

                      <pre className="audit-details-json">
                        {JSON.stringify(
                          selected.metadata,
                          null,
                          2
                        )}
                      </pre>
                    </>
                  )}
              </>
            )}

            <div className="audit-modal-footer">
              <button
                type="button"
                onClick={closeDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
