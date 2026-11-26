import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, RefreshCw, Wrench } from "lucide-react";
import { opsCare } from "../../../customer-care/careApi";
import { StatusBadge } from "../../../customer-care/CareParts";
import { formatDate } from "../../../customer-care/careFormat";
import "../Tickets/TicketsList.css";
import "./ServiceJobs.css";

const VIEWS = ["All", "Assigned", "In Progress", "Completed"];

export default function ServiceJobsList() {
  const [status, setStatus] = useState("All");
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState({ loading: true, error: "", jobs: [] });

  useEffect(() => {
    let active = true;
    opsCare
      .listJobs(status)
      .then((result) => {
        if (active) setData({ loading: false, error: "", jobs: result.serviceRequests || [] });
      })
      .catch((err) => {
        if (active) setData({ loading: false, error: err?.message || "Unable to load service jobs.", jobs: [] });
      });
    return () => {
      active = false;
    };
  }, [status, reloadKey]);

  return (
    <div className="ops-tickets-page">
      <header className="ops-tickets-heading">
        <div>
          <div className="ops-tickets-title-row">
            <span className="ops-tickets-title-icon"><Wrench size={22} /></span>
            <div>
              <span className="ops-tickets-eyebrow">OPERATIONS / CUSTOMER SERVICE</span>
              <h1>Service Jobs</h1>
            </div>
          </div>
          <p>Customer service requests assigned to you. Start the job when you begin, and complete it with a note.</p>
        </div>
        <div className="ops-tickets-header-actions">
          <button type="button" className="ops-tickets-refresh" onClick={() => setReloadKey((v) => v + 1)} disabled={data.loading}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </header>

      <div className="ops-tickets-status-tabs">
        {VIEWS.map((value) => (
          <button type="button" key={value} className={status === value ? "active" : ""} onClick={() => setStatus(value)}>
            {value === "All" ? "All Jobs" : value}
          </button>
        ))}
      </div>

      <section className="ops-tickets-table-wrap">
        <div className="ops-tickets-table-header">
          <div>
            <h2>My Service Jobs</h2>
            <p>Sorted by visit date</p>
          </div>
          <span className="ops-tickets-count">{data.jobs.length} Jobs</span>
        </div>

        {data.loading ? (
          <div className="ops-tickets-message">Loading service jobs...</div>
        ) : data.error ? (
          <div className="ops-tickets-message ops-tickets-error" role="alert">
            {data.error} <button type="button" onClick={() => setReloadKey((v) => v + 1)}>Retry</button>
          </div>
        ) : data.jobs.length === 0 ? (
          <div className="ops-tickets-empty">
            <Wrench size={32} />
            <h3>No service jobs</h3>
            <p>Jobs appear here when a sales executive or manager assigns them to you.</p>
          </div>
        ) : (
          <div className="ops-tickets-table-scroll">
            <table className="ops-tickets-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Visit date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="ops-ticket-main">
                        <Link to={`/operations/service-jobs/${job.id}`} className="ops-ticket-number">{job.requestNumber}</Link>
                        <span className="ops-ticket-subject">{formatDate(job.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="ops-ticket-customer">
                        <strong>{job.customer?.name || "—"}</strong>
                        <small>{[job.customer?.phone, job.customer?.city].filter(Boolean).join(" · ")}</small>
                      </div>
                    </td>
                    <td>
                      <div className="ops-ticket-customer">
                        <strong>{job.serviceType}</strong>
                        <small>{job.productName || "General"}</small>
                      </div>
                    </td>
                    <td className="ops-ticket-date">{formatDate(job.scheduledDate || job.preferredDate)}</td>
                    <td><StatusBadge status={job.status} /></td>
                    <td>
                      <Link className="ops-ticket-view" to={`/operations/service-jobs/${job.id}`}>View <ChevronRight size={14} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
