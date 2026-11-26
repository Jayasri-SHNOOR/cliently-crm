import './ui.css'

const TONES = {
  new: 'blue', contacted: 'amber', qualified: 'teal', unqualified: 'gray',
  proposal: 'purple', demo: 'blue', negotiation: 'amber', won: 'green', lost: 'red',
  unassigned: 'red', active: 'green', inactive: 'gray',
  overdue: 'red', upcoming: 'blue', completed: 'green',
  sent: 'blue', accepted: 'green', rejected: 'red', expired: 'gray', pending: 'amber',
  paid: 'green', partial: 'amber', received: 'green',
  high: 'red', medium: 'amber', low: 'gray',
}

export default function StatusBadge({ status }) {
  const tone = TONES[String(status).toLowerCase()] || 'gray'
  return <span className={`ui-badge ui-badge--${tone}`}>{status}</span>
}