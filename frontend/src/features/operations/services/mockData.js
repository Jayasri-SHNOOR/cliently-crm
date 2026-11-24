
const now = new Date().toISOString();

const staff = [
  {
    _id: "staff-001",
    name: "Arun Kumar",
    email: "arun@example.com",
    role: "Operations Manager",
    status: "Active",
  },
  {
    _id: "staff-002",
    name: "Priya S",
    email: "priya@example.com",
    role: "Support Executive",
    status: "Active",
  },
  {
    _id: "staff-003",
    name: "Karthik R",
    email: "karthik@example.com",
    role: "Service Technician",
    status: "Active",
  },
];

const products = [
  {
    _id: "product-001",
    name: "CRM Software",
    code: "PROD-001",
    category: "Software",
    status: "Active",
  },
  {
    _id: "product-002",
    name: "Network Router",
    code: "PROD-002",
    category: "Hardware",
    status: "Active",
  },
  {
    _id: "product-003",
    name: "Laptop",
    code: "PROD-003",
    category: "Hardware",
    status: "Active",
  },
];

const tickets = [
  {
    _id: "ticket-001",
    number: 1001,
    subject: "Unable to log in",
    description: "Customer cannot access the CRM account.",
    customer: {
      name: "Ravi Kumar",
      company: "ABC Technologies",
      email: "ravi@example.com",
    },
    category: "Software",
    priority: "High",
    status: "Open",
    assignedTo: {
      _id: "staff-002",
      name: "Priya S",
    },
    productId: "product-001",
    createdAt: "2026-11-09T09:00:00.000Z",
    updatedAt: now,
    notes: [],
  },
  {
    _id: "ticket-002",
    number: 1002,
    subject: "Router connectivity issue",
    description: "Internet connection is unstable.",
    customer: {
      name: "Meena S",
      company: "Tech Solutions",
      email: "meena@example.com",
    },
    category: "Hardware",
    priority: "Urgent",
    status: "In Progress",
    assignedTo: {
      _id: "staff-003",
      name: "Karthik R",
    },
    productId: "product-002",
    createdAt: "2026-11-08T10:30:00.000Z",
    updatedAt: now,
    notes: [],
  },
  {
    _id: "ticket-003",
    number: 1003,
    subject: "Request for software installation",
    description: "Customer needs software setup.",
    customer: {
      name: "Suresh P",
      company: "Global Systems",
      email: "suresh@example.com",
    },
    category: "Installation",
    priority: "Medium",
    status: "Resolved",
    assignedTo: {
      _id: "staff-001",
      name: "Arun Kumar",
    },
    productId: "product-001",
    createdAt: "2026-11-07T11:00:00.000Z",
    updatedAt: now,
    notes: [],
  },
];

const workOrders = [
  {
    _id: "wo-001",
    number: 2001,
    title: "Router replacement",
    description: "Replace the faulty router.",
    status: "Scheduled",
    priority: "High",
    customer: {
      name: "Meena S",
      company: "Tech Solutions",
    },
    assignedTo: {
      _id: "staff-003",
      name: "Karthik R",
    },
    productId: {
      _id: "product-002",
      name: "Network Router",
    },
    ticketId: "ticket-002",
    scheduledStart: "2026-11-12",
    scheduledEnd: "2026-11-13",
    milestones: [
      {
        _id: "milestone-001",
        title: "Inspect router",
        description: "Check the existing router.",
        status: "Completed",
        order: 1,
        dueDate: "2026-11-12",
        completedAt: now,
      },
      {
        _id: "milestone-002",
        title: "Install replacement",
        description: "Install and test the new router.",
        status: "Pending",
        order: 2,
        dueDate: "2026-11-13",
        completedAt: null,
      },
    ],
    createdAt: "2026-11-09T09:00:00.000Z",
    updatedAt: now,
    completedAt: null,
  },
  {
    _id: "wo-002",
    number: 2002,
    title: "CRM software setup",
    description: "Configure CRM for the customer.",
    status: "In Progress",
    priority: "Medium",
    customer: {
      name: "Suresh P",
      company: "Global Systems",
    },
    assignedTo: {
      _id: "staff-001",
      name: "Arun Kumar",
    },
    productId: {
      _id: "product-001",
      name: "CRM Software",
    },
    ticketId: "ticket-003",
    scheduledStart: "2026-11-10",
    scheduledEnd: "2026-11-14",
    milestones: [],
    createdAt: "2026-11-08T09:00:00.000Z",
    updatedAt: now,
    completedAt: null,
  },
  {
    _id: "wo-003",
    number: 2003,
    title: "Laptop maintenance",
    description: "Perform hardware maintenance.",
    status: "Draft",
    priority: "Low",
    customer: {
      name: "Ravi Kumar",
      company: "ABC Technologies",
    },
    assignedTo: null,
    productId: {
      _id: "product-003",
      name: "Laptop",
    },
    ticketId: null,
    scheduledStart: null,
    scheduledEnd: null,
    milestones: [],
    createdAt: "2026-11-07T09:00:00.000Z",
    updatedAt: now,
    completedAt: null,
  },
];

const articles = [
  {
    _id: "article-001",
    title: "How to reset your password",
    summary: "Steps to recover account access.",
    content:
      "Open the login page, select Forgot Password, and follow the instructions sent to your email.",
    category: "Account",
    tags: ["login", "password"],
    status: "Published",
    visibility: "Public",
    authorName: "Operations Team",
    views: 24,
    createdAt: "2026-11-07T09:00:00.000Z",
    updatedAt: now,
    publishedAt: "2026-11-07T09:00:00.000Z",
  },
  {
    _id: "article-002",
    title: "Troubleshooting network problems",
    summary: "Basic network troubleshooting guide.",
    content:
      "Check the network connection, router power, cable connections, and device settings.",
    category: "Technical Support",
    tags: ["network", "router"],
    status: "Published",
    visibility: "Internal",
    authorName: "Operations Team",
    views: 15,
    createdAt: "2026-11-08T09:00:00.000Z",
    updatedAt: now,
    publishedAt: "2026-11-08T09:00:00.000Z",
  },
  {
    _id: "article-003",
    title: "CRM onboarding checklist",
    summary: "Checklist for new customer setup.",
    content:
      "Create the customer account, configure access, add users, and verify the initial setup.",
    category: "Getting Started",
    tags: ["onboarding", "setup"],
    status: "Draft",
    visibility: "Internal",
    authorName: "Operations Team",
    views: 0,
    createdAt: "2026-11-09T09:00:00.000Z",
    updatedAt: now,
    publishedAt: null,
  },
];

function collection(data) {
  return {
    data,
    pagination: {
      page: 1,
      limit: 20,
      total: data.length,
      pages: Math.ceil(data.length / 20),
    },
  };
}

const dashboard = {
  data: {
    totalTickets: tickets.length,
    openTickets: tickets.filter(
      (item) => item.status === "Open"
    ).length,
    inProgressTickets: tickets.filter(
      (item) => item.status === "In Progress"
    ).length,
    resolvedTickets: tickets.filter(
      (item) => item.status === "Resolved"
    ).length,
    totalWorkOrders: workOrders.length,
    activeWorkOrders: workOrders.filter(
      (item) =>
        item.status === "Scheduled" ||
        item.status === "In Progress"
    ).length,
    completedWorkOrders: workOrders.filter(
      (item) => item.status === "Completed"
    ).length,
    totalArticles: articles.length,
    publishedArticles: articles.filter(
      (item) => item.status === "Published"
    ).length,
    totalStaff: staff.length,
    totalProducts: products.length,
    recentTickets: tickets.slice(0, 5),
    recentWorkOrders: workOrders.slice(0, 5),
  },
};

export const mockData = {
  dashboard,
  staff: collection(staff),
  products: collection(products),
  ticketList: collection(tickets),
  workOrderList: collection(workOrders),

  // Both names supported for Knowledge Base
  knowledgeBaseList: collection(articles),
  articleList: collection(articles),
  articles: collection(articles),
};
