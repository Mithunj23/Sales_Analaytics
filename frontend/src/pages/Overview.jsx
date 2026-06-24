import { DollarSign, ShoppingCart, Users, TrendingUp, BarChart3, Percent } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useAPI } from '../hooks/useAPI'
import { dashboardAPI } from '../services/api'
import { KPICard, ErrorState, CardSkeleton } from '../components/ui/index'
import { fmt, CHART_COLORS } from '../utils/helpers'
import TopBar from '../components/layout/TopBar'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-600 border border-surface-400 rounded-lg p-3 shadow-xl text-sm">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono text-xs">
          {p.name}: {p.name === 'orders' ? fmt.number(p.value) : fmt.compact(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Overview() {
  const summary = useAPI(dashboardAPI.getSummary)
  const monthly = useAPI(dashboardAPI.getMonthlyRevenue)
  const regional = useAPI(dashboardAPI.getRegionalPerformance)

  const d = summary.data

  return (
    <div className="fade-in">
      <TopBar title="Executive Overview" subtitle="Business performance at a glance" />

      <div className="p-6 space-y-6">
        {summary.error && <ErrorState message={summary.error} />}

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard title="Total Revenue" value={d ? fmt.compact(d.total_revenue) : '—'}
            sub="All-time sales" icon={DollarSign} color="indigo" trend={d?.revenue_growth} loading={summary.loading} />
          <KPICard title="Total Orders" value={d ? fmt.number(d.total_orders) : '—'}
            sub="Transactions" icon={ShoppingCart} color="sky" loading={summary.loading} />
          <KPICard title="Customers" value={d ? fmt.number(d.total_customers) : '—'}
            sub="Unique buyers" icon={Users} color="violet" loading={summary.loading} />
          <KPICard title="Total Profit" value={d ? fmt.compact(d.total_profit) : '—'}
            sub="Net profit" icon={TrendingUp} color="emerald" loading={summary.loading} />
          <KPICard title="Avg Order Value" value={d ? fmt.currencyFull(d.avg_order_value) : '—'}
            sub="Per transaction" icon={BarChart3} color="amber" loading={summary.loading} />
          <KPICard title="Profit Margin" value={d ? fmt.pct(d.profit_margin) : '—'}
            sub="Revenue to profit" icon={Percent} color="rose" loading={summary.loading} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Revenue trend */}
          <div className="card xl:col-span-2">
            <h2 className="section-title">Revenue & Profit Trend</h2>
            <p className="section-sub">Monthly performance over time</p>
            {monthly.loading ? (
              <div className="skeleton h-56 w-full rounded-lg" />
            ) : monthly.error ? (
              <ErrorState message={monthly.error} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthly.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => fmt.compact(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                  <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="url(#profGrad)" strokeWidth={2} name="Profit" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Regional breakdown */}
          <div className="card">
            <h2 className="section-title">Revenue by Region</h2>
            <p className="section-sub">Geographic distribution</p>
            {regional.loading ? (
              <div className="skeleton h-56 w-full rounded-lg" />
            ) : regional.error ? (
              <ErrorState message={regional.error} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={regional.data} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false}
                    tickFormatter={(v) => fmt.compact(v)} />
                  <YAxis type="category" dataKey="region" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} width={55} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Orders bar chart */}
        <div className="card">
          <h2 className="section-title">Monthly Order Volume</h2>
          <p className="section-sub">Transaction count per month</p>
          {monthly.loading ? (
            <div className="skeleton h-40 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthly.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" fill="#38bdf8" radius={[4, 4, 0, 0]} name="orders" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
