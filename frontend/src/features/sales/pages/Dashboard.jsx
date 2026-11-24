import {
  Users,
  CheckSquare,
  CalendarDays,
  IndianRupee,
  Clock3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../services/api";
function Dashboard() {
  const [stats, setStats] = useState({
  totalCustomers: 0,
  totalTasks: 0,
  pendingTasks: 0,
  completedTasks: 0,
  inProgressTasks: 0,
});

useEffect(() => {
  api
    .get("/sales/dashboard")
    .then((response) => {
      if (response.success) {
        setStats(response.stats);
      }
    })
    .catch((error) => {
      console.error("Dashboard API error:", error);
    });
}, []);
  const summaryCards = [
    
{
  title: "Customers",
  value: stats.totalCustomers,
  change: "",
  trend: "neutral",
  icon: Users,
},

    
{
  title: "Pending Tasks",
  value: stats.pendingTasks,
  change: "From your tasks",
  trend: "neutral",
  icon: CheckSquare,
},

    {
      title: "Upcoming Events",
      value: "6",
      change: "Next: 10:30 AM",
      trend: "neutral",
      icon: CalendarDays,
    },
    {
      title: "Total Sales",
      value: "₹4.82L",
      change: "+12.5%",
      trend: "up",
      icon: IndianRupee,
    },
  ];

  const todayTasks = [
    {
      task: "Follow up with client",
      customer: "Acme Solutions",
      time: "10:30 AM",
      priority: "High",
    },
    {
      task: "Send product quotation",
      customer: "Bright Tech",
      time: "12:00 PM",
      priority: "Medium",
    },
    {
      task: "Customer feedback call",
      customer: "Nova Systems",
      time: "3:30 PM",
      priority: "Low",
    },
  ];

  const upcomingSchedule = [
    {
      date: "07",
      month: "OCT",
      time: "10:30 AM",
      event: "Client Follow-up",
      customer: "Acme Solutions",
    },
    {
      date: "08",
      month: "OCT",
      time: "11:00 AM",
      event: "Product Demo",
      customer: "Bright Tech",
    },
    {
      date: "09",
      month: "OCT",
      time: "02:30 PM",
      event: "Review Meeting",
      customer: "Nova Systems",
    },
  ];

  const recentCustomers = [
    {
      name: "Acme Solutions",
      status: "Active",
      lastInteraction: "Today",
      nextFollowUp: "Tomorrow",
    },
    {
      name: "Bright Tech",
      status: "Active",
      lastInteraction: "Yesterday",
      nextFollowUp: "Oct 9",
    },
    {
      name: "Nova Systems",
      status: "New",
      lastInteraction: "Oct 5",
      nextFollowUp: "Oct 10",
    },
  ];

  return (
  <div className="dashboard">
    <div className="page-header">
      <div></div>

      <div className="date-display">
        <Clock3 size={16} />
        <span>October 7, 2026</span>
      </div>
    </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div className="summary-card" key={card.title}>
              <div className="summary-card-top">
                <div className="summary-icon">
                  <Icon size={20} />
                </div>

                {card.trend === "up" && (
                  <span className="trend positive">
                    <ArrowUpRight size={14} />
                    {card.change}
                  </span>
                )}
              </div>

              <div className="summary-value">{card.value}</div>
              <div className="summary-title">{card.title}</div>

              {card.trend === "neutral" && (
                <span className="summary-note">{card.change}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">

        {/* Today's Tasks */}
        <section className="dashboard-card tasks-card">
          <div className="card-header">
            <div>
              <h2>Today's Tasks</h2>
              <p>Your tasks scheduled for today</p>
            </div>

            <button className="view-button">View All</button>
          </div>

          <div className="task-list">
            {todayTasks.map((task) => (
              <div className="task-row" key={task.task}>
                <div className="task-check">
                  <CheckSquare size={18} />
                </div>

                <div className="task-info">
                  <strong>{task.task}</strong>
                  <span>{task.customer}</span>
                </div>

                <div className="task-time">{task.time}</div>

                <span
                  className={`priority priority-${task.priority.toLowerCase()}`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Schedule */}
        <section className="dashboard-card schedule-card">
          <div className="card-header">
            <div>
              <h2>Upcoming Schedule</h2>
              <p>Your next meetings and events</p>
            </div>

            <button className="view-button">Calendar</button>
          </div>

          <div className="schedule-list">
            {upcomingSchedule.map((item) => (
              <div className="schedule-row" key={`${item.date}-${item.time}`}>
                <div className="schedule-date">
                  <strong>{item.date}</strong>
                  <span>{item.month}</span>
                </div>

                <div className="schedule-info">
                  <strong>{item.event}</strong>
                  <span>{item.customer}</span>
                </div>

                <span className="schedule-time">{item.time}</span>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Bottom Grid */}
      <div className="dashboard-grid bottom-grid">

        {/* Sales Performance */}
        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Sales Performance</h2>
              <p>Your monthly sales target</p>
            </div>

            <span className="performance-percent">82%</span>
          </div>

          <div className="sales-amount">
            <strong>₹4.82L</strong>
            <span>of ₹5.90L target</span>
          </div>

          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>

          <div className="sales-footer">
            <span>₹1.08L remaining</span>
            <span className="positive">
              <ArrowUpRight size={14} />
              12.5%
            </span>
          </div>
        </section>

        {/* Recent Customers */}
        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Recent Customers</h2>
              <p>Latest customer activity</p>
            </div>

            <button className="view-button">View All</button>
          </div>

          <div className="customer-list">
            {recentCustomers.map((customer) => (
              <div className="customer-row" key={customer.name}>
                <div className="customer-avatar">
                  {customer.name.charAt(0)}
                </div>

                <div className="customer-info">
                  <strong>{customer.name}</strong>
                  <span>Last interaction: {customer.lastInteraction}</span>
                </div>

                <div className="customer-status">
                  <span
                    className={`status-dot ${
                      customer.status === "New" ? "new" : ""
                    }`}
                  ></span>
                  {customer.status}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

export default Dashboard;