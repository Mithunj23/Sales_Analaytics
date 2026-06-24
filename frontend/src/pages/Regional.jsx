import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'
import { useAPI } from '../hooks/useAPI'
import { dashboardAPI } from '../services/api'
import { ErrorState, SectionHeader, Badge } from '../components/ui/index'
import { fmt, CHART_COLORS } from '../utils/helpers'
import TopBar from '../components/layout/TopBar'

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-600 border border-surface-400 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-medium mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmt.currency(p.value)}</p>
      ))}
    </div>
  )
}

export default function RegionalPage() {
  const { data, loading, error } = useAPI(dashboardAPI.getRegionalPerformance)

  const totalRev = data?.reduce((s, d) => s + d.revenue, 0) || 1

  // Normalize for radar
  const radarData = data?.map((r) => ({
    region: r.region,
    Revenue: Math.round((r.revenue / totalRev) * 100),
    'Avg Order': Math.round((r.avg_order_value / (data[0]?.avg_order_value || 1)) * 100),
    Customers: Math.round((r.customers / (Math.max(...(data?.map(d => d.customers) || [1])))) * 100),
  })) || []

  return (
    <div className="fade-in">
      <TopBar title="Regional Performance" subtitle="Revenue, profit & distribution by geography" />
      <div className="p-6 space-y-6">
        {error && <ErrorState message={error} />}

        {/* Region KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="card-sm skeleton h-24" />)
            : data?.map((r, i) => (
              <div key={r.region} className="card-sm hover:border-accent/40 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  <span className="text-slate-400 text-xs font-medium">{r.region}</span>
                </div>
                <div className="text-white font-bold font-mono text-lg">{fmt.compact(r.revenue)}</div>
                <div className="text-slate-500 text-xs mt-1">{fmt.pct(r.revenue / totalRev * 100)} of total</div>
              </div>
            ))
          }
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Revenue vs Profit bar */}
          <div className="card">
            <SectionHeader title="Revenue vs Profit by Region" subtitle="Side-by-side comparison" />
            {loading ? <div className="skeleton h-56 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" />
                  <XAxis dataKey="region" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => fmt.compact(v)} />
                  <Tooltip content={<TT />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue">
                    {data?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Bar>
                  <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Radar chart */}
          <div className="card">
            <SectionHeader title="Regional Performance Radar" subtitle="Normalized metric comparison" />
            {loading ? <div className="skeleton h-56 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={224}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1c2333" />
                  <PolarAngleAxis dataKey="region" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Radar dataKey="Revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} name="Revenue %" />
                  <Radar dataKey="Customers" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="Customers" />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Detailed table */}
        <div className="card">
          <SectionHeader title="Regional Detail Table" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-500">
                  {['Rank', 'Region', 'Revenue', 'Profit', 'Margin', 'Orders', 'Customers', 'AOV'].map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider py-2 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} className="py-3"><div className="skeleton h-4" /></td></tr>
                  ))
                  : data?.map((r, i) => (
                    <tr key={r.region} className="table-row">
                      <td className="py-3 px-2 text-slate-500 font-mono">#{i + 1}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                          <span className="text-white font-medium">{r.region}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-300">{fmt.currency(r.revenue)}</td>
                      <td className="py-3 px-2 font-mono text-emerald-400">{fmt.currency(r.profit)}</td>
                      <td className="py-3 px-2">
                        <Badge color={r.profit / r.revenue > 0.15 ? 'emerald' : 'amber'}>
                          {fmt.pct(r.profit / r.revenue * 100)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-slate-400">{fmt.number(r.orders)}</td>
                      <td className="py-3 px-2 text-slate-400">{fmt.number(r.customers)}</td>
                      <td className="py-3 px-2 font-mono text-slate-300">{fmt.currency(r.avg_order_value)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
