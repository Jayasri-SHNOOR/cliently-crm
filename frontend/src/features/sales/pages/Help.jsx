import { CircleHelp, Users, CheckSquare, CalendarDays, Package, Bell, Mail } from "lucide-react";

function Help() {
  const helpItems = [
    {
      icon: Users,
      title: "Leads",
      description: "View and manage your leads and their contact details.",
    },
    {
      icon: Users,
      title: "Customers",
      description: "View customer information and track sales details.",
    },
    {
      icon: CheckSquare,
      title: "Tasks",
      description: "Review your tasks and keep track of pending work.",
    },
    {
      icon: CalendarDays,
      title: "Calendar",
      description: "View upcoming meetings and scheduled activities.",
    },
    {
      icon: Package,
      title: "Products",
      description: "Browse available products and their details.",
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Check notifications and stay updated.",
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Help & Support</h1>
          <p>Find guidance for using your Sales Executive Dashboard.</p>
        </div>
        <CircleHelp size={32} />
      </div>

      <div className="help-intro">
        <h2>How can we help you?</h2>
        <p>
          Use the sections below to understand the features available
          in your CRM portal.
        </p>
      </div>

      <div className="help-grid">
        {helpItems.map((item) => {
          const Icon = item.icon;

          return (
            <div className="help-card" key={item.title}>
              <Icon size={24} />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          );
        })}
      </div>

      <div className="help-contact">
        <Mail size={22} />
        <div>
          <h3>Need further assistance?</h3>
          <p>
            Contact your team lead or CRM administrator for help
            with access, data, or technical issues.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Help;