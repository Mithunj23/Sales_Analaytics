import { BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { useAPI } from '../hooks/useAPI'
import { dashboardAPI } from '../services/api'
import { ErrorState, SectionHeader, KPICard } from '../components/ui/index'
import { fmt } from '../utils/helpers'
import TopBar from '../components/layout/TopBar'
import { TrendingDown, TrendingUp } from 'lucide-react'

export default function DiscountsPage() {
  const { data, loading, error } = useAPI(dashboardAPI.getDiscountAnalysis)

  const buckets = data?.buckets || []
  const corr = data?.correlations || {}
  const scatter = data?.scatter || []

  return (
    <div className="fade-in">
      <TopBar title="Discount Impact" subtitle="How discounting affects revenue and profit" />
      <div className="p-6 space-y-6">
        {error && <ErrorState message={error} />}

        {/* Correlation KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <KPICard
            title="Revenue Correlation"
            value={corr.revenue_correlation?.toFixed(3) || '—'}
            sub="Discount vs Revenue (Pearson r)"
            icon={corr.revenue_correlation > 0 ? TrendingUp : TrendingDown}
            color={corr.revenue_correlation > 0 ? 'emerald' : 'rose'}
            loading={loading}
          />
          <KPICard
            title="Profit Correlation"
            value={corr.profit_correlation?.toFixed(3) || '—'}
            sub="Discount vs Profit (Pearson r)"
            icon={corr.profit_correlation > 0 ? TrendingUp : TrendingDown}
            color={corr.profit_correlation > 0 ? 'emerald' : 'rose'}
            loading={loading}
          />
        </div>

        {/* Insight callout */}
        {!loading && corr.profit_correlation < -0.1 && (
          <div className="card border-amber-500/30 bg-amber-500/5">
            <div className="flex gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-amber-400 font-semibold text-sm">Discount Erosion Detected</p>
                <p className="text-slate-400 text-xs mt-1">
                  Profit correlation of {corr.profit_correlation?.toFixed(3)} indicates that higher discounts
                  significantly reduce profitability. Consider capping discounts at 15% to protect margins.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Revenue by discount bucket */}
          <div className="card">
            <SectionHeader title="Avg Revenue by Discount Range" subtitle="Impact of discount levels on order value" />
            {loading ? <div className="skeleton h-56 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={buckets} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" />
                  <XAxis dataKey="discount_range" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => fmt.compact(v)} />
                  <Tooltip
                    formatter={(v) => [fmt.currency(v)]}
                    contentStyle={{ background: '#151b26', border: '1px solid #2d3a52', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="avg_revenue" name="Avg Revenue" radius={[4, 4, 0, 0]}>
                    {buckets.map((b, i) => (
                      <Cell key={i} fill={['#22c55e', '#6366f1', '#f59e0b', '#f97316', '#ef4444'][i] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Profit by discount bucket */}
          <div className="card">
            <SectionHeader title="Avg Profit by Discount Range" subtitle="Profit erosion across discount bands" />
            {loading ? <div className="skeleton h-56 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={buckets} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" />
                  <XAxis dataKey="discount_range" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => fmt.compact(v)} />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
                  <Tooltip
                    formatter={(v) => [fmt.currency(v)]}
                    contentStyle={{ background: '#151b26', border: '1px solid #2d3a52', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="avg_profit" name="Avg Profit" radius={[4, 4, 0, 0]}>
                    {buckets.map((b, i) => (
                      <Cell key={i} fill={b.avg_profit >= 0 ? '#22c55e' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Scatter plot */}
        <div className="card">
          <SectionHeader title="Discount vs Sales Amount (Scatter)" subtitle="Individual transaction distribution" />
          {loading ? <div className="skeleton h-56 w-full rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={224}>
              <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" />
                <XAxis dataKey="discount" name="Discount" type="number" domain={[0, 0.35]}
                  tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <YAxis dataKey="sales_amount" name="Revenue" type="number"
                  tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => fmt.compact(v)} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ background: '#151b26', border: '1px solid #2d3a52', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n) => n === 'Discount' ? [`${(v * 100).toFixed(0)}%`, n] : [fmt.currency(v), n]}
                />
                <Scatter data={scatter} fill="#6366f180" />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bucket table */}
        <div className="card">
          <SectionHeader title="Discount Band Summary" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-500">
                {['Discount Range', 'Orders', 'Avg Revenue', 'Avg Profit', 'Total Revenue'].map((h) => (
                  <th key={h} className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider py-2 px-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buckets.map((b, i) => (
                <tr key={i} className="table-row">
                  <td className="py-3 px-2 text-white font-medium">{b.discount_range}</td>
                  <td className="py-3 px-2 text-slate-400">{fmt.number(b.order_count)}</td>
                  <td className="py-3 px-2 font-mono text-slate-300">{fmt.currency(b.avg_revenue)}</td>
                  <td className={`py-3 px-2 font-mono ${b.avg_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {fmt.currency(b.avg_profit)}
                  </td>
                  <td className="py-3 px-2 font-mono text-slate-300">{fmt.currency(b.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
