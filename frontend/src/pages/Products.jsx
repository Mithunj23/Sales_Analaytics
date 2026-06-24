import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAPI } from '../hooks/useAPI'
import { dashboardAPI } from '../services/api'
import { ErrorState, SectionHeader, Badge } from '../components/ui/index'
import { fmt, CHART_COLORS } from '../utils/helpers'
import TopBar from '../components/layout/TopBar'

export default function ProductsPage() {
  const { data, loading, error } = useAPI(dashboardAPI.getProductPerformance)

  const products = data?.products || []
  const categories = data?.categories || []
  const top10 = products.slice(0, 10)

  return (
    <div className="fade-in">
      <TopBar title="Product Analysis" subtitle="Revenue, profit & category performance" />
      <div className="p-6 space-y-6">
        {error && <ErrorState message={error} />}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Top products bar */}
          <div className="card">
            <SectionHeader title="Top 10 Products by Revenue" subtitle="Ranked by total sales" />
            {loading ? <div className="skeleton h-72 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={288}>
                <BarChart data={top10} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false}
                    tickFormatter={(v) => fmt.compact(v)} />
                  <YAxis type="category" dataKey="product_name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} width={130} />
                  <Tooltip
                    formatter={(v) => [fmt.currency(v), 'Revenue']}
                    contentStyle={{ background: '#151b26', border: '1px solid #2d3a52', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="total_revenue" radius={[0, 4, 4, 0]} name="Revenue">
                    {top10.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category pie */}
          <div className="card">
            <SectionHeader title="Revenue by Category" subtitle="Proportional category breakdown" />
            {loading ? <div className="skeleton h-72 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={288}>
                <PieChart>
                  <Pie data={categories} dataKey="revenue" nameKey="category"
                    cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={3}>
                    {categories.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [fmt.currency(v), 'Revenue']}
                    contentStyle={{ background: '#151b26', border: '1px solid #2d3a52', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)
            : categories.map((c, i) => (
              <div key={c.category} className="card-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  <span className="text-xs text-slate-400 font-medium truncate">{c.category}</span>
                </div>
                <div className="text-white font-bold font-mono">{fmt.compact(c.revenue)}</div>
                <div className="text-emerald-400 font-mono text-xs mt-1">{fmt.compact(c.profit)} profit</div>
                <div className="text-slate-500 text-xs">{fmt.number(c.orders)} orders</div>
              </div>
            ))
          }
        </div>

        {/* Product table */}
        <div className="card">
          <SectionHeader title="Full Product Leaderboard" subtitle="All products ranked by revenue" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-500">
                  {['Rank', 'Product', 'Category', 'Revenue', 'Profit', 'Margin', 'Qty', 'Orders'].map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider py-2 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} className="py-3"><div className="skeleton h-4" /></td></tr>
                  ))
                  : products.map((p, i) => (
                    <tr key={i} className="table-row">
                      <td className="py-3 px-2 text-slate-500 font-mono">#{p.revenue_rank}</td>
                      <td className="py-3 px-2 text-white font-medium">{p.product_name}</td>
                      <td className="py-3 px-2"><Badge color="indigo">{p.category}</Badge></td>
                      <td className="py-3 px-2 font-mono text-slate-300">{fmt.currency(p.total_revenue)}</td>
                      <td className="py-3 px-2 font-mono text-emerald-400">{fmt.currency(p.total_profit)}</td>
                      <td className="py-3 px-2">
                        <Badge color={p.total_profit / p.total_revenue > 0.3 ? 'emerald' : p.total_profit / p.total_revenue > 0.1 ? 'amber' : 'rose'}>
                          {fmt.pct(p.total_profit / p.total_revenue * 100)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-slate-400">{fmt.number(p.total_quantity)}</td>
                      <td className="py-3 px-2 text-slate-400">{fmt.number(p.order_count)}</td>
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
