const SupportTicket = require('../../../models/SupportTicket');

const listTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find()
      .select('-messages')
      .sort({ lastActivityAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

const getOverview = async (req, res, next) => {
  try {
    const [total, open, inProgress, resolved, closed, urgent] =
      await Promise.all([
        SupportTicket.countDocuments(),
        SupportTicket.countDocuments({ status: 'Open' }),
        SupportTicket.countDocuments({ status: 'In Progress' }),
        SupportTicket.countDocuments({ status: 'Resolved' }),
        SupportTicket.countDocuments({ status: 'Closed' }),
        SupportTicket.countDocuments({ priority: 'Urgent' })
      ]);

    res.json({
      success: true,
      data: {
        total,
        open,
        inProgress,
        resolved,
        closed,
        urgent
      }
    });
  } catch (error) {
    next(error);
  }
};

const getTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTickets,
  getOverview,
  getTicket
};