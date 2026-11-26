import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Phone, PlayCircle, UserRound } from "lucide-react";
import { opsCare } from "../../../customer-care/careApi";
import { StatusBadge, Timeline } from "../../../customer-care/CareParts";
import { formatDate } from "../../../customer-care/careFormat";
import "./ServiceJobs.css";

export default function ServiceJobDetail() {
  const { id } = useParams();
  const [data, setData] = useState({ id: null, error: "", job: null });
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;
    opsCare
      .getJob(id)
      .then((result) => {
        if (active) setData({ id, error: "", job: result.serviceRequest });
      })
      .catch((err) => {
        if (active) setData({ id, error: err?.message || "Unable to load this job.", job: null });
      });
    return () => {
      active = false;
    };
  }, [id]);

  const loading = data.id !== id;
  const job = loading ? null : data.job;

  async function moveTo(status) {
    if (status === "Completed" && !note.trim()) {
      setNotice({ type: "error", text: "Add a short note about the work done before completing." });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const result = await opsCare.updateStatus(id, { status, note: note.trim() || undefined });
      const fresh = await opsCare.getJob(id);
      setData({ id, error: "", job: fresh.serviceRequest });
      setNote("");
      setNotice({ type: "success", text: result.message });
    } catch (err) {
      setNotice({ type: "error", text: err?.message || "Unable to update this job." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="ops-job-message">Loading service job...</div>;

  if (!job) {
    return (
      <div className="ops-job-message">
        <h2>Job unavailable</h2>
        <p>{data.error || "Job not found."}</p>
        <Link to="/operations/service-jobs">Back to Service Jobs</Link>
      </div>
    );
  }

  const nextStep = job.status === "Assigned" ? "In Progress" : job.status === "In Progress" ? "Completed" : null;

  return (
    <div className="ops-job-page">
      <Link className="ops-job-back" to="/operations/service-jobs"><ArrowLeft size={17} /> Back to Service Jobs</Link>

      <header className="ops-job-header">
        <div>
          <span className="ops-job-number">{job.requestNumber}</span>
          <h1>{job.serviceType}{job.productName ? ` · ${job.productName}` : ""}</h1>
          <StatusBadge status={job.status} />
        </div>
      </header>

      {notice && <div role={notice.type === "error" ? "alert" : "status"} className={`ops-job-alert ops-job-alert--${notice.type}`}>{notice.text}</div>}

      <div className="ops-job-grid">
        <main className="ops-job-left">
          <section className="ops-job-card">
            <h2>Customer's description</h2>
            <p className="ops-job-text">{job.description || "No description provided."}</p>
          </section>

          {nextStep && (
            <section className="ops-job-card">
              <h2>{nextStep === "In Progress" ? "Start this job" : "Complete this job"}</h2>
              <label htmlFor="ops-job-note">{nextStep === "Completed" ? "Work done (required)" : "Note (optional)"}</label>
              <textarea
                id="ops-job-note"
                rows={4}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={nextStep === "Completed" ? "e.g. Replaced filter and tested water flow" : "e.g. On the way, reaching by 11 AM"}
                disabled={saving}
              />
              <div className="ops-job-actions">
                {nextStep === "In Progress" ? (
                  <button type="button" onClick={() => moveTo("In Progress")} disabled={saving}>
                    <PlayCircle size={17} /> {saving ? "Saving..." : "Start job"}
                  </button>
                ) : (
                  <button type="button" onClick={() => moveTo("Completed")} disabled={saving}>
                    <CheckCircle2 size={17} /> {saving ? "Saving..." : "Mark completed"}
                  </button>
                )}
              </div>
            </section>
          )}

          <section className="ops-job-card">
            <h2>Timeline</h2>
            <Timeline updates={job.updates} />
          </section>
        </main>

        <aside className="ops-job-right">
          <section className="ops-job-card">
            <h2><UserRound size={18} /> Customer</h2>
            <div className="ops-job-info">
              <strong>{job.customer?.name || "—"}</strong>
              <span>{job.customer?.customerCode || ""}</span>
              {job.customer?.phone && <a href={`tel:${job.customer.phone}`}><Phone size={14} /> {job.customer.phone}</a>}
            </div>
          </section>
          <section className="ops-job-card">
            <h2><MapPin size={18} /> Visit address</h2>
            <p className="ops-job-text">{job.address || job.customer?.city || "—"}</p>
          </section>
          <section className="ops-job-card">
            <h2><CalendarDays size={18} /> Dates</h2>
            <div className="ops-job-dates">
              <p><span>Requested</span><strong>{formatDate(job.createdAt)}</strong></p>
              <p><span>Customer prefers</span><strong>{formatDate(job.preferredDate)}</strong></p>
              <p><span>Visit date</span><strong>{formatDate(job.scheduledDate)}</strong></p>
              <p><span>Completed</span><strong>{formatDate(job.completedAt)}</strong></p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
