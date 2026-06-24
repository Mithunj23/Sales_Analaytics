export const fmt = {
  currency: (v) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0),
  currencyFull: (v) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v || 0),
  number: (v) => new Intl.NumberFormat('en-US').format(v || 0),
  pct: (v) => `${Number(v || 0).toFixed(1)}%`,
  pctSigned: (v) => `${v > 0 ? '+' : ''}${Number(v || 0).toFixed(1)}%`,
  compact: (v) => {
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
    if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`
    return `$${v.toFixed(0)}`
  },
}

export const CHART_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#f43f5e', '#38bdf8',
  '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#7dd3fc',
]

export const SEGMENT_COLORS = {
  'Champions': '#6366f1',
  'Loyal Customers': '#22c55e',
  'Potential Loyalists': '#f59e0b',
  'At Risk': '#f97316',
  'Lost Customers': '#ef4444',
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
