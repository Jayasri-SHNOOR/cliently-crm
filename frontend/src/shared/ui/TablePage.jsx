import { useMemo, useState } from 'react'
import PageHeader from './PageHeader'
import KpiCard from './KpiCard'
import Panel from './Panel'
import DataTable from './DataTable'
import './ui.css'

/*
  kpis:       [{ label, value, icon }]
  filters:    [{ key, label, options: [...] }]   (matches row[key] === chosen option)
  searchKeys: ['customer', 'product']
*/
export default function TablePage({
  title, subtitle, actions, kpis = [], columns, rows,
  filters = [], searchKeys = [], panelTitle, searchPlaceholder = 'Search...',
}) {
  const [q, setQ] = useState('')
  const [chosen, setChosen] = useState({})

  const visible = useMemo(() => rows.filter((r) => {
    const text = searchKeys.map((k) => String(r[k] ?? '')).join(' ').toLowerCase()
    if (q && !text.includes(q.toLowerCase())) return false
    return filters.every((f) => !chosen[f.key] || r[f.key] === chosen[f.key])
  }), [rows, q, chosen, filters, searchKeys])

  return (
    <main className="ui-page">
      <PageHeader title={title} subtitle={subtitle} actions={actions} />

      {kpis.length > 0 && (
        <section className="ui-kpis">
          {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </section>
      )}

      <Panel title={panelTitle}>
        <div className="ui-filters">
          {searchKeys.length > 0 && (
            <input className="ui-input" placeholder={searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />
          )}
          {filters.map((f) => (
            <select
              key={f.key} className="ui-select" value={chosen[f.key] || ''}
              onChange={(e) => setChosen((c) => ({ ...c, [f.key]: e.target.value }))}
            >
              <option value="">All {f.label}</option>
              {f.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>
        <DataTable columns={columns} rows={visible} />
      </Panel>
    </main>
  )
}