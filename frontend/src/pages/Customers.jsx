import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAPI } from '../hooks/useAPI'
import { dashboardAPI } from '../services/api'
import { ErrorState, SectionHeader, Badge } from '../components/ui/index'
import { fmt, SEGMENT_COLORS } from '../utils/helpers'
import TopBar from '../components/layout/TopBar'

const SEGMENT_DESC = {
  'Champions': 'Bought recently, buy often, spend the most. Reward them.',
  'Loyal Customers': 'Buy on a regular basis. Upsell higher value products.',
  'Potential Loyalists': 'Recent customers with average frequency. Offer membership.',
  'At Risk': 'Above average recency & frequency. Re-engage with promotions.',
  'Lost Customers': 'Lowest recency, frequency & monetary scores. Reconnect.',
}

const SEGMENT_COLOR_MAP = {
  'Champions': 'indigo',
  'Loyal Customers': 'emerald',
  'Potential Loyalists': 'amber',
  'At Risk': 'orange',
  'Lost Customers': 'rose',
}

export default function CustomersPage() {
  const { data, loading, error } = useAPI(dashboardAPI.getCustomerSegmentation)

  const segments = data?.segments || []
  const customers = data?.customers || []

  return (
    <div className="fade-in">
      <TopBar title="Customer Segments" subtitle="RFM analysis — Recency, Frequency, Monetary" />
      <div className="p-6 space-y-6">
        {error && <ErrorState message={error} />}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Pie chart */}
          <div className="card">
            <SectionHeader title="Segment Distribution" subtitle="Customer count by RFM segment" />
            {loading ? <div className="skeleton h-64 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Pie data={segments} dataKey="count" nameKey="segment"
                    cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                    paddingAngle={3} label={({ segment, percent }) => `${segment} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false} fontSize={11}>
                    {segments.map((s) => (
                      <Cell key={s.segment} fill={SEGMENT_COLORS[s.segment] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [fmt.number(v), n]}
                    contentStyle={{ background: '#151b26', border: '1px solid #2d3a52', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Segment cards */}
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-xl" />)
              : segments.map((s) => (
                <div key={s.segment} className="card-sm flex items-start gap-4 hover:border-accent/30 transition-all">
                  <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ background: SEGMENT_COLORS[s.segment] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white text-sm">{s.segment}</span>
                      <Badge color={SEGMENT_COLOR_MAP[s.segment] || 'slate'}>{fmt.number(s.count)} customers</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 mb-2">{SEGMENT_DESC[s.segment]}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-slate-600">Revenue</span><br /><span className="font-mono text-slate-300">{fmt.compact(s.revenue)}</span></div>
                      <div><span className="text-slate-600">Avg Freq</span><br /><span className="font-mono text-slate-300">{s.avg_frequency.toFixed(1)}x</span></div>
                      <div><span className="text-slate-600">Avg Value</span><br /><span className="font-mono text-slate-300">{fmt.compact(s.avg_monetary)}</span></div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Customer table */}
        <div className="card">
          <SectionHeader title="Customer RFM Scores" subtitle="Individual scores — top 30 by monetary value" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-500">
                  {['Customer', 'Recency (days)', 'Frequency', 'Monetary', 'R', 'F', 'M', 'Total', 'Segment'].map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider py-2 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={9} className="py-3"><div className="skeleton h-4" /></td></tr>
                  ))
                  : customers.slice(0, 30).map((c, i) => (
                    <tr key={i} className="table-row">
                      <td className="py-3 px-2 text-white font-medium">{c.customer_name}</td>
                      <td className="py-3 px-2 font-mono text-slate-400">{c.recency}</td>
                      <td className="py-3 px-2 font-mono text-slate-400">{c.frequency}</td>
                      <td className="py-3 px-2 font-mono text-slate-300">{fmt.currency(c.monetary)}</td>
                      <td className="py-3 px-2"><span className="badge bg-surface-500 text-slate-300">{c.r_score}</span></td>
                      <td className="py-3 px-2"><span className="badge bg-surface-500 text-slate-300">{c.f_score}</span></td>
                      <td className="py-3 px-2"><span className="badge bg-surface-500 text-slate-300">{c.m_score}</span></td>
                      <td className="py-3 px-2 font-mono font-bold text-accent">{c.rfm_score}</td>
                      <td className="py-3 px-2">
                        <span className="badge" style={{ background: SEGMENT_COLORS[c.segment] + '20', color: SEGMENT_COLORS[c.segment] }}>
                          {c.segment}
                        </span>
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
