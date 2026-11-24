import './ui.css'

export default function KpiCard({ label, value, icon: Icon }) {
  return (
    <div className="ui-kpi">
      {Icon && <div className="ui-kpi__icon"><Icon size={18} /></div>}
      <div>
        <p className="ui-kpi__label">{label}</p>
        <h2 className="ui-kpi__value">{value}</h2>
      </div>
    </div>
  )
}