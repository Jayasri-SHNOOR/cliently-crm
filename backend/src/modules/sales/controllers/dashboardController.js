const mongoose = require("mongoose");
const Task = require("../models/task");
const Activity = require("../models/activity");
const Customer = require("../models/Customer");
const Lead = require("../../../models/Lead");
const ServiceRequest = require("../../../models/ServiceRequest");

const CLOSED_LEADS = ["Won", "Lost"];
const OPEN_REQUESTS = ["Requested", "Assigned", "In Progress"];

const getDashboard = async (req, res) => {
  try {
    const { tenantId, id: userId, employeeId } = req.user;

    if (!tenantId) {
      return res.status(403).json({ success: false, message: "Tenant information is missing" });
    }

    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const leadOwner = employeeId ? { tenantId, executiveId: employeeId } : { tenantId, _id: null };
    const taskOwner = { tenantId, userId };

    const [
      openLeads, newLeadsThisWeek, wonLeads, myCustomers, openRequests, waitingRequests,
      pendingTasks, overdueTasks, unpaid, todaysTasks, upcomingMeetings, recentLeads, waitingList,
    ] = await Promise.all([
      Lead.countDocuments({ ...leadOwner, status: { $nin: CLOSED_LEADS } }),
      Lead.countDocuments({ ...leadOwner, assignedAt: { $gte: weekAgo } }),
      Lead.countDocuments({ ...leadOwner, status: "Won" }),
      Customer.countDocuments({ tenantId, salesExecId: userId }),
      ServiceRequest.countDocuments({ tenantId, salesExecId: userId, status: { $in: OPEN_REQUESTS } }),
      ServiceRequest.countDocuments({ tenantId, salesExecId: userId, status: "Requested" }),
      Task.countDocuments({ ...taskOwner, status: { $ne: "Completed" } }),
      Task.countDocuments({ ...taskOwner, status: { $ne: "Completed" }, dueDate: { $lt: now } }),
      ServiceRequest.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(String(tenantId)), salesExecId: new mongoose.Types.ObjectId(String(userId)), paymentStatus: "Unpaid", status: { $ne: "Cancelled" } } },
        { $group: { _id: null, amount: { $sum: "$charge" }, count: { $sum: 1 } } },
      ]),
      Task.find({ ...taskOwner, status: { $ne: "Completed" }, $or: [{ dueDate: { $lte: endOfToday } }, { dueDate: null }] })
        .sort({ dueDate: 1, createdAt: -1 })
        .limit(6)
        .lean(),
      Activity.find({ tenantId, userId, activityType: "Meeting", status: "Pending", activityDate: { $gte: now } })
        .populate("customerId", "name")
        .sort({ activityDate: 1 })
        .limit(5)
        .lean(),
      Lead.find(leadOwner).sort({ assignedAt: -1, createdAt: -1 }).limit(5).lean(),
      ServiceRequest.find({ tenantId, salesExecId: userId, status: "Requested" })
        .populate("customerId", "name customerCode")
        .sort({ createdAt: 1 })
        .limit(5)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      linkedToEmployee: Boolean(employeeId),
      stats: {
        openLeads,
        newLeadsThisWeek,
        wonLeads,
        myCustomers,
        openRequests,
        waitingRequests,
        pendingTasks,
        overdueTasks,
        unpaidCharges: unpaid[0]?.amount || 0,
        unpaidCount: unpaid[0]?.count || 0,
      },
      todaysTasks: todaysTasks.map((t) => ({
        id: t._id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        overdue: Boolean(t.dueDate && t.dueDate < now),
      })),
      upcomingMeetings: upcomingMeetings.map((m) => ({
        id: m._id,
        description: m.description,
        activityDate: m.activityDate,
        customer: m.customerId?.name || "",
      })),
      recentLeads: recentLeads.map((l) => ({
        id: l._id,
        name: l.name,
        company: l.company,
        status: l.status,
        product: l.productName || l.productInterested || "",
        assignedAt: l.assignedAt || l.createdAt,
      })),
      waitingRequests: waitingList.map((r) => ({
        id: r._id,
        requestNumber: r.requestNumber,
        serviceType: r.serviceType,
        productName: r.productName,
        customer: r.customerId?.name || "",
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard statistics" });
  }
};

module.exports = { getDashboard };
