import PageHeader from "../../../shared/ui/PageHeader";
import Panel from "../../../shared/ui/Panel";
import PageState from "../../../shared/ui/PageState";
import "../../../shared/ui/ui.css";
import { loadAttention } from "../services/attention";
import useLoad from "../services/useLoad";

export default function Notifications({ onNavigate }) {
  const { data, loading, error, reload } = useLoad(loadAttention);

  if (loading || error) return <PageState loading={loading} error={error} onRetry={reload} />;

  return (
    <main className="ui-page">
      <PageHeader
        title="Notifications" subtitle="Things that need your attention right now"
        actions={<button className="ui-btn ui-btn--ghost" onClick={reload}>Refresh</button>}
      />
      <Panel>
        {data.length === 0 && <p className="ui-empty">Nothing needs your attention right now.</p>}
        {data.map((n) => (
          <div
            className="ui-list-item unread"
            key={n.id}
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer" }}
            onClick={() => onNavigate?.(n.path)}
            onKeyDown={(e) => { if (e.key === "Enter") onNavigate?.(n.path); }}
          >
            <div><strong>{n.title}</strong><span>{n.message}</span></div>
            <span>{n.time}</span>
          </div>
        ))}
      </Panel>
    </main>
  );
}