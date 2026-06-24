import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { useAPI } from '../hooks/useAPI'
import { dashboardAPI } from '../services/api'
import { ErrorState, SectionHeader, Badge, KPICard } from '../components/ui/index'
import { fmt } from '../utils/helpers'
import TopBar from '../components/layout/TopBar'
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

export default function AnomaliesPage() {
  const { data, loading, error } = useAPI(dashboardAPI.getAnomalyDetection)

  const anomalies = data?.anomalies || []
  const stats = data?.stats || {}
  const spikes = anomalies.filter((a) => a.anomaly_type === 'spike')
  const drops = anomalies.filter((a) => a.anomaly_type === 'drop')

  return (
    <div className="fade-in">
      <TopBar title="Anomaly Detection" subtitle="Statistical outlier identification using Z-score analysis" />
      <div className="p-6 space-y-6">
        {error && <ErrorState message={error} />}

        {/* Stats KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Anomalies" value={stats.total_anomalies ?? '—'} sub="Detected outliers (|Z| > 2.5)" icon={AlertTriangle} color="amber" loading={loading} />
          <KPICard title="Revenue Spikes" value={spikes.length || '—'} sub="Z-score > +2.5" icon={TrendingUp} color="emerald" loading={loading} />
          <KPICard title="Revenue Drops" value={drops.length || '—'} sub="Z-score < -2.5" icon={TrendingDown} color="rose" loading={loading} />
          <KPICard title="Mean Revenue" value={stats.mean ? fmt.currency(stats.mean) : '—'} sub="Per transaction baseline" icon={AlertTriangle} color="sky" loading={loading} />
        </div>

        {/* Threshold info */}
        {!loading && stats.spike_threshold && (
          <div className="card border-surface-400">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-xs text-slate-500 mb-1">Lower Threshold</div>
                <div className="text-rose-400 font-mono font-bold">{fmt.currency(stats.drop_threshold)}</div>
                <div className="text-xs text-slate-600 mt-0.5">Z = -2.5σ (drop)</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Population Mean</div>
                <div className="text-white font-mono font-bold">{fmt.currency(stats.mean)}</div>
                <div className="text-xs text-slate-600 mt-0.5">σ = {fmt.currency(stats.std)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Upper Threshold</div>
                <div className="text-emerald-400 font-mono font-bold">{fmt.currency(stats.spike_threshold)}</div>
                <div className="text-xs text-slate-600 mt-0.5">Z = +2.5σ (spike)</div>
              </div>
            </div>
          </div>
        )}

        {/* Anomaly table */}
        <div className="card">
          <SectionHeader title="Detected Anomalies" subtitle="Transactions with |Z-score| > 2.5 standard deviations" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-500">
                  {['Order ID', 'Customer', 'Product', 'Amount', 'Date', 'Type', 'Z-Score'].map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider py-2 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="py-3"><div className="skeleton h-4" /></td></tr>
                  ))
                  : anomalies.map((a, i) => (
                    <tr key={i} className="table-row">
                      <td className="py-3 px-2 font-mono text-slate-500 text-xs">{a.order_id}</td>
                      <td className="py-3 px-2 text-white">{a.customer_name}</td>
                      <td className="py-3 px-2 text-slate-400 text-xs">{a.product_name}</td>
                      <td className="py-3 px-2 font-mono font-bold" style={{ color: a.anomaly_type === 'spike' ? '#22c55e' : '#f43f5e' }}>
                        {fmt.currency(a.sales_amount)}
                      </td>
                      <td className="py-3 px-2 text-slate-400 text-xs">{a.order_date}</td>
                      <td className="py-3 px-2">
                        <Badge color={a.anomaly_type === 'spike' ? 'emerald' : 'rose'}>
                          {a.anomaly_type === 'spike' ? '↑ Spike' : '↓ Drop'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 font-mono text-xs" style={{ color: a.anomaly_type === 'spike' ? '#22c55e' : '#f43f5e' }}>
                        {a.z_score > 0 ? '+' : ''}{a.z_score.toFixed(2)}σ
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
            {!loading && anomalies.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                No anomalies detected — all transactions within 2.5σ of mean
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
