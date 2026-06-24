import { useAPI } from '../hooks/useAPI'
import { dashboardAPI } from '../services/api'
import { ErrorState, SectionHeader } from '../components/ui/index'
import TopBar from '../components/layout/TopBar'
import { Brain, TrendingUp, Users, MapPin, Package, Lightbulb } from 'lucide-react'

const InsightSection = ({ icon: Icon, title, color, items, loading }) => {
  const colorMap = {
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: 'text-indigo-400', bullet: 'bg-indigo-400' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', bullet: 'bg-emerald-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400', bullet: 'bg-amber-400' },
    sky: { bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: 'text-sky-400', bullet: 'bg-sky-400' },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: 'text-violet-400', bullet: 'bg-violet-400' },
  }
  const c = colorMap[color] || colorMap.indigo

  if (loading) {
    return (
      <div className={`card border ${c.border} ${c.bg}`}>
        <div className="skeleton h-4 w-32 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-3 w-full mb-2" />)}
      </div>
    )
  }

  return (
    <div className={`card border ${c.border} ${c.bg}`}>
      <div className={`flex items-center gap-3 mb-4`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg}`}>
          <Icon size={16} className={c.icon} />
        </div>
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2">
        {(Array.isArray(items) ? items : []).map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
            <div className={`w-1.5 h-1.5 rounded-full ${c.bullet} mt-2 flex-shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function InsightsPage() {
  const { data, loading, error } = useAPI(dashboardAPI.getAIInsights)

  return (
    <div className="fade-in">
      <TopBar title="AI Insights" subtitle="Machine-generated business intelligence & recommendations" />
      <div className="p-6 space-y-6">
        {error && <ErrorState message={error} />}

        {/* Executive summary */}
        <div className="card border-accent/30 bg-accent/5">
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Brain size={20} className="text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-white font-semibold">Executive Summary</h2>
                <span className="badge bg-accent/20 text-accent border border-accent/30">AI Generated</span>
              </div>
              {loading
                ? <div className="space-y-2"><div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-3/4" /></div>
                : <p className="text-slate-300 text-sm leading-relaxed">{data?.executive_summary}</p>
              }
            </div>
          </div>
        </div>

        {/* Insight grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InsightSection
            icon={TrendingUp} title="Revenue Insights" color="indigo"
            items={data?.revenue_insights} loading={loading}
          />
          <InsightSection
            icon={Users} title="Customer Insights" color="emerald"
            items={data?.customer_insights} loading={loading}
          />
          <InsightSection
            icon={MapPin} title="Regional Insights" color="sky"
            items={data?.regional_insights} loading={loading}
          />
          <InsightSection
            icon={Package} title="Product Recommendations" color="amber"
            items={data?.product_recommendations} loading={loading}
          />
        </div>

        {/* Business recs */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Lightbulb size={16} className="text-violet-400" />
            </div>
            <h3 className="text-white font-semibold">Strategic Recommendations</h3>
          </div>
          {loading
            ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>
            : (
              <div className="space-y-3">
                {(data?.business_recommendations || []).map((rec, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 bg-surface-600 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-slate-300 text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Disclaimer */}
        <div className="text-center text-xs text-slate-600 pb-2">
          Insights generated from statistical analysis of your sales data. Connect an LLM API key in backend .env for GPT/Claude-powered summaries.
        </div>
      </div>
    </div>
  )
}
