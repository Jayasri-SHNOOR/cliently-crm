import { Users, ContactRound, Wrench, CheckSquare, CalendarDays, CreditCard, Mail } from "lucide-react";
import PageHeader from "../../../shared/ui/PageHeader";
import Panel from "../../../shared/ui/Panel";
import "../../../shared/ui/ui.css";

const TOPICS = [
  { icon: Users, title: "Leads", text: "Leads assigned to you by your Manager appear here. Move them through the stages. When a lead buys, click “Make customer”: the customer gets a login email automatically." },
  { icon: ContactRound, title: "Customers", text: "Open a customer to edit their details, add the products they bought, and resend their portal login." },
  { icon: Wrench, title: "Service Requests", text: "Your customers request service from the customer portal. Assign an operational staff member, then set a charge if the service is paid." },
  { icon: CreditCard, title: "Payments", text: "Customers pay service charges online. Paid and unpaid charges are listed here." },
  { icon: CheckSquare, title: "Tasks & Notes", text: "Your own to-do list and private notes. Only you can see them." },
  { icon: CalendarDays, title: "Calendar", text: "Add meetings with customers. Task due dates are shown here too." },
];

export default function Help() {
  return (
    <main className="ui-page">
      <PageHeader title="Help" subtitle="How the sales workspace works" />
      <section className="ui-grid-2">
        {TOPICS.map(({ icon: Icon, title, text }) => (
          <Panel key={title} title={title}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Icon size={20} style={{ flexShrink: 0, color: "var(--teal-accent-dark)" }} />
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--muted-text)" }}>{text}</p>
            </div>
          </Panel>
        ))}
      </section>
      <Panel title="Need more help?">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Mail size={18} style={{ color: "var(--teal-accent-dark)" }} />
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted-text)" }}>Contact your Manager or Client Admin for access, assignments and account changes.</p>
        </div>
      </Panel>
    </main>
  );
}