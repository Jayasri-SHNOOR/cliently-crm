import Topbar from "../../../layouts/Topbar";
import { loadAttention } from "../services/attention";
import useLoad from "../services/useLoad";

const TITLES = {
  dashboard: ["Dashboard", "Overview"],
  leads: ["Leads", "My Enquiries"],
  customers: ["Customers", "My Customers"],
  "service-requests": ["Service Requests", "Customer Service"],
  products: ["Products", "Catalogue"],
  payments: ["Payments", "Collections"],
  tasks: ["Tasks", "My Work"],
  calendar: ["Calendar", "Meetings & Due Dates"],
  notes: ["Notes", "My Notes"],
  notifications: ["Notifications", "Updates"],
  profile: ["My Profile", "Account"],
  help: ["Help", "Support"],
};

export default function SalesTopbar({ currentPage, user, onNavigate }) {
  const [title, subtitle] = TITLES[currentPage] || TITLES.dashboard;
  const { data } = useLoad(loadAttention);
  const items = data || [];
  return (
    <Topbar
      breadcrumb={{ title, subtitle }}
      user={user}
      notifications={{
        items,
        unread: items.length,
        onSelect: () => onNavigate("notifications"),
      }}
      onProfile={() => onNavigate("profile")}
    />
  );
}