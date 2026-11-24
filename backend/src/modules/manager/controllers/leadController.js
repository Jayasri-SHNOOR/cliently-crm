const mongoose = require('mongoose')
const Lead = require('../../../models/Lead')
const Employee = require('../../../models/Employee')
const AppError = require('../../../utils/AppError')
const escapeRegex = require('../../../utils/escapeRegex')

const { LEAD_STATUSES } = Lead
const {
  UNASSIGNED,
  SALES_ROLE,
  CLOSED,
  PRIORITIES,
  toId,
  formatLead
} = require('../helpers')

async function listLeads(req, res, next) {
  try {
    const { tenantId } = req.user
    const { status, priority, executive, search, from, to } = req.query
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)

    const filter = { tenantId }
    const and = []

    if (status && LEAD_STATUSES.includes(status)) {
      filter.status = status
    }

    if (priority && PRIORITIES.includes(priority)) {
      if (priority === 'Medium') {
        and.push({
          $or: [
            { priority: 'Medium' },
            { priority: { $exists: false } }
          ]
        })
      } else {
        filter.priority = priority
      }
    }

    if (executive === 'Unassigned') {
      and.push(UNASSIGNED)
    } else if (executive) {
      filter.executive = executive
    }

    if (search?.trim()) {
      const p = new RegExp(
        escapeRegex(search.trim().slice(0, 50)),
        'i'
      )

      and.push({
        $or: [
          { name: p },
          { company: p },
          { email: p },
          { phone: p },
          { productInterested: p },
          { productName: p }
        ]
      })
    }

    if (from || to) {
      filter.createdAt = {}

      if (from) filter.createdAt.$gte = new Date(from)
      if (to) filter.createdAt.$lte = new Date(to)
    }

    if (and.length) {
      filter.$and = and
    }

    const [leads, total, byStatus, unassigned] = await Promise.all([
      Lead.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Lead.countDocuments(filter),

      Lead.aggregate([
        { $match: { tenantId: toId(tenantId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      Lead.countDocuments({
        tenantId,
        ...UNASSIGNED
      })
    ])

    res.json({
      summary: {
        total: byStatus.reduce((s, r) => s + r.count, 0),
        unassigned,
        byStatus: Object.fromEntries(
          byStatus.map(r => [r._id, r.count])
        )
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      count: leads.length,
      leads: leads.map(formatLead)
    })
  } catch (err) {
    next(err)
  }
}

async function getLead(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new AppError('Invalid lead ID', 400)
    }

    const lead = await Lead.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    }).lean()

    if (!lead) {
      throw new AppError('Lead not found', 404)
    }

    res.json(formatLead(lead))
  } catch (err) {
    next(err)
  }
}

async function listAssignableExecutives(req, res, next) {
  try {
    const { tenantId } = req.user

    const [employees, workload] = await Promise.all([
      Employee.find({
        tenantId,
        status: 'Active',
        role: SALES_ROLE
      })
        .select('name email')
        .lean(),

      Lead.aggregate([
        {
          $match: {
            tenantId: toId(tenantId),
            status: { $nin: CLOSED },
            executiveId: { $ne: null }
          }
        },
        {
          $group: {
            _id: '$executiveId',
            count: { $sum: 1 }
          }
        }
      ])
    ])

    const load = Object.fromEntries(
      workload.map(w => [String(w._id), w.count])
    )

    res.json({
      executives: employees
        .map(e => ({
          id: e._id,
          name: e.name,
          email: e.email,
          activeLeads: load[String(e._id)] ?? 0
        }))
        .sort((a, b) => a.activeLeads - b.activeLeads)
    })
  } catch (err) {
    next(err)
  }
}

async function assignLead(req, res, next) {
  try {
    const { tenantId } = req.user
    const { id } = req.params

    const executiveId =
      typeof req.body.executiveId === 'string'
        ? req.body.executiveId.trim()
        : ''

    const executive =
      typeof req.body.executive === 'string'
        ? req.body.executive.trim()
        : ''

    const { priority, followUpDate } = req.body

    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Invalid lead ID', 400)
    }

    if (!executiveId && !executive) {
      throw new AppError('Executive is required', 400)
    }

    if (executiveId && !mongoose.isValidObjectId(executiveId)) {
      throw new AppError('Invalid executive ID', 400)
    }

    if (priority && !PRIORITIES.includes(priority)) {
      throw new AppError('Invalid priority', 400)
    }

    let followUp

    if (followUpDate) {
      followUp = new Date(followUpDate)

      if (Number.isNaN(followUp.getTime())) {
        throw new AppError('Invalid follow-up date', 400)
      }
    }

    const execFilter = {
      tenantId,
      status: 'Active',
      role: SALES_ROLE
    }

    if (executiveId) {
      execFilter._id = executiveId
    } else {
      execFilter.name = executive
    }

    const exec = await Employee.findOne(execFilter).lean()

    if (!exec) {
      throw new AppError('Executive not found or inactive', 400)
    }

    const lead = await Lead.findOne({
      _id: id,
      tenantId
    })

    if (!lead) {
      throw new AppError('Lead not found', 404)
    }

    if (CLOSED.includes(lead.status)) {
      throw new AppError('Closed leads cannot be reassigned', 400)
    }

    if (String(lead.executiveId || '') !== String(exec._id)) {
      lead.executiveId = exec._id
      lead.executive = exec.name
      lead.assignedAt = new Date()
    }

    if (priority) {
      lead.priority = priority
    }

    if (followUp) {
      lead.nextFollowUp = followUp
    }

    await lead.save()

    res.json({
      message: `Lead assigned to ${exec.name}`,
      lead: formatLead(lead)
    })
  } catch (err) {
    next(err)
  }
}

async function updateLeadPriority(req, res, next) {
  try {
    const { id } = req.params
    const { tenantId } = req.user
    const { priority } = req.body

    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Invalid lead ID', 400)
    }

    if (
      priority !== null &&
      priority !== '' &&
      !PRIORITIES.includes(priority)
    ) {
      throw new AppError('Invalid priority', 400)
    }

    const lead = await Lead.findOne({
      _id: id,
      tenantId
    })

    if (!lead) {
      throw new AppError('Lead not found', 404)
    }

    if (priority === null || priority === '') {
      lead.set('priority', undefined)
    } else {
      lead.priority = priority
    }

    await lead.save()

    res.json({
      message: 'Priority updated successfully',
      lead: formatLead(lead)
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listLeads,
  getLead,
  listAssignableExecutives,
  assignLead,
  updateLeadPriority
}