import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, MapPin, Users, Package,
  Tag, BarChart2, Activity, AlertTriangle, Brain,
  FileDown, ChevronLeft, ChevronRight, Zap
} from 'lucide-react'
import { cn } from '../../utils/helpers'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Executive Overview', group: 'main' },
  { to: '/revenue', icon: TrendingUp, label: 'Revenue Trends', group: 'analytics' },
  { to: '/regional', icon: MapPin, label: 'Regional Performance', group: 'analytics' },
  { to: '/customers', icon: Users, label: 'Customer Segments', group: 'analytics' },
  { to: '/products', icon: Package, label: 'Product Analysis', group: 'analytics' },
  { to: '/discounts', icon: Tag, label: 'Discount Impact', group: 'analytics' },
  { to: '/pareto', icon: BarChart2, label: 'Pareto 80/20', group: 'analytics' },
  { to: '/trends', icon: Activity, label: 'Trend Detection', group: 'analytics' },
  { to: '/anomalies', icon: AlertTriangle, label: 'Anomaly Detection', group: 'analytics' },
  { to: '/insights', icon: Brain, label: 'AI Insights', group: 'intelligence' },
  { to: '/reports', icon: FileDown, label: 'Export Reports', group: 'intelligence' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-surface-800 border-r border-surface-500',
        'flex flex-col transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-surface-500 h-16 px-4',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 shadow-glow">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-white font-semibold text-sm">SalesIQ</span>
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Analytics</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 space-y-0.5 px-2">
        {['main', 'analytics', 'intelligence'].map((group) => {
          const items = NAV.filter((n) => n.group === group)
          const labels = { main: 'Overview', analytics: 'Analytics', intelligence: 'Intelligence' }
          return (
            <div key={group} className="mb-3">
              {!collapsed && (
                <div className="text-[10px] uppercase tracking-widest text-slate-600 font-medium px-2 py-1 mb-1">
                  {labels[group]}
                </div>
              )}
              {items.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to
                return (
                  <NavLink
                    key={to}
                    to={to}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all duration-150 group',
                      active
                        ? 'bg-accent/15 text-accent border border-accent/25'
                        : 'text-slate-400 hover:text-white hover:bg-surface-600',
                      collapsed && 'justify-center'
                    )}
                  >
                    <Icon size={17} className={cn(active ? 'text-accent' : 'text-slate-500 group-hover:text-white')} />
                    {!collapsed && <span className="font-medium truncate">{label}</span>}
                  </NavLink>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-surface-500 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn('w-full flex items-center gap-3 px-2 py-2 rounded-lg text-slate-500 hover:text-white hover:bg-surface-600 transition-colors', collapsed && 'justify-center')}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="text-xs">Collapse</span></>}
        </button>
      </div>
    </aside>
  )
}
