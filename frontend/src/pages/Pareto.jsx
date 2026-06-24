import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell } from 'recharts'
import { useAPI } from '../hooks/useAPI'
import { dashboardAPI } from '../services/api'
import { ErrorState, SectionHeader, Badge } from '../components/ui/index'
import { fmt } from '../utils/helpers'
import TopBar from '../components/layout/TopBar'

function ParetoChart({ data, title, subtitle }) {
  if (!data?.length) return null
  const display = data.slice(0, 20)
  return (
    <div className="card">
      <SectionHeader title={title} subtitle={subtitle} />
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={display} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false}
            angle={-45} textAnchor="end" height={70} interval={0} />
          <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
            tickFormatter={(v) => fmt.compact(v)} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
            tickFormatter={(v) => `${v.toFixed(0)}%`} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ background: '#151b26', border: '1px solid #2d3a52', borderRadius: 8, fontSize: 12 }}
            formatter={(v, n) => n === 'Cumulative %' ? [`${v.toFixed(1)}%`, n] : [fmt.currency(v), n]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
          <ReferenceLine yAxisId="right" y={80} stroke="#f59e0b50" strokeDasharray="4 4"
            label={{ value: '80%', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
          <Bar yAxisId="left" dataKey="revenue" name="Revenue" radius={[3, 3, 0, 0]}>
            {display.map((d, i) => <Cell key={i} fill={d.is_top_20 ? '#6366f1' : '#2d3a52'} />)}
          </Bar>
          <Line yAxisId="right" type="monotone" dataKey="cumulative_pct" stroke="#f59e0b"
            strokeWidth={2} dot={false} name="Cumulative %" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex gap-3 mt-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-3 h-3 rounded bg-accent" />
          Top 20% (Pareto contributors)
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-3 h-3 rounded bg-surface-500" />
          Remaining 80%
        </div>
      </div>
    </div>
  )
}

export default function ParetoPage() {
  const { data, loading, error } = useAPI(dashboardAPI.getParetoAnalysis)

  const customers = data?.customers || []
  const products = data?.products || []

  const top20Customers = customers.filter((c) => c.is_top_20)
  const top20Revenue = top20Customers.reduce((s, c) => s + c.revenue, 0)
  const totalRevenue = customers.reduce((s, c) => s + c.revenue, 0)

  return (
    <div className="fade-in">
      <TopBar title="Pareto 80/20" subtitle="Identifying the vital few driving the majority of revenue" />
      <div className="p-6 space-y-6">
        {error && <ErrorState message={error} />}

        {/* Key insight */}
        {!loading && customers.length > 0 && (
          <div className="card border-indigo-500/30 bg-indigo-500/5">
            <div className="flex gap-4 items-start">
              <div className="text-3xl">📊</div>
              <div>
                <p className="text-indigo-400 font-semibold">Pareto Principle Confirmed</p>
                <p className="text-slate-400 text-sm mt-1">
                  The top <strong className="text-white">{top20Customers.length} customers</strong> ({fmt.pct(top20Customers.length / customers.length * 100)} of total)
                  generate <strong className="text-white">{fmt.pct(top20Revenue / totalRevenue * 100)}</strong> of all revenue —
                  totaling <strong className="text-white">{fmt.currency(top20Revenue)}</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="skeleton h-72 rounded-xl" />
            <div className="skeleton h-72 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ParetoChart data={customers} title="Customer Pareto" subtitle="Top customers by revenue contribution" />
            <ParetoChart data={products} title="Product Pareto" subtitle="Top products by revenue contribution" />
          </div>
        )}

        {/* Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card">
            <SectionHeader title="Top 20% Customers" subtitle="Pareto contributors — prioritize retention" />
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-500">
                  {['Customer', 'Revenue', 'Cumulative %'].map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider py-2 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.filter((c) => c.is_top_20).map((c, i) => (
                  <tr key={i} className="table-row">
                    <td className="py-3 px-2 text-white font-medium">{c.name}</td>
                    <td className="py-3 px-2 font-mono text-accent">{fmt.currency(c.revenue)}</td>
                    <td className="py-3 px-2"><Badge color="indigo">{fmt.pct(c.cumulative_pct)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <SectionHeader title="Top 20% Products" subtitle="Revenue-driving SKUs to optimize" />
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-500">
                  {['Product', 'Revenue', 'Cumulative %'].map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider py-2 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.filter((p) => p.is_top_20).map((p, i) => (
                  <tr key={i} className="table-row">
                    <td className="py-3 px-2 text-white font-medium">{p.name}</td>
                    <td className="py-3 px-2 font-mono text-accent">{fmt.currency(p.revenue)}</td>
                    <td className="py-3 px-2"><Badge color="indigo">{fmt.pct(p.cumulative_pct)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
