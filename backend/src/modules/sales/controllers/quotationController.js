const mongoose = require("mongoose");
const Quotation = require("../../../models/Quotation");
const Lead = require("../../../models/Lead");
const Deal = require("../../../models/Deal");
const Product = require("../../../models/Product");
const Employee = require("../../../models/Employee");
const Customer = require("../../../models/Customer");
const Sale = require("../../../models/Sale");
const nextSequence = require("../../../utils/nextSequence");
const { issuePortalAccess } = require("../../../utils/customerAccess");
const { TAX_RATES, MAX_ITEMS } = require("../../../models/schemas/lineItems");

const DEFAULT_TAX_RATE = 18;
const DEFAULT_VALID_DAYS = 15;
const EARLY_LEAD_STAGES = ["New", "Contacted", "Qualified", "Demo"];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    if (error.name === "ValidationError") {
      const first = Object.values(error.errors)[0];
      return res.status(400).json({ success: false, message: first?.message || "Invalid data" });
    }
    console.error("Quotation error:", error.message);
    res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
};

const getOwner = (req) => {
  const tenantId = req.user?.tenantId;
  const employeeId = req.user?.employeeId;
  if (!tenantId) throw new HttpError(403, "Tenant information is missing");
  if (!employeeId) {
    throw new HttpError(403, "Your login is not linked to an employee record. Please contact your admin.");
  }
  return { tenantId, employeeId };
};

const checkId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, `Invalid ${label} ID`);
};

const today = () => new Date().toISOString().slice(0, 10);

const isExpired = (q) =>
  q.status === "Sent" && q.validUntil && new Date(q.validUntil) < new Date();

const formatQuotation = (q) => ({
  id: q._id,
  number: q.number,
  leadId: q.leadId,
  dealId: q.dealId,
  customer: q.customer,
  customerRef: q.customerRef,
  items: q.items,
  subtotal: q.subtotal,
  taxTotal: q.taxTotal,
  amount: q.amount,
  status: isExpired(q) ? "Expired" : q.status,
  validUntil: q.validUntil,
  notes: q.notes,
  executive: q.executive,
  sentAt: q.sentAt,
  acceptedAt: q.acceptedAt,
  convertedAt: q.convertedAt,
  saleId: q.saleId,
  createdAt: q.createdAt,
});

const parseValidUntil = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, "Invalid valid-until date");
  if (date < new Date(today())) throw new HttpError(400, "Valid-until date cannot be in the past");
  return date;
};

async function buildItems(tenantId, rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new HttpError(400, "Add at least one item");
  }
  if (rawItems.length > MAX_ITEMS) throw new HttpError(400, `At most ${MAX_ITEMS} items allowed`);

  const ids = rawItems.map((i) => i?.productId);
  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw new HttpError(400, "Each item needs a valid product");
  }

  const products = await Product.find({ _id: { $in: ids }, tenantId, status: "Active" })
    .select("name type price")
    .lean();
  const byId = Object.fromEntries(products.map((p) => [String(p._id), p]));

  return rawItems.map((raw) => {
    const product = byId[String(raw.productId)];
    if (!product) throw new HttpError(400, "One of the products is not available");

    const quantity = raw.quantity === undefined ? 1 : Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
      throw new HttpError(400, `Invalid quantity for ${product.name}`);
    }

    const unitPrice = raw.unitPrice === undefined ? product.price : Number(raw.unitPrice);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new HttpError(400, `Invalid price for ${product.name}`);
    }

    const taxRate = raw.taxRate === undefined ? DEFAULT_TAX_RATE : Number(raw.taxRate);
    if (!TAX_RATES.includes(taxRate)) throw new HttpError(400, "GST must be 0, 5, 12, 18 or 28");

    return {
      productId: product._id,
      product: product.name,
      productType: product.type,
      quantity,
      unitPrice,
      taxRate,
    };
  });
}

async function findMine(req, id) {
  const { tenantId, employeeId } = getOwner(req);
  checkId(id, "quotation");
  const quotation = await Quotation.findOne({ _id: id, tenantId, executiveId: employeeId });
  if (!quotation) throw new HttpError(404, "Quotation not found");
  return quotation;
}

const listQuotations = handle(async (req, res) => {
  const { tenantId, employeeId } = getOwner(req);
  const filter = { tenantId, executiveId: employeeId };

  if (req.query.leadId) {
    checkId(req.query.leadId, "lead");
    filter.leadId = req.query.leadId;
  }
  if (req.query.status && req.query.status !== "All") {
    filter.status = String(req.query.status);
  }

  const quotations = await Quotation.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  res.status(200).json({
    success: true,
    count: quotations.length,
    quotations: quotations.map(formatQuotation),
  });
});

const getQuotation = handle(async (req, res) => {
  const quotation = await findMine(req, req.params.id);
  res.status(200).json({ success: true, quotation: formatQuotation(quotation) });
});

const createQuotation = handle(async (req, res) => {
  const { tenantId, employeeId } = getOwner(req);
  const { leadId, items, validUntil, notes } = req.body;
  checkId(leadId, "lead");

  const lead = await Lead.findOne({ _id: leadId, tenantId, executiveId: employeeId });
  if (!lead) throw new HttpError(404, "Lead not found");
  if (["Won", "Lost"].includes(lead.status)) {
    throw new HttpError(400, `This lead is already ${lead.status}`);
  }

  const builtItems = await buildItems(tenantId, items);
  const employee = await Employee.findOne({ _id: employeeId, tenantId }).select("name").lean();
  const executiveName = employee?.name || req.user.name || "";
  const customerName = lead.company || lead.name;

  let deal = await Deal.findOne({ tenantId, leadId: lead._id });
  if (!deal) {
    deal = await Deal.create({
      tenantId,
      leadId: lead._id,
      name: `${lead.name} - ${builtItems[0].product}`,
      customer: customerName,
      product: builtItems[0].product,
      status: "Proposal",
      assignedTo: executiveName,
      assignedToId: employeeId,
    });
  }

  const seq = await nextSequence(`quotation:${tenantId}`);
  const quotation = await Quotation.create({
    tenantId,
    number: `QT-${String(seq).padStart(4, "0")}`,
    dealId: deal._id,
    leadId: lead._id,
    customer: customerName,
    items: builtItems,
    validUntil: parseValidUntil(validUntil),
    notes: typeof notes === "string" ? notes : "",
    executive: executiveName,
    executiveId: employeeId,
  });

  const dealUpdate = { value: quotation.amount };
  if (!["Won", "Lost"].includes(deal.status)) dealUpdate.status = "Proposal";
  await Deal.updateOne({ _id: deal._id }, { $set: dealUpdate });

  if (EARLY_LEAD_STAGES.includes(lead.status)) {
    await Lead.updateOne({ _id: lead._id }, { $set: { status: "Proposal", value: quotation.amount } });
  }

  res.status(201).json({
    success: true,
    message: `Quotation ${quotation.number} created`,
    quotation: formatQuotation(quotation),
  });
});

const updateQuotation = handle(async (req, res) => {
  const quotation = await findMine(req, req.params.id);
  if (quotation.status !== "Draft") {
    throw new HttpError(400, "Only draft quotations can be edited");
  }

  const { items, validUntil, notes } = req.body;
  if (items !== undefined) quotation.items = await buildItems(quotation.tenantId, items);
  if (validUntil !== undefined) quotation.validUntil = parseValidUntil(validUntil) || null;
  if (notes !== undefined) quotation.notes = typeof notes === "string" ? notes : "";
  await quotation.save();

  await Deal.updateOne(
    { _id: quotation.dealId, tenantId: quotation.tenantId },
    { $set: { value: quotation.amount } }
  );

  res.status(200).json({
    success: true,
    message: "Quotation updated",
    quotation: formatQuotation(quotation),
  });
});

const changeStatus = (from, to, extra) =>
  handle(async (req, res) => {
    const quotation = await findMine(req, req.params.id);
    if (isExpired(quotation)) {
      throw new HttpError(400, "This quotation has expired. Create a new one.");
    }
    if (quotation.status !== from) {
      throw new HttpError(400, `Only ${from.toLowerCase()} quotations can be marked ${to.toLowerCase()}`);
    }

    const now = new Date();
    const set = { status: to, ...extra(quotation, now) };
    const updated = await Quotation.findOneAndUpdate(
      { _id: quotation._id, tenantId: quotation.tenantId, status: from },
      { $set: set },
      { returnDocument: "after" }
    );
    if (!updated) throw new HttpError(409, "This quotation was just changed. Refresh and try again.");

    if (to === "Accepted") {
      await Deal.updateOne(
        { _id: updated.dealId, tenantId: updated.tenantId, status: { $nin: ["Won", "Lost"] } },
        { $set: { status: "Negotiation" } }
      );
    }

    res.status(200).json({
      success: true,
      message: `Quotation ${updated.number} marked ${to.toLowerCase()}`,
      quotation: formatQuotation(updated),
    });
  });

const sendQuotation = changeStatus("Draft", "Sent", (q, now) => ({
  sentAt: now,
  validUntil: q.validUntil || new Date(now.getTime() + DEFAULT_VALID_DAYS * 24 * 60 * 60 * 1000),
}));

const acceptQuotation = changeStatus("Sent", "Accepted", (q, now) => ({ acceptedAt: now }));

const rejectQuotation = changeStatus("Sent", "Rejected", (q, now) => ({ rejectedAt: now }));

async function findOrCreateCustomer(tenantId, lead, employeeId, ownerName, body) {
  const existing = await Customer.findOne({ tenantId, leadId: lead._id });
  if (existing) return existing;

  const seq = await nextSequence(`customer:${tenantId}`);
  const customer = new Customer({
    tenantId,
    customerCode: `CUST-${String(seq).padStart(4, "0")}`,
    name: lead.name,
    company: lead.company || "",
    email: lead.email || "",
    phone: lead.phone || "",
    address: typeof body.address === "string" ? body.address : "",
    city: typeof body.city === "string" ? body.city : "",
    registrationDate: today(),
    status: "Active",
    leadId: lead._id,
    ownerId: employeeId,
    ownerName,
  });
  customer.userId = String(customer._id);

  try {
    return await customer.save();
  } catch (err) {
    if (err.code === 11000) {
      const raced = await Customer.findOne({ tenantId, leadId: lead._id });
      if (raced) return raced;
    }
    throw err;
  }
}

async function findOrCreateSale(quotation, customer, employeeId) {
  const existing = await Sale.findOne({ tenantId: quotation.tenantId, quotationId: quotation._id });
  if (existing) return existing;

  const allServices = quotation.items.every((i) => i.productType === "Service");
  const seq = await nextSequence(`sale:${quotation.tenantId}`);

  try {
    return await Sale.create({
      tenantId: quotation.tenantId,
      saleNumber: `SO-${String(seq).padStart(4, "0")}`,
      type: allServices ? "Service" : "Product",
      customerId: customer.userId || String(customer._id),
      customerRef: customer._id,
      employeeId: String(employeeId),
      executiveId: employeeId,
      quotationId: quotation._id,
      saleDate: today(),
      items: quotation.items.map((i) => ({
        productId: i.productId,
        product: i.product,
        productType: i.productType,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
        amount: i.amount,
      })),
      subtotal: quotation.subtotal,
      taxTotal: quotation.taxTotal,
      totalAmount: quotation.amount,
      saleStatus: "Confirmed",
      paymentStatus: "Unpaid",
    });
  } catch (err) {
    if (err.code === 11000) {
      const raced = await Sale.findOne({ tenantId: quotation.tenantId, quotationId: quotation._id });
      if (raced) return raced;
    }
    throw err;
  }
}

const convertQuotation = handle(async (req, res) => {
  const quotation = await findMine(req, req.params.id);
  const { tenantId, employeeId } = getOwner(req);

  if (quotation.status !== "Accepted") {
    throw new HttpError(400, "Only accepted quotations can be converted");
  }
  if (quotation.saleId) {
    throw new HttpError(409, "This quotation has already been converted");
  }

  const lead = await Lead.findOne({ _id: quotation.leadId, tenantId });
  if (!lead) throw new HttpError(400, "The lead for this quotation no longer exists");

  const customer = await findOrCreateCustomer(tenantId, lead, employeeId, quotation.executive, req.body || {});
  const sale = await findOrCreateSale(quotation, customer, employeeId);
  const now = new Date();

  const claimed = await Quotation.findOneAndUpdate(
    { _id: quotation._id, tenantId, saleId: null },
    { $set: { saleId: sale._id, customerRef: customer._id, convertedAt: now } },
    { returnDocument: "after" }
  );
  if (!claimed) throw new HttpError(409, "This quotation has already been converted");

  await Promise.all([
    Deal.updateOne(
      { _id: quotation.dealId, tenantId },
      { $set: { status: "Won", customerId: customer._id, value: quotation.amount } }
    ),
    Lead.updateOne({ _id: lead._id, tenantId }, { $set: { status: "Won", value: quotation.amount } }),
  ]);

  let portal = null;
  try {
    portal = await issuePortalAccess({ tenantId, customerId: customer._id, issuedBy: req.user.id });
  } catch (err) {
    console.error("Portal access error:", err.message);
  }

  res.status(201).json({
    success: true,
    message: `Converted. Customer ${customer.customerCode} and order ${sale.saleNumber} created.`,
    customer: {
      id: customer._id,
      customerCode: customer.customerCode,
      name: customer.name,
    },
    sale: {
      id: sale._id,
      saleNumber: sale.saleNumber,
      type: sale.type,
      totalAmount: sale.totalAmount,
      paymentStatus: sale.paymentStatus,
    },
    portal,
  });
});

module.exports = {
  listQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  convertQuotation,
};