import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import { useAPI } from '../hooks/useAPI'
import { dashboardAPI } from '../services/api'
import { ErrorState, SectionHeader, Badge } from '../components/ui/index'
import { fmt } from '../utils/helpers'
import TopBar from '../components/layout/TopBar'

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-600 border border-surface-400 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-medium mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {fmt.currency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function RevenuePage() {
  const { data, loading, error } = useAPI(dashboardAPI.getMonthlyRevenue)
  const trend = useAPI(dashboardAPI.getTrendDetection)

  const avgRevenue = data ? data.reduce((s, d) => s + d.revenue, 0) / data.length : 0

  return (
    <div className="fade-in">
      <TopBar title="Revenue Trends" subtitle="Monthly aggregation & growth analysis" />
      <div className="p-6 space-y-6">
        {error && <ErrorState message={error} />}

        {/* Main trend chart */}
        <div className="card">
          <SectionHeader title="Monthly Revenue & Profit" subtitle="Historical performance tracking with moving average" />
          {loading ? (
            <div className="skeleton h-72 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="r" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="p" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => fmt.compact(v)} />
                <Tooltip content={<TT />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <ReferenceLine y={avgRevenue} stroke="#6366f140" strokeDasharray="4 4" label={{ value: 'Avg', fill: '#64748b', fontSize: 10 }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#r)" strokeWidth={2.5} name="Revenue" dot={false} />
                <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="url(#p)" strokeWidth={2} name="Profit" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Growth rate */}
        <div className="card">
          <SectionHeader title="Month-over-Month Growth" subtitle="Percentage change in revenue" />
          {loading ? (
            <div className="skeleton h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <LineChart data={data?.slice(1)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <Tooltip formatter={(v) => [`${v.toFixed(1)}%`, 'Growth']} contentStyle={{ background: '#151b26', border: '1px solid #2d3a52', borderRadius: 8 }} />
                <ReferenceLine y={0} stroke="#475569" />
                <Line type="monotone" dataKey="growth" stroke="#f59e0b" strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props
                    return <circle key={cx} cx={cx} cy={cy} r={4} fill={payload.growth >= 0 ? '#22c55e' : '#f43f5e'} />
                  }}
                  name="Growth %" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Data table */}
        <div className="card">
          <SectionHeader title="Monthly Revenue Table" subtitle="Detailed breakdown with growth rates" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-500">
                  {['Month', 'Revenue', 'Profit', 'Orders', 'Growth'].map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider py-2 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="py-3"><div className="skeleton h-4 w-full" /></td></tr>
                  ))
                  : data?.map((row, i) => (
                    <tr key={i} className="table-row">
                      <td className="py-3 px-2 font-medium text-white">{row.month}</td>
                      <td className="py-3 px-2 font-mono text-slate-300">{fmt.currency(row.revenue)}</td>
                      <td className="py-3 px-2 font-mono text-emerald-400">{fmt.currency(row.profit)}</td>
                      <td className="py-3 px-2 text-slate-400">{fmt.number(row.orders)}</td>
                      <td className="py-3 px-2">
                        <Badge color={row.growth >= 0 ? 'emerald' : 'rose'}>
                          {fmt.pctSigned(row.growth)}
                        </Badge>
                      </td>
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
