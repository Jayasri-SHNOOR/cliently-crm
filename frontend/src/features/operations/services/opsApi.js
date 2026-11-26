import { apiFetch } from "../../../lib/api";
import { mockData } from "./mockData";

// ==========================================
// CONFIGURATION
// ==========================================

const BASE_URL = "/api/operations";
const USE_MOCK = import.meta.env.VITE_OPS_MOCK === "true";

// ==========================================
// COMMON HELPERS
// ==========================================

function mock(value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(value)), 300);
  });
}

function mockError(message, errors) {
  const error = new Error(message);
  if (errors) error.errors = errors;
  return Promise.reject(error);
}

function query(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      search.set(key, String(value));
    }
  });

  const text = search.toString();
  return text ? `?${text}` : "";
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function paginate(items, params = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(params.limit) || 20)
  );

  const total = items.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;

  return mock({
    data: items.slice(start, start + limit),
    pagination: { page, limit, total, pages },
  });
}

// ==========================================
// STAFF AND PRODUCTS
// ==========================================

const mockStaff = structuredClone(
  mockData.staff?.data || []
);

const mockProducts = structuredClone(
  mockData.products?.data || []
);

function populateStaff(id) {
  if (!id) return null;

  const staff = mockStaff.find(
    (person) => person._id === id
  );

  return staff
    ? { _id: staff._id, name: staff.name }
    : null;
}

function populateProduct(id) {
  if (!id) return null;

  const product = mockProducts.find(
    (item) => item._id === id
  );

  return product
    ? { _id: product._id, name: product.name }
    : null;
}

// ==========================================
// SUPPORT TICKETS - MOCK STORAGE
// ==========================================

const mockTicketStore = structuredClone(
  mockData.ticketList?.data || []
);

const mockTicketDetails = {};

function getMockTicket(id) {
  return mockTicketStore.find(
    (ticket) => ticket._id === id
  );
}

function getMockTicketDetail(id) {
  const ticket = getMockTicket(id);

  if (!ticket) return null;

  if (!mockTicketDetails[id]) {
    mockTicketDetails[id] = {
      ...ticket,
      description:
        ticket.description ||
        "Customer reported an issue that requires assistance from the support team.",
      notes: [],
    };
  }

  return mockTicketDetails[id];
}

// ==========================================
// SUPPORT TICKETS - LIST
// ==========================================

function mockTickets(params = {}) {
  let tickets = [...mockTicketStore];

  if (params.status) {
    tickets = tickets.filter(
      (ticket) => ticket.status === params.status
    );
  }

  if (params.priority) {
    tickets = tickets.filter(
      (ticket) => ticket.priority === params.priority
    );
  }

  if (params.category) {
    tickets = tickets.filter(
      (ticket) => ticket.category === params.category
    );
  }

  if (params.assignedTo === "unassigned") {
    tickets = tickets.filter(
      (ticket) => ticket.assignedTo === null
    );
  }

  if (
    params.assignedTo &&
    params.assignedTo !== "me" &&
    params.assignedTo !== "unassigned"
  ) {
    tickets = tickets.filter(
      (ticket) =>
        ticket.assignedTo?._id === params.assignedTo
    );
  }

  if (params.q) {
    const searchText = String(params.q).toLowerCase();

    tickets = tickets.filter((ticket) => {
      const searchableText = [
        ticket.subject,
        ticket.customer?.name,
        ticket.customer?.company,
        ticket.customer?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchText);
    });
  }

  if (params.sort === "oldest") {
    tickets.sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );
  } else if (params.sort === "priority") {
    const priorityOrder = {
      Urgent: 0,
      High: 1,
      Medium: 2,
      Low: 3,
    };

    tickets.sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 99) -
          (priorityOrder[b.priority] ?? 99) ||
        new Date(b.createdAt) -
          new Date(a.createdAt)
    );
  } else {
    tickets.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );
  }

  return paginate(tickets, params);
}

// ==========================================
// SUPPORT TICKETS - CREATE
// ==========================================

function mockCreateTicket(body) {
  if (!body.subject?.trim()) {
    return mockError("Ticket subject is required.");
  }

  if (!body.customer?.name?.trim()) {
    return mockError("Customer name is required.");
  }

  const highestNumber = mockTicketStore.reduce(
    (highest, ticket) =>
      Math.max(highest, Number(ticket.number) || 0),
    0
  );

  const now = new Date().toISOString();

  const newTicket = {
    _id: makeId("mock-ticket"),
    number: highestNumber + 1,
    subject: body.subject.trim(),
    description: body.description || "",
    customer: {
      name: body.customer.name.trim(),
      company: body.customer.company || "",
      email: body.customer.email || "",
      phone: body.customer.phone || "",
    },
    category: body.category || "General",
    priority: body.priority || "Medium",
    status: "Open",
    assignedTo: body.assignedTo
      ? {
          _id: body.assignedTo,
          name: "Assigned Staff",
        }
      : null,
    productId: body.productId || null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    closedAt: null,
  };

  mockTicketStore.unshift(newTicket);

  mockTicketDetails[newTicket._id] = {
    ...newTicket,
    notes: [],
  };

  return mock({ data: newTicket });
}

// ==========================================
// SUPPORT TICKETS - GET
// ==========================================

function mockGetTicket(id) {
  const ticket = getMockTicketDetail(id);

  if (!ticket) {
    return mockError("Ticket not found.");
  }

  return mock({ data: ticket });
}

// ==========================================
// SUPPORT TICKETS - UPDATE
// ==========================================

function mockUpdateTicket(id, body) {
  const ticket = getMockTicketDetail(id);

  if (!ticket) {
    return mockError("Ticket not found.");
  }

  const allowedFields = [
    "subject",
    "description",
    "status",
    "priority",
    "category",
    "assignedTo",
    "customer",
    "productId",
  ];

  const previousStatus = ticket.status;

  allowedFields.forEach((field) => {
    if (
      Object.prototype.hasOwnProperty.call(
        body,
        field
      )
    ) {
      ticket[field] = body[field];
    }
  });

  const now = new Date().toISOString();
  ticket.updatedAt = now;

  if (
    body.status === "Resolved" &&
    previousStatus !== "Resolved"
  ) {
    ticket.resolvedAt = now;
  }

  if (
    body.status === "Closed" &&
    previousStatus !== "Closed"
  ) {
    ticket.closedAt = now;
  }

  if (
    [
      "Open",
      "In Progress",
      "Waiting on Customer",
    ].includes(body.status)
  ) {
    ticket.resolvedAt = null;
    ticket.closedAt = null;
  }

  const index = mockTicketStore.findIndex(
    (item) => item._id === id
  );

  if (index !== -1) {
    mockTicketStore[index] = {
      ...mockTicketStore[index],
      ...ticket,
    };
  }

  return mock({ data: ticket });
}

// ==========================================
// SUPPORT TICKETS - ADD NOTE
// ==========================================

function mockAddNote(id, body) {
  const ticket = getMockTicketDetail(id);

  if (!ticket) {
    return mockError("Ticket not found.");
  }

  const text = String(
    body?.text || body?.body || ""
  ).trim();

  if (!text) {
    return mockError("Note text is required.");
  }

  const note = {
    _id: makeId("mock-note"),
    text,
    body: text,
    isInternal: Boolean(body?.isInternal),
    createdAt: new Date().toISOString(),
    createdBy: {
      _id: "mock-user",
      name: "Operations User",
    },
  };

  ticket.notes = ticket.notes || [];
  ticket.notes.push(note);
  ticket.updatedAt = new Date().toISOString();

  return mock({ data: note });
}

// ==========================================
// WORK ORDERS - MOCK STORAGE
// ==========================================

const mockWorkOrderStore = structuredClone(
  mockData.workOrderList?.data || []
);

const mockWorkOrderDetails = {};

function getMockWorkOrder(id) {
  return mockWorkOrderStore.find(
    (workOrder) => workOrder._id === id
  );
}

function getMockWorkOrderDetail(id) {
  const workOrder = getMockWorkOrder(id);

  if (!workOrder) return null;

  if (!mockWorkOrderDetails[id]) {
    mockWorkOrderDetails[id] = {
      ...workOrder,
      description: workOrder.description || "",
      milestones: structuredClone(
        workOrder.milestones || []
      ),
    };
  }

  return mockWorkOrderDetails[id];
}

function syncWorkOrder(workOrder) {
  const index = mockWorkOrderStore.findIndex(
    (item) => item._id === workOrder._id
  );

  if (index !== -1) {
    mockWorkOrderStore[index] = {
      ...mockWorkOrderStore[index],
      ...workOrder,
    };
  }
}

// ==========================================
// WORK ORDERS - VALIDATION
// ==========================================

const WORK_ORDER_STATUSES = [
  "Draft",
  "Scheduled",
  "In Progress",
  "On Hold",
  "Completed",
  "Cancelled",
];

const WORK_ORDER_PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

function validateWorkOrder(body, existing = null) {
  const errors = {};

  const merged = {
    ...(existing || {}),
    ...body,
  };

  if (!String(merged.title || "").trim()) {
    errors.title = "Work order title is required.";
  }

  if (
    merged.title &&
    String(merged.title).trim().length > 160
  ) {
    errors.title =
      "Title must be 160 characters or less.";
  }

  if (
    merged.description &&
    String(merged.description).length > 5000
  ) {
    errors.description =
      "Description must be 5000 characters or less.";
  }

  if (
    merged.priority &&
    !WORK_ORDER_PRIORITIES.includes(
      merged.priority
    )
  ) {
    errors.priority = "Invalid priority.";
  }

  if (
    merged.status &&
    !WORK_ORDER_STATUSES.includes(
      merged.status
    )
  ) {
    errors.status = "Invalid status.";
  }

  if (
    merged.scheduledStart &&
    merged.scheduledEnd &&
    new Date(merged.scheduledEnd) <
      new Date(merged.scheduledStart)
  ) {
    errors.scheduledEnd =
      "End date must be after the start date.";
  }

  return Object.keys(errors).length
    ? mockError("Validation failed.", errors)
    : null;
}

// ==========================================
// WORK ORDERS - LIST
// ==========================================

function mockListWorkOrders(params = {}) {
  let items = [...mockWorkOrderStore];

  if (params.status) {
    items = items.filter(
      (item) => item.status === params.status
    );
  }

  if (params.priority) {
    items = items.filter(
      (item) => item.priority === params.priority
    );
  }

  if (params.assignedTo === "unassigned") {
    items = items.filter(
      (item) => !item.assignedTo
    );
  } else if (
    params.assignedTo &&
    params.assignedTo !== "me"
  ) {
    items = items.filter(
      (item) =>
        item.assignedTo?._id === params.assignedTo ||
        item.assignedTo === params.assignedTo
    );
  }

  if (params.q) {
    const searchText = String(params.q)
      .trim()
      .toLowerCase();

    items = items.filter((item) =>
      [
        item.title,
        item.description,
        item.number,
        item.customer?.name,
        item.customer?.company,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchText)
    );
  }

  if (params.sort === "oldest") {
    items.sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );
  } else if (params.sort === "priority") {
    const priorityOrder = {
      Urgent: 0,
      High: 1,
      Medium: 2,
      Low: 3,
    };

    items.sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 99) -
          (priorityOrder[b.priority] ?? 99) ||
        new Date(b.createdAt) -
          new Date(a.createdAt)
    );
  } else {
    items.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );
  }

  return paginate(items, params);
}

// ==========================================
// WORK ORDERS - GET
// ==========================================

function mockGetWorkOrder(id) {
  const workOrder = getMockWorkOrderDetail(id);

  if (!workOrder) {
    return mockError("Work order not found.");
  }

  return mock({ data: workOrder });
}

// ==========================================
// WORK ORDERS - CREATE
// ==========================================

function mockCreateWorkOrder(body = {}) {
  const validation = validateWorkOrder(body);

  if (validation) return validation;

  const highestNumber = mockWorkOrderStore.reduce(
    (highest, item) =>
      Math.max(
        highest,
        Number(item.number) || 0
      ),
    0
  );

  const now = new Date().toISOString();

  const workOrder = {
    _id: makeId("mock-work-order"),
    number: highestNumber + 1,
    title: String(body.title).trim(),
    description: body.description || "",
    status: body.status || "Draft",
    priority: body.priority || "Medium",
    customer: body.customer || null,
    assignedTo: body.assignedTo
      ? populateStaff(body.assignedTo)
      : null,
    productId: body.productId
      ? populateProduct(body.productId)
      : null,
    ticketId: body.ticketId || null,
    scheduledStart: body.scheduledStart || null,
    scheduledEnd: body.scheduledEnd || null,
    milestones: [],
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  mockWorkOrderStore.unshift(workOrder);

  mockWorkOrderDetails[workOrder._id] =
    workOrder;

  return mock({ data: workOrder });
}

// ==========================================
// WORK ORDERS - UPDATE
// ==========================================

function mockUpdateWorkOrder(id, body = {}) {
  const workOrder = getMockWorkOrderDetail(id);

  if (!workOrder) {
    return mockError("Work order not found.");
  }

  const validation = validateWorkOrder(
    body,
    workOrder
  );

  if (validation) return validation;

  const allowedFields = [
    "title",
    "description",
    "status",
    "priority",
    "customer",
    "assignedTo",
    "productId",
    "ticketId",
    "scheduledStart",
    "scheduledEnd",
  ];

  const previousStatus = workOrder.status;

  allowedFields.forEach((field) => {
    if (
      Object.prototype.hasOwnProperty.call(
        body,
        field
      )
    ) {
      if (field === "assignedTo") {
        workOrder.assignedTo = body.assignedTo
          ? typeof body.assignedTo === "object"
            ? body.assignedTo
            : populateStaff(body.assignedTo)
          : null;
      } else if (field === "productId") {
        workOrder.productId = body.productId
          ? typeof body.productId === "object"
            ? body.productId
            : populateProduct(body.productId)
          : null;
      } else {
        workOrder[field] = body[field];
      }
    }
  });

  const now = new Date().toISOString();
  workOrder.updatedAt = now;

  if (
    workOrder.status === "Completed" &&
    previousStatus !== "Completed"
  ) {
    workOrder.completedAt = now;
  } else if (workOrder.status !== "Completed") {
    workOrder.completedAt = null;
  }

  syncWorkOrder(workOrder);

  return mock({ data: workOrder });
}

// ==========================================
// WORK ORDERS - DELETE
// ==========================================

function mockDeleteWorkOrder(id) {
  const index = mockWorkOrderStore.findIndex(
    (item) => item._id === id
  );

  if (index === -1) {
    return mockError("Work order not found.");
  }

  mockWorkOrderStore.splice(index, 1);
  delete mockWorkOrderDetails[id];

  return mock({
    message: "Work order deleted successfully.",
  });
}

// ==========================================
// MILESTONES - HELPERS
// ==========================================

function findMockMilestone(
  workOrder,
  milestoneId
) {
  return (workOrder.milestones || []).find(
    (milestone) =>
      milestone._id === milestoneId
  );
}

function validateMilestone(
  body = {},
  existing = null
) {
  const merged = {
    ...(existing || {}),
    ...body,
  };

  const errors = {};

  if (!String(merged.title || "").trim()) {
    errors.title =
      "Milestone title is required.";
  }

  if (
    String(merged.title || "").length > 160
  ) {
    errors.title =
      "Maximum 160 characters.";
  }

  if (
    merged.description &&
    String(merged.description).length > 2000
  ) {
    errors.description =
      "Maximum 2000 characters.";
  }

  if (
    merged.status &&
    ![
      "Pending",
      "In Progress",
      "Completed",
    ].includes(merged.status)
  ) {
    errors.status =
      "Invalid milestone status.";
  }

  return Object.keys(errors).length
    ? mockError(
        "Validation failed.",
        errors
      )
    : null;
}

// ==========================================
// MILESTONES - CREATE
// ==========================================

function mockCreateMilestone(
  workOrderId,
  body = {}
) {
  const workOrder =
    getMockWorkOrderDetail(workOrderId);

  if (!workOrder) {
    return mockError(
      "Work order not found."
    );
  }

  const validation =
    validateMilestone(body);

  if (validation) return validation;

  const now =
    new Date().toISOString();

  const milestone = {
    _id: makeId("mock-milestone"),
    title: String(body.title).trim(),
    description: body.description || "",
    status: body.status || "Pending",
    dueDate: body.dueDate || null,
    order:
      body.order ??
      (workOrder.milestones || []).length + 1,
    completedAt:
      body.status === "Completed"
        ? now
        : null,
    createdAt: now,
    updatedAt: now,
  };

  workOrder.milestones =
    workOrder.milestones || [];

  workOrder.milestones.push(
    milestone
  );

  workOrder.updatedAt = now;

  syncWorkOrder(workOrder);

  return mock({ data: milestone });
}

// ==========================================
// MILESTONES - UPDATE
// ==========================================

function mockUpdateMilestone(
  workOrderId,
  milestoneId,
  body = {}
) {
  const workOrder =
    getMockWorkOrderDetail(workOrderId);

  if (!workOrder) {
    return mockError(
      "Work order not found."
    );
  }

  const milestone =
    findMockMilestone(
      workOrder,
      milestoneId
    );

  if (!milestone) {
    return mockError(
      "Milestone not found."
    );
  }

  const validation =
    validateMilestone(
      body,
      milestone
    );

  if (validation) return validation;

  const previousStatus =
    milestone.status;

  const allowedFields = [
    "title",
    "description",
    "status",
    "dueDate",
    "order",
  ];

  allowedFields.forEach((field) => {
    if (
      Object.prototype.hasOwnProperty.call(
        body,
        field
      )
    ) {
      milestone[field] = body[field];
    }
  });

  const now =
    new Date().toISOString();

  milestone.updatedAt = now;

  if (
    milestone.status === "Completed" &&
    previousStatus !== "Completed"
  ) {
    milestone.completedAt = now;
  } else if (
    milestone.status !== "Completed"
  ) {
    milestone.completedAt = null;
  }

  workOrder.updatedAt = now;

  syncWorkOrder(workOrder);

  return mock({ data: milestone });
}

// ==========================================
// MILESTONES - DELETE
// ==========================================

function mockDeleteMilestone(
  workOrderId,
  milestoneId
) {
  const workOrder =
    getMockWorkOrderDetail(workOrderId);

  if (!workOrder) {
    return mockError(
      "Work order not found."
    );
  }

  const index = (
    workOrder.milestones || []
  ).findIndex(
    (item) =>
      item._id === milestoneId
  );

  if (index === -1) {
    return mockError(
      "Milestone not found."
    );
  }

  workOrder.milestones.splice(
    index,
    1
  );

  workOrder.updatedAt =
    new Date().toISOString();

  syncWorkOrder(workOrder);

  return mock({
    message:
      "Milestone deleted successfully.",
  });
}

// ==========================================
// KNOWLEDGE BASE - MOCK STORAGE
// ==========================================

const mockArticleStore = structuredClone(
  mockData.knowledgeBaseList?.data ||
  mockData.articleList?.data ||
  mockData.articles?.data ||
  []
);

const mockArticleDetails = {};

function getMockArticle(id) {
  return mockArticleStore.find(
    (article) =>
      article._id === id
  );
}

function getMockArticleDetail(id) {
  const article =
    getMockArticle(id);

  if (!article) return null;

  if (!mockArticleDetails[id]) {
    mockArticleDetails[id] = {
      ...article,
      content:
        article.content || "",
      tags:
        article.tags || [],
    };
  }

  return mockArticleDetails[id];
}

function syncMockArticle(article) {
  const index =
    mockArticleStore.findIndex(
      (item) =>
        item._id === article._id
    );

  if (index !== -1) {
    mockArticleStore[index] = {
      ...mockArticleStore[index],
      ...article,
    };
  }
}

// ==========================================
// KNOWLEDGE BASE - VALIDATION
// ==========================================

function validateArticle(
  body = {},
  existing = null
) {
  const merged = {
    ...(existing || {}),
    ...body,
  };

  const errors = {};

  if (!String(merged.title || "").trim()) {
    errors.title =
      "Article title is required.";
  }

  if (
    String(merged.title || "").length > 200
  ) {
    errors.title =
      "Maximum 200 characters.";
  }

  if (!String(merged.content || "").trim()) {
    errors.content =
      "Article content is required.";
  }

  if (
    merged.status &&
    ![
      "Draft",
      "Published",
      "Archived",
    ].includes(merged.status)
  ) {
    errors.status =
      "Invalid article status.";
  }

  return Object.keys(errors).length
    ? mockError(
        "Validation failed.",
        errors
      )
    : null;
}

// ==========================================
// KNOWLEDGE BASE - LIST
// ==========================================

function mockListArticles(
  params = {}
) {
  let items = [
    ...mockArticleStore
  ];

  if (params.status) {
    items = items.filter(
      (item) =>
        item.status === params.status
    );
  }

  if (params.category) {
    items = items.filter(
      (item) =>
        item.category === params.category
    );
  }

  if (params.q) {
    const searchText =
      String(params.q)
        .trim()
        .toLowerCase();

    items = items.filter(
      (item) =>
        [
          item.title,
          item.summary,
          item.content,
          item.category,
          ...(item.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchText)
    );
  }

  if (params.sort === "oldest") {
    items.sort(
      (a, b) =>
        new Date(a.createdAt) -
        new Date(b.createdAt)
    );
  } else if (
    params.sort === "title"
  ) {
    items.sort(
      (a, b) =>
        String(a.title)
          .localeCompare(
            String(b.title)
          )
    );
  } else {
    items.sort(
      (a, b) =>
        new Date(
          b.updatedAt ||
          b.createdAt
        ) -
        new Date(
          a.updatedAt ||
          a.createdAt
        )
    );
  }

  return paginate(
    items,
    params
  );
}

// ==========================================
// KNOWLEDGE BASE - GET
// ==========================================

function mockGetArticle(id) {
  const article =
    getMockArticleDetail(id);

  if (!article) {
    return mockError(
      "Article not found."
    );
  }

  return mock({
    data: article,
  });
}

// ==========================================
// KNOWLEDGE BASE - CREATE
// ==========================================

function mockCreateArticle(
  body = {}
) {
  const validation =
    validateArticle(body);

  if (validation) return validation;

  const now =
    new Date().toISOString();

  const article = {
    _id: makeId("mock-article"),
    title:
      String(body.title).trim(),
    summary:
      body.summary || "",
    content:
      body.content,
    category:
      body.category || "General",
    tags:
      Array.isArray(body.tags)
        ? body.tags
        : [],
    status:
      body.status || "Draft",
    createdAt: now,
    updatedAt: now,
    publishedAt:
      body.status === "Published"
        ? now
        : null,
  };

  mockArticleStore.unshift(
    article
  );

  mockArticleDetails[
    article._id
  ] = article;

  return mock({
    data: article,
  });
}

// ==========================================
// KNOWLEDGE BASE - UPDATE
// ==========================================

function mockUpdateArticle(
  id,
  body = {}
) {
  const article =
    getMockArticleDetail(id);

  if (!article) {
    return mockError(
      "Article not found."
    );
  }

  const validation =
    validateArticle(
      body,
      article
    );

  if (validation) return validation;

  const previousStatus =
    article.status;

  const allowedFields = [
    "title",
    "summary",
    "content",
    "category",
    "tags",
    "status",
  ];

  allowedFields.forEach(
    (field) => {
      if (
        Object.prototype.hasOwnProperty.call(
          body,
          field
        )
      ) {
        article[field] =
          body[field];
      }
    }
  );

  const now =
    new Date().toISOString();

  article.updatedAt = now;

  if (
    article.status === "Published" &&
    previousStatus !== "Published"
  ) {
    article.publishedAt = now;
  }

  syncMockArticle(article);

  return mock({
    data: article,
  });
}

// ==========================================
// KNOWLEDGE BASE - DELETE
// ==========================================

function mockDeleteArticle(id) {
  const index =
    mockArticleStore.findIndex(
      (item) =>
        item._id === id
    );

  if (index === -1) {
    return mockError(
      "Article not found."
    );
  }

  mockArticleStore.splice(
    index,
    1
  );

  delete mockArticleDetails[id];

  return mock({
    message:
      "Article deleted successfully.",
  });
}

// ==========================================
// INVENTORY & ASSETS
// Part 4 continues below this heading
// ==========================================

/* ==========================================
   INVENTORY & ASSETS - CONFIGURATION
   ========================================== */

const assetTypes = [
  "Hardware",
  "Software",
  "License",
  "Consumable",
];

const assetStatuses = [
  "In Stock",
  "Assigned",
  "In Repair",
  "Retired",
];

/* ==========================================
   INVENTORY & ASSETS - MOCK DATA
   ========================================== */

const assetStore = [
  {
    _id: "asset-001",
    name: "Dell Latitude Laptop",
    type: "Hardware",
    code: "AST-001",
    category: "Computers",
    quantity: 8,
    unit: "pcs",
    reorderLevel: 2,
    status: "In Stock",
    serialNumber: "DL-1001",
    location: "Main Office",
    cost: 52000,
    purchaseDate: "2026-01-15",
    warrantyUntil: "2028-01-15",
    productId: null,
    notes: "Office laptop inventory",
    assignment: null,
    createdAt: "2026-11-01T09:00:00.000Z",
    updatedAt: "2026-11-01T09:00:00.000Z",
  },
  {
    _id: "asset-002",
    name: "HP LaserJet Printer",
    type: "Hardware",
    code: "AST-002",
    category: "Printers",
    quantity: 1,
    unit: "pcs",
    reorderLevel: 2,
    status: "In Stock",
    serialNumber: "HP-2002",
    location: "Storage Room",
    cost: 18500,
    purchaseDate: "2025-08-10",
    warrantyUntil: "2027-08-10",
    productId: null,
    notes: "Shared office printer",
    assignment: null,
    createdAt: "2026-11-02T09:00:00.000Z",
    updatedAt: "2026-11-02T09:00:00.000Z",
  },
  {
    _id: "asset-003",
    name: "Microsoft Office License",
    type: "License",
    code: "AST-003",
    category: "Productivity",
    quantity: 12,
    unit: "licenses",
    reorderLevel: 3,
    status: "In Stock",
    serialNumber: "",
    location: "Digital Inventory",
    cost: 6500,
    purchaseDate: "2026-04-01",
    warrantyUntil: null,
    productId: null,
    notes: "Office productivity licenses",
    assignment: null,
    createdAt: "2026-11-03T09:00:00.000Z",
    updatedAt: "2026-11-03T09:00:00.000Z",
  },
  {
    _id: "asset-004",
    name: "Ethernet Cable",
    type: "Consumable",
    code: "AST-004",
    category: "Networking",
    quantity: 3,
    unit: "pcs",
    reorderLevel: 5,
    status: "In Stock",
    serialNumber: "",
    location: "Network Storage",
    cost: 250,
    purchaseDate: "2026-06-10",
    warrantyUntil: null,
    productId: null,
    notes: "Cat6 network cables",
    assignment: null,
    createdAt: "2026-11-04T09:00:00.000Z",
    updatedAt: "2026-11-04T09:00:00.000Z",
  },
  {
    _id: "asset-005",
    name: "Lenovo ThinkPad",
    type: "Hardware",
    code: "AST-005",
    category: "Computers",
    quantity: 1,
    unit: "pcs",
    reorderLevel: 0,
    status: "Assigned",
    serialNumber: "LEN-5005",
    location: "Client Site",
    cost: 61000,
    purchaseDate: "2026-02-20",
    warrantyUntil: "2029-02-20",
    productId: null,
    notes: "Assigned customer laptop",
    assignment: {
      customerName: "ABC Technologies",
      workOrderId: null,
      assignedAt: "2026-11-05T10:00:00.000Z",
    },
    createdAt: "2026-11-05T09:00:00.000Z",
    updatedAt: "2026-11-05T10:00:00.000Z",
  },
  {
    _id: "asset-006",
    name: "Network Router",
    type: "Hardware",
    code: "AST-006",
    category: "Networking",
    quantity: 2,
    unit: "pcs",
    reorderLevel: 1,
    status: "In Repair",
    serialNumber: "RTR-6006",
    location: "Service Center",
    cost: 9500,
    purchaseDate: "2025-10-12",
    warrantyUntil: "2027-10-12",
    productId: null,
    notes: "Under maintenance",
    assignment: null,
    createdAt: "2026-11-06T09:00:00.000Z",
    updatedAt: "2026-11-06T09:00:00.000Z",
  },
];

/* ==========================================
   INVENTORY & ASSETS - HELPERS
   ========================================== */

function assetMockResponse(value) {
  return Promise.resolve(structuredClone(value));
}

function assetMockError(
  message,
  errors = null,
  status = 400
) {
  const error = new Error(message);
  error.status = status;

  if (errors) {
    error.errors = errors;
  }

  return Promise.reject(error);
}

function assetHas(body, field) {
  return Object.prototype.hasOwnProperty.call(
    body,
    field
  );
}

function assetView(asset) {
  return {
    ...asset,
    lowStock:
      asset.status !== "Retired" &&
      Number(asset.quantity) <=
        Number(asset.reorderLevel),
  };
}

function assetFind(id) {
  return assetStore.find(
    (item) => item._id === id
  );
}

/* ==========================================
   INVENTORY & ASSETS - VALIDATION
   ========================================== */

function assetValidate(body = {}, existing = null) {
  const merged = {
    ...(existing || {}),
    ...body,
  };

  const errors = {};

  if (!String(merged.name || "").trim()) {
    errors.name = "Asset name is required.";
  } else if (String(merged.name).length > 120) {
    errors.name = "Maximum 120 characters.";
  }

  if (!assetTypes.includes(merged.type)) {
    errors.type = "Select a valid asset type.";
  }

  const limits = {
    code: 40,
    category: 60,
    serialNumber: 80,
    location: 120,
    notes: 1000,
  };

  Object.entries(limits).forEach(([field, max]) => {
    if (String(merged[field] ?? "").length > max) {
      errors[field] = `Maximum ${max} characters.`;
    }
  });

  const code = String(
    merged.code || ""
  ).trim().toLowerCase();

  if (
    code &&
    assetStore.some(
      (item) =>
        item._id !== existing?._id &&
        String(item.code || "")
          .trim()
          .toLowerCase() === code
    )
  ) {
    return assetMockError(
      "Asset code already exists.",
      {
        code: "Asset code must be unique.",
      },
      409
    );
  }

  for (const field of [
    "quantity",
    "reorderLevel",
  ]) {
    const value =
      merged[field] ??
      (field === "quantity" ? 1 : 0);

    if (
      value === "" ||
      !Number.isInteger(Number(value)) ||
      Number(value) < 0
    ) {
      errors[field] =
        "Enter a non-negative whole number.";
    }
  }

  if (
    merged.cost !== undefined &&
    merged.cost !== null &&
    merged.cost !== "" &&
    (
      !Number.isFinite(Number(merged.cost)) ||
      Number(merged.cost) < 0
    )
  ) {
    errors.cost = "Enter a valid cost.";
  }

  if (assetHas(body, "status")) {
    if (
      !assetStatuses.includes(body.status) ||
      body.status === "Assigned"
    ) {
      errors.status =
        "Use the Assign action for assignment.";
    }

    if (
      existing?.assignment &&
      body.status !== existing.status
    ) {
      errors.status =
        "Unassign this asset first.";
    }
  }

  for (const field of [
    "purchaseDate",
    "warrantyUntil",
  ]) {
    if (
      merged[field] &&
      !/^\d{4}-\d{2}-\d{2}$/.test(
        String(merged[field])
      )
    ) {
      errors[field] =
        "Use YYYY-MM-DD date format.";
    }
  }

  return Object.keys(errors).length
    ? assetMockError(
        "Validation failed.",
        errors
      )
    : null;
}

/* ==========================================
   INVENTORY & ASSETS - LIST
   ========================================== */

function assetList(params = {}) {
  let items = assetStore.map(assetView);

  if (params.status) {
    items = items.filter(
      (a) => a.status === params.status
    );
  }

  if (params.type) {
    items = items.filter(
      (a) => a.type === params.type
    );
  }

  if (String(params.lowStock) === "true") {
    items = items.filter(
      (a) => a.lowStock
    );
  }

  if (params.q) {
    const q = String(params.q)
      .trim()
      .toLowerCase();

    items = items.filter((a) =>
      [
        a.name,
        a.code,
        a.serialNumber,
        a.category,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(q)
      )
    );
  }

  if (params.sort === "name") {
    items.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  } else if (params.sort === "quantity") {
    items.sort(
      (a, b) => a.quantity - b.quantity
    );
  } else {
    items.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );
  }

  const page = Math.max(
    1,
    Number(params.page) || 1
  );

  const limit = Math.min(
    100,
    Math.max(
      1,
      Number(params.limit) || 20
    )
  );

  const total = items.length;

  return assetMockResponse({
    data: items.slice(
      (page - 1) * limit,
      page * limit
    ),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

/* ==========================================
   INVENTORY & ASSETS - GET
   ========================================== */

function assetGet(id) {
  const asset = assetFind(id);

  return asset
    ? assetMockResponse({
        data: assetView(asset),
      })
    : assetMockError(
        "Asset not found.",
        null,
        404
      );
}

/* ==========================================
   INVENTORY & ASSETS - CREATE
   ========================================== */

function assetCreate(body = {}) {
  const validation = assetValidate(body);

  if (validation) {
    return validation;
  }

  const now = new Date().toISOString();

  const asset = {
    _id: makeId("mock-asset"),
    name: String(body.name).trim(),
    type: body.type,
    code: String(
      body.code || ""
    ).trim(),
    category: String(
      body.category || ""
    ).trim(),
    quantity: Number(
      body.quantity ?? 1
    ),
    unit: String(
      body.unit || "pcs"
    ).trim(),
    reorderLevel: Number(
      body.reorderLevel ?? 0
    ),
    status: "In Stock",
    serialNumber: String(
      body.serialNumber || ""
    ).trim(),
    location: String(
      body.location || ""
    ).trim(),
    cost:
      body.cost === undefined ||
      body.cost === null ||
      body.cost === ""
        ? null
        : Number(body.cost),
    purchaseDate:
      body.purchaseDate || null,
    warrantyUntil:
      body.warrantyUntil || null,
    productId: body.productId
      ? populateProduct(body.productId)
      : null,
    notes: String(body.notes || ""),
    assignment: null,
    createdAt: now,
    updatedAt: now,
  };

  assetStore.unshift(asset);

  return assetMockResponse({
    data: assetView(asset),
  });
}

// ==========================================
// INVENTORY & ASSETS - UPDATE
// Part 5 continues below this heading
// ==========================================

function assetUpdate(id, body = {}) {
  const asset = assetFind(id);

  if (!asset) {
    return assetMockError(
      "Asset not found.",
      null,
      404
    );
  }

  if (
    assetHas(body, "quantity") ||
    assetHas(body, "assignment")
  ) {
    return assetMockError(
      "Use the stock adjustment or assignment action."
    );
  }

  const validation = assetValidate(
    body,
    asset
  );

  if (validation) {
    return validation;
  }

  const fields = [
    "name",
    "type",
    "code",
    "category",
    "unit",
    "reorderLevel",
    "status",
    "serialNumber",
    "location",
    "cost",
    "purchaseDate",
    "warrantyUntil",
    "productId",
    "notes",
  ];

  for (const field of fields) {
    if (assetHas(body, field)) {
      if (field === "productId") {
        asset.productId = body.productId
          ? typeof body.productId === "object"
            ? body.productId
            : populateProduct(body.productId)
          : null;
      } else if (field === "reorderLevel") {
        asset.reorderLevel = Number(
          body[field]
        );
      } else if (field === "cost") {
        asset.cost =
          body[field] === "" ||
          body[field] === null ||
          body[field] === undefined
            ? null
            : Number(body[field]);
      } else {
        asset[field] = body[field];
      }
    }
  }

  asset.updatedAt = new Date().toISOString();

  return assetMockResponse({
    data: assetView(asset),
  });
}

// ==========================================
// INVENTORY & ASSETS - ASSIGN
// ==========================================

async function assetAssign(id, body = {}) {
  const asset = assetFind(id);

  if (!asset) {
    return assetMockError(
      "Asset not found.",
      null,
      404
    );
  }

  if (asset.status === "Retired") {
    return assetMockError(
      "Retired assets cannot be assigned."
    );
  }

  if (asset.assignment) {
    return assetMockError(
      "Asset is already assigned."
    );
  }

  const customerName = String(
    body.customerName || ""
  ).trim();

  const workOrderId =
    body.workOrderId?._id ||
    body.workOrderId ||
    null;

  if (!customerName && !workOrderId) {
    return assetMockError(
      "Customer name or work order is required.",
      {
        customerName:
          "Enter a customer or select a work order.",
      }
    );
  }

  let workOrder = null;

  if (workOrderId) {
    workOrder = getMockWorkOrder(workOrderId);

    if (!workOrder) {
      return assetMockError(
        "Work order not found.",
        null,
        404
      );
    }

    if (
      ["Completed", "Cancelled"].includes(
        workOrder.status
      )
    ) {
      return assetMockError(
        "Select an active work order."
      );
    }
  }

  const now = new Date().toISOString();

  asset.assignment = {
    customerName:
      customerName ||
      workOrder?.customer?.name ||
      "",
    workOrderId: workOrder
      ? {
          _id: workOrder._id,
          number: workOrder.number,
          title: workOrder.title,
        }
      : null,
    assignedAt: now,
  };

  asset.status = "Assigned";
  asset.updatedAt = now;

  return assetMockResponse({
    data: assetView(asset),
  });
}

// ==========================================
// INVENTORY & ASSETS - UNASSIGN
// ==========================================

function assetUnassign(id) {
  const asset = assetFind(id);

  if (!asset) {
    return assetMockError(
      "Asset not found.",
      null,
      404
    );
  }

  if (!asset.assignment) {
    return assetMockError(
      "Asset is not assigned."
    );
  }

  asset.assignment = null;
  asset.status = "In Stock";
  asset.updatedAt = new Date().toISOString();

  return assetMockResponse({
    data: assetView(asset),
  });
}

// ==========================================
// INVENTORY & ASSETS - ADJUST STOCK
// ==========================================

function assetAdjustStock(id, body = {}) {
  const asset = assetFind(id);

  if (!asset) {
    return assetMockError(
      "Asset not found.",
      null,
      404
    );
  }

  const change = Number(body.change);

  if (
    body.change === undefined ||
    body.change === null ||
    body.change === "" ||
    !Number.isInteger(change) ||
    change === 0
  ) {
    return assetMockError(
      "Change must be a non-zero integer.",
      {
        change:
          "Enter a valid whole number.",
      }
    );
  }

  if (asset.quantity + change < 0) {
    return assetMockError(
      "Quantity cannot go below zero.",
      {
        change: "Insufficient stock.",
      }
    );
  }

  asset.quantity += change;
  asset.updatedAt = new Date().toISOString();

  return assetMockResponse({
    data: assetView(asset),
  });
}

// ==========================================
// INVENTORY & ASSETS - DELETE
// ==========================================

function assetDelete(id) {
  const index = assetStore.findIndex(
    (asset) => asset._id === id
  );

  if (index === -1) {
    return assetMockError(
      "Asset not found.",
      null,
      404
    );
  }

  assetStore.splice(index, 1);

  return assetMockResponse({
    message: "Asset deleted successfully.",
  });
}

// ==========================================
// STAFF AND PRODUCTS - API HELPERS
// ==========================================

function mockListStaff(params = {}) {
  let items = [...mockStaff];

  if (params.q) {
    const searchText = String(params.q)
      .trim()
      .toLowerCase();

    items = items.filter((person) =>
      [
        person.name,
        person.email,
        person.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchText)
    );
  }

  if (params.status) {
    items = items.filter(
      (person) => person.status === params.status
    );
  }

  return paginate(items, params);
}

function mockListProducts(params = {}) {
  let items = [...mockProducts];

  if (params.q) {
    const searchText = String(params.q)
      .trim()
      .toLowerCase();

    items = items.filter((product) =>
      [
        product.name,
        product.code,
        product.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchText)
    );
  }

  if (params.category) {
    items = items.filter(
      (product) =>
        product.category === params.category
    );
  }

  return paginate(items, params);
}

// ==========================================
// DASHBOARD - MOCK HELPER
// ==========================================

function mockGetDashboard() {
  if (mockData.dashboard?.data) {
    return mock(mockData.dashboard);
  }

  const totalTickets = mockTicketStore.length;
  const totalWorkOrders = mockWorkOrderStore.length;

  return mock({
    data: {
      totalTickets,
      openTickets: mockTicketStore.filter(
        (ticket) => ticket.status === "Open"
      ).length,
      inProgressTickets: mockTicketStore.filter(
        (ticket) => ticket.status === "In Progress"
      ).length,
      resolvedTickets: mockTicketStore.filter(
        (ticket) => ticket.status === "Resolved"
      ).length,
      totalWorkOrders,
      activeWorkOrders: mockWorkOrderStore.filter(
        (order) =>
          order.status === "Scheduled" ||
          order.status === "In Progress"
      ).length,
      completedWorkOrders: mockWorkOrderStore.filter(
        (order) => order.status === "Completed"
      ).length,
      totalArticles: mockArticleStore.length,
      publishedArticles: mockArticleStore.filter(
        (article) => article.status === "Published"
      ).length,
      totalStaff: mockStaff.length,
      totalProducts: mockProducts.length,
      totalAssets: assetStore.length,
      lowStockAssets: assetStore.filter(
        (asset) => assetView(asset).lowStock
      ).length,
      recentTickets: mockTicketStore.slice(0, 5),
      recentWorkOrders: mockWorkOrderStore.slice(0, 5),
    },
  });
}

// ==========================================
// REAL API ADAPTER
// Converts between the shapes the pages use
// and the shapes the backend sends and accepts
// ==========================================

const WORK_ORDER_STATUS_TO_API = {
  Draft: "Planned",
  Scheduled: "Planned",
};

const WORK_ORDER_STATUS_FROM_API = {
  Planned: "Scheduled",
};

const API_WORK_ORDER_SORTS = ["newest", "dueDate"];
const API_KB_STATUSES = ["Draft", "Published"];
const PRIORITY_ORDER = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

function apiPath(path) {
  return String(path).replace(/^\/knowledge-base(?=\/|\?|$)/, "/kb-articles");
}

function dateOnly(value) {
  if (!value) return null;
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text;
}

function refId(value) {
  if (value === "" || value === undefined) return value === "" ? null : undefined;
  if (value && typeof value === "object") return value._id ?? null;
  return value;
}

function cleanRefs(body, fields) {
  const out = { ...body };
  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(out, field)) {
      out[field] = refId(out[field]);
    }
  });
  return out;
}

function mapOne(response, convert) {
  const data = response?.data;
  return { ...response, data: data ? convert(data) : data };
}

function mapPage(response, convert) {
  const rows = Array.isArray(response?.data) ? response.data : [];
  return {
    ...response,
    data: rows.map(convert),
    pagination: response?.pagination ?? {
      page: 1,
      limit: rows.length,
      total: rows.length,
      pages: 1,
    },
  };
}

function sortPageLocally(rows, sort) {
  const list = [...rows];
  if (sort === "oldest") {
    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sort === "priority") {
    list.sort(
      (a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99) ||
        new Date(b.createdAt) - new Date(a.createdAt)
    );
  }
  return list;
}

// ---------- Tickets ----------

function fromApiNote(note) {
  if (!note) return note;
  return {
    ...note,
    body: note.text,
    isInternal: true,
    createdBy: { _id: note.authorId ?? null, name: note.authorName || "Staff" },
  };
}

function fromApiTicket(ticket) {
  if (!ticket) return ticket;
  return {
    ...ticket,
    notes: Array.isArray(ticket.notes) ? ticket.notes.map(fromApiNote) : ticket.notes,
  };
}

function toApiTicket(body = {}) {
  const out = cleanRefs(body, ["assignedTo", "productId"]);
  delete out._id;
  delete out.number;
  delete out.notes;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.resolvedAt;
  delete out.closedAt;
  return out;
}

async function apiAddNote(id, body = {}) {
  const text = String(body?.text ?? body?.body ?? "").trim();
  const response = await apiFetch(`${BASE_URL}/tickets/${id}/notes`, {
    method: "POST",
    body: { text },
  });
  const ticket = fromApiTicket(response?.data);
  const notes = ticket?.notes || [];
  return { data: notes[notes.length - 1] ?? null, ticket };
}

// ---------- Work orders ----------

function fromApiMilestone(milestone) {
  if (!milestone) return milestone;
  return {
    ...milestone,
    dueDate: dateOnly(milestone.dueDate),
    status: milestone.done ? "Completed" : "Pending",
    completedAt: milestone.doneAt ?? null,
  };
}

function fromApiWorkOrder(workOrder) {
  if (!workOrder) return workOrder;
  return {
    ...workOrder,
    status: WORK_ORDER_STATUS_FROM_API[workOrder.status] || workOrder.status,
    startDate: dateOnly(workOrder.startDate),
    dueDate: dateOnly(workOrder.dueDate),
    scheduledStart: dateOnly(workOrder.startDate),
    scheduledEnd: dateOnly(workOrder.dueDate),
    milestones: Array.isArray(workOrder.milestones)
      ? workOrder.milestones.map(fromApiMilestone)
      : workOrder.milestones,
  };
}

function toApiWorkOrder(body = {}) {
  const out = cleanRefs(body, ["assignedTo", "productId"]);
  if (Object.prototype.hasOwnProperty.call(out, "scheduledStart")) {
    out.startDate = out.scheduledStart || null;
    delete out.scheduledStart;
  }
  if (Object.prototype.hasOwnProperty.call(out, "scheduledEnd")) {
    out.dueDate = out.scheduledEnd || null;
    delete out.scheduledEnd;
  }
  if (out.status && WORK_ORDER_STATUS_TO_API[out.status]) {
    out.status = WORK_ORDER_STATUS_TO_API[out.status];
  }
  [
    "_id", "number", "ticketId", "milestones", "dealId", "progress",
    "milestonesTotal", "milestonesDone", "overdue", "completedAt",
    "createdAt", "updatedAt",
  ].forEach((field) => delete out[field]);
  return out;
}

function workOrderParams(params = {}) {
  const out = { ...params };
  if (out.status && WORK_ORDER_STATUS_TO_API[out.status]) {
    out.status = WORK_ORDER_STATUS_TO_API[out.status];
  }
  if (out.sort && !API_WORK_ORDER_SORTS.includes(out.sort)) {
    delete out.sort;
  }
  return out;
}

async function apiListWorkOrders(params = {}) {
  const response = await apiFetch(
    `${BASE_URL}/work-orders${query(workOrderParams(params))}`
  );
  const page = mapPage(response, fromApiWorkOrder);
  return { ...page, data: sortPageLocally(page.data, params.sort) };
}

function toApiMilestone(body = {}) {
  const out = {};
  if (body.title !== undefined) out.title = body.title;
  if (body.dueDate !== undefined) out.dueDate = body.dueDate || null;
  if (typeof body.done === "boolean") out.done = body.done;
  else if (body.status !== undefined) out.done = body.status === "Completed";
  return out;
}

function findMilestoneIn(workOrder, milestoneId) {
  return (workOrder?.milestones || []).find(
    (milestone) => String(milestone._id) === String(milestoneId)
  );
}

async function apiCreateMilestone(workOrderId, body = {}) {
  const input = toApiMilestone(body);
  let response = await apiFetch(`${BASE_URL}/work-orders/${workOrderId}/milestones`, {
    method: "POST",
    body: { title: input.title, dueDate: input.dueDate ?? null },
  });
  let workOrder = response?.data;
  const list = workOrder?.milestones || [];
  let created = list[list.length - 1];

  if (created && input.done) {
    response = await apiFetch(
      `${BASE_URL}/work-orders/${workOrderId}/milestones/${created._id}`,
      { method: "PATCH", body: { done: true } }
    );
    workOrder = response?.data;
    created = findMilestoneIn(workOrder, created._id) || created;
  }

  return { data: fromApiMilestone(created) ?? null, workOrder: fromApiWorkOrder(workOrder) };
}

async function apiUpdateMilestone(workOrderId, milestoneId, body = {}) {
  const input = toApiMilestone(body);
  const response = Object.keys(input).length
    ? await apiFetch(`${BASE_URL}/work-orders/${workOrderId}/milestones/${milestoneId}`, {
        method: "PATCH",
        body: input,
      })
    : await apiFetch(`${BASE_URL}/work-orders/${workOrderId}`);
  const workOrder = response?.data;
  return {
    data: fromApiMilestone(findMilestoneIn(workOrder, milestoneId)) ?? null,
    workOrder: fromApiWorkOrder(workOrder),
  };
}

async function apiDeleteMilestone(workOrderId, milestoneId) {
  const response = await apiFetch(
    `${BASE_URL}/work-orders/${workOrderId}/milestones/${milestoneId}`,
    { method: "DELETE" }
  );
  return {
    message: "Milestone deleted successfully.",
    workOrder: fromApiWorkOrder(response?.data),
  };
}

// ---------- Knowledge base ----------

function toApiArticle(body = {}) {
  const out = { ...body };
  if (out.status && !API_KB_STATUSES.includes(out.status)) {
    out.status = "Draft";
  }
  ["_id", "views", "publishedAt", "authorId", "authorName", "createdAt", "updatedAt"]
    .forEach((field) => delete out[field]);
  return out;
}

function articleParams(params = {}) {
  const out = { ...params };
  if (out.status && !API_KB_STATUSES.includes(out.status)) {
    delete out.status;
  }
  delete out.sort;
  return out;
}

async function apiListArticles(params = {}) {
  const response = await apiFetch(`${BASE_URL}/kb-articles${query(articleParams(params))}`);
  const page = mapPage(response, (article) => article);
  if (params.sort === "title") {
    page.data = [...page.data].sort((a, b) => String(a.title).localeCompare(String(b.title)));
  } else if (params.sort === "oldest") {
    page.data = [...page.data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  return page;
}

// ---------- Assets ----------

function fromApiAsset(asset) {
  if (!asset) return asset;
  return {
    ...asset,
    purchaseDate: dateOnly(asset.purchaseDate),
    warrantyUntil: dateOnly(asset.warrantyUntil),
    lowStock:
      asset.lowStock ??
      (asset.status !== "Retired" && Number(asset.quantity) <= Number(asset.reorderLevel)),
  };
}

function toApiAsset(body = {}, { creating = false } = {}) {
  const out = cleanRefs(body, ["productId"]);
  ["_id", "assignment", "lowStock", "createdAt", "updatedAt"].forEach((field) => delete out[field]);
  if (!creating) delete out.quantity;
  if (creating) delete out.status;
  if (out.status === "Assigned") delete out.status;
  return out;
}

function toApiAssign(body = {}) {
  const out = {};
  const customerName = String(body.customerName || "").trim();
  const workOrderId = refId(body.workOrderId);
  if (customerName) out.customerName = customerName;
  if (workOrderId) out.workOrderId = workOrderId;
  return out;
}

// ==========================================
// FINAL OPERATIONS API OBJECT
// ==========================================

export const opsApi = {
  getDashboard: () =>
    USE_MOCK ? mockGetDashboard() : apiFetch(`${BASE_URL}/dashboard`),

  dashboard: () =>
    USE_MOCK ? mockGetDashboard() : apiFetch(`${BASE_URL}/dashboard`),

  search: (q) =>
    apiFetch(`${BASE_URL}/search${query({ q })}`),

  staff: (params = {}) =>
    USE_MOCK
      ? mockListStaff(params)
      : apiFetch(`${BASE_URL}/staff${query(params)}`).then((r) => mapPage(r, (x) => x)),

  listStaff: (params = {}) =>
    USE_MOCK
      ? mockListStaff(params)
      : apiFetch(`${BASE_URL}/staff${query(params)}`).then((r) => mapPage(r, (x) => x)),

  products: (params = {}) =>
    USE_MOCK
      ? mockListProducts(params)
      : apiFetch(`${BASE_URL}/products${query(params)}`).then((r) => mapPage(r, (x) => x)),

  listProducts: (params = {}) =>
    USE_MOCK
      ? mockListProducts(params)
      : apiFetch(`${BASE_URL}/products${query(params)}`).then((r) => mapPage(r, (x) => x)),

  listTickets: (params = {}) =>
    USE_MOCK
      ? mockTickets(params)
      : apiFetch(`${BASE_URL}/tickets${query(params)}`).then((r) => mapPage(r, fromApiTicket)),

  getTicket: (id) =>
    USE_MOCK
      ? mockGetTicket(id)
      : apiFetch(`${BASE_URL}/tickets/${id}`).then((r) => mapOne(r, fromApiTicket)),

  createTicket: (body) =>
    USE_MOCK
      ? mockCreateTicket(body)
      : apiFetch(`${BASE_URL}/tickets`, { method: "POST", body: toApiTicket(body) })
          .then((r) => mapOne(r, fromApiTicket)),

  updateTicket: (id, body) =>
    USE_MOCK
      ? mockUpdateTicket(id, body)
      : apiFetch(`${BASE_URL}/tickets/${id}`, { method: "PATCH", body: toApiTicket(body) })
          .then((r) => mapOne(r, fromApiTicket)),

  deleteTicket: (id) =>
    apiFetch(`${BASE_URL}/tickets/${id}`, { method: "DELETE" }),

  addNote: (id, body) =>
    USE_MOCK ? mockAddNote(id, body) : apiAddNote(id, body),

  listWorkOrders: (params = {}) =>
    USE_MOCK ? mockListWorkOrders(params) : apiListWorkOrders(params),

  getWorkOrder: (id) =>
    USE_MOCK
      ? mockGetWorkOrder(id)
      : apiFetch(`${BASE_URL}/work-orders/${id}`).then((r) => mapOne(r, fromApiWorkOrder)),

  createWorkOrder: (body) =>
    USE_MOCK
      ? mockCreateWorkOrder(body)
      : apiFetch(`${BASE_URL}/work-orders`, { method: "POST", body: toApiWorkOrder(body) })
          .then((r) => mapOne(r, fromApiWorkOrder)),

  updateWorkOrder: (id, body) =>
    USE_MOCK
      ? mockUpdateWorkOrder(id, body)
      : apiFetch(`${BASE_URL}/work-orders/${id}`, { method: "PATCH", body: toApiWorkOrder(body) })
          .then((r) => mapOne(r, fromApiWorkOrder)),

  deleteWorkOrder: (id) =>
    USE_MOCK
      ? mockDeleteWorkOrder(id)
      : apiFetch(`${BASE_URL}/work-orders/${id}`, { method: "DELETE" }),

  listWonDeals: () =>
    apiFetch(`${BASE_URL}/won-deals`),

  createWorkOrderFromDeal: (dealId) =>
    apiFetch(`${BASE_URL}/work-orders/from-deal/${dealId}`, { method: "POST" })
      .then((r) => mapOne(r, fromApiWorkOrder)),

  createMilestone: (workOrderId, body) =>
    USE_MOCK
      ? mockCreateMilestone(workOrderId, body)
      : apiCreateMilestone(workOrderId, body),

  updateMilestone: (workOrderId, milestoneId, body) =>
    USE_MOCK
      ? mockUpdateMilestone(workOrderId, milestoneId, body)
      : apiUpdateMilestone(workOrderId, milestoneId, body),

  deleteMilestone: (workOrderId, milestoneId) =>
    USE_MOCK
      ? mockDeleteMilestone(workOrderId, milestoneId)
      : apiDeleteMilestone(workOrderId, milestoneId),

  listArticles: (params = {}) =>
    USE_MOCK ? mockListArticles(params) : apiListArticles(params),

  listCategories: () =>
    apiFetch(`${BASE_URL}/kb-articles/categories`),

  getArticle: (id) =>
    USE_MOCK
      ? mockGetArticle(id)
      : apiFetch(`${BASE_URL}/kb-articles/${id}`),

  createArticle: (body) =>
    USE_MOCK
      ? mockCreateArticle(body)
      : apiFetch(`${BASE_URL}/kb-articles`, { method: "POST", body: toApiArticle(body) }),

  updateArticle: (id, body) =>
    USE_MOCK
      ? mockUpdateArticle(id, body)
      : apiFetch(`${BASE_URL}/kb-articles/${id}`, { method: "PATCH", body: toApiArticle(body) }),

  deleteArticle: (id) =>
    USE_MOCK
      ? mockDeleteArticle(id)
      : apiFetch(`${BASE_URL}/kb-articles/${id}`, { method: "DELETE" }),

  listAssets: (params = {}) =>
    USE_MOCK
      ? assetList(params)
      : apiFetch(`${BASE_URL}/assets${query(params)}`).then((r) => mapPage(r, fromApiAsset)),

  getAsset: (id) =>
    USE_MOCK
      ? assetGet(id)
      : apiFetch(`${BASE_URL}/assets/${id}`).then((r) => mapOne(r, fromApiAsset)),

  createAsset: (body) =>
    USE_MOCK
      ? assetCreate(body)
      : apiFetch(`${BASE_URL}/assets`, { method: "POST", body: toApiAsset(body, { creating: true }) })
          .then((r) => mapOne(r, fromApiAsset)),

  updateAsset: (id, body) =>
    USE_MOCK
      ? assetUpdate(id, body)
      : apiFetch(`${BASE_URL}/assets/${id}`, { method: "PATCH", body: toApiAsset(body) })
          .then((r) => mapOne(r, fromApiAsset)),

  assignAsset: (id, body) =>
    USE_MOCK
      ? assetAssign(id, body)
      : apiFetch(`${BASE_URL}/assets/${id}/assign`, { method: "POST", body: toApiAssign(body) })
          .then((r) => mapOne(r, fromApiAsset)),

  unassignAsset: (id) =>
    USE_MOCK
      ? assetUnassign(id)
      : apiFetch(`${BASE_URL}/assets/${id}/unassign`, { method: "POST" })
          .then((r) => mapOne(r, fromApiAsset)),

  adjustStock: (id, body) =>
    USE_MOCK
      ? assetAdjustStock(id, body)
      : apiFetch(`${BASE_URL}/assets/${id}/adjust-stock`, {
          method: "POST",
          body: { change: Number(body?.change) },
        }).then((r) => mapOne(r, fromApiAsset)),

  deleteAsset: (id) =>
    USE_MOCK
      ? assetDelete(id)
      : apiFetch(`${BASE_URL}/assets/${id}`, { method: "DELETE" }),

  get: (path, params = {}) =>
    apiFetch(`${BASE_URL}${apiPath(path)}${query(params)}`),

  post: (path, body) =>
    apiFetch(`${BASE_URL}${apiPath(path)}`, { method: "POST", body }),

  patch: (path, body) =>
    apiFetch(`${BASE_URL}${apiPath(path)}`, { method: "PATCH", body }),

  delete: (path) =>
    apiFetch(`${BASE_URL}${apiPath(path)}`, { method: "DELETE" }),
};