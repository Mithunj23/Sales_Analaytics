import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell } from 'recharts'
import { useAPI } from '../hooks/useAPI'
import { dashboardAPI } from '../services/api'
import { ErrorState, SectionHeader, Badge } from '../components/ui/index'
import { fmt } from '../utils/helpers'
import TopBar from '../components/layout/TopBar'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const trendIcon = { increasing: TrendingUp, declining: TrendingDown, stable: Minus, baseline: Minus }
const trendColor = { increasing: 'emerald', declining: 'rose', stable: 'slate', baseline: 'slate' }
const barColor = { increasing: '#22c55e', declining: '#f43f5e', stable: '#6366f1', baseline: '#6366f1' }

export default function TrendsPage() {
  const { data, loading, error } = useAPI(dashboardAPI.getTrendDetection)

  const trends = data?.monthly_trends || []
  const observations = data?.observations || []

  return (
    <div className="fade-in">
      <TopBar title="Trend Detection" subtitle="Seasonal patterns, growth momentum & change analysis" />
      <div className="p-6 space-y-6">
        {error && <ErrorState message={error} />}

        {/* Observations */}
        {observations.length > 0 && (
          <div className="card">
            <SectionHeader title="AI-Detected Business Observations" subtitle="Statistical trend analysis results" />
            <div className="space-y-2">
              {observations.map((obs, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-surface-600 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-slate-300 text-sm">{obs}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main trend chart */}
        <div className="card">
          <SectionHeader title="Revenue with Rolling Average" subtitle="3-month moving average overlaid on monthly revenue" />
          {loading ? <div className="skeleton h-72 w-full rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={288}>
              <ComposedChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => fmt.compact(v)} />
                <Tooltip
                  contentStyle={{ background: '#151b26', border: '1px solid #2d3a52', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n) => [fmt.currency(v), n]}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Bar dataKey="revenue" name="Monthly Revenue" radius={[3, 3, 0, 0]}>
                  {trends.map((t, i) => <Cell key={i} fill={barColor[t.trend] || '#6366f1'} fillOpacity={0.7} />)}
                </Bar>
                <Line type="monotone" dataKey="rolling_avg" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="3-Month Avg" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-3 flex-wrap">
            {[['#22c55e', 'Increasing (>10%)'], ['#6366f1', 'Stable (±10%)'], ['#f43f5e', 'Declining (>-10%)'], ['#f59e0b', '3-Month Avg']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-3 h-3 rounded" style={{ background: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Month-over-month table */}
        <div className="card">
          <SectionHeader title="Monthly Trend Breakdown" subtitle="Period-by-period classification" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-500">
                  {['Month', 'Revenue', '3-Month Avg', 'MoM Change', 'Trend'].map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider py-2 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="py-3"><div className="skeleton h-4" /></td></tr>
                  ))
                  : trends.map((t, i) => {
                    const Icon = trendIcon[t.trend] || Minus
                    return (
                      <tr key={i} className="table-row">
                        <td className="py-3 px-2 text-white font-medium">{t.month}</td>
                        <td className="py-3 px-2 font-mono text-slate-300">{fmt.currency(t.revenue)}</td>
                        <td className="py-3 px-2 font-mono text-amber-400">{fmt.currency(t.rolling_avg)}</td>
                        <td className="py-3 px-2">
                          <Badge color={t.pct_change > 0 ? 'emerald' : t.pct_change < 0 ? 'rose' : 'slate'}>
                            {fmt.pctSigned(t.pct_change)}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor[t.trend] === 'emerald' ? 'text-emerald-400' : trendColor[t.trend] === 'rose' ? 'text-rose-400' : 'text-slate-400'}`}>
                            <Icon size={12} />
                            <span className="capitalize">{t.trend}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
