import { formatDate, formatDateTime, salesApi } from "./salesApi";

export function loadAttention() {
    return salesApi.dashboard().then((d) => {
        const tasks = (d.todaysTasks || []).map((t) => ({
            id: `task-${t.id}`,
            title: t.overdue ? `Task overdue: ${t.title}` : `Task due: ${t.title}`,
            message: `${t.priority} priority · ${t.status}`,
            time: t.dueDate ? formatDate(t.dueDate) : "No date",
            path: "tasks",
            read: false,
        }));
        const meetings = (d.upcomingMeetings || [])
            .filter((m) => new Date(m.activityDate).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000)
            .map((m) => ({
                id: `meeting-${m.id}`,
                title: `Meeting: ${m.description}`,
                message: m.customer || "Meeting",
                time: formatDateTime(m.activityDate),
                path: "calendar",
                read: false,
            }));
        const requests = (d.waitingRequests || []).map((r) => ({
            id: `sr-${r.id}`,
            title: `Service request waiting: ${r.requestNumber}`,
            message: `${r.customer} · ${r.serviceType}${r.productName ? ` · ${r.productName}` : ""}`,
            time: formatDate(r.createdAt),
            path: "service-requests",
            read: false,
        }));
        const leads = (d.recentLeads || [])
            .filter((l) => l.status === "New")
            .map((l) => ({
                id: `lead-${l.id}`,
                title: `New lead: ${l.company || l.name}`,
                message: l.product || "General enquiry",
                time: formatDate(l.assignedAt),
                path: "leads",
                read: false,
            }));
        return [...requests, ...tasks, ...meetings, ...leads];
    });
}
