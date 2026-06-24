import { FileDown, FileText, FileJson, BarChart2 } from 'lucide-react'
import { reportAPI } from '../services/api'
import { SectionHeader } from '../components/ui/index'
import TopBar from '../components/layout/TopBar'

const ReportCard = ({ icon: Icon, title, description, filename, url, color }) => {
  const colorMap = {
    indigo: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    sky: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  return (
    <div className="card hover:border-accent/40 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
          <Icon size={22} />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">{title}</h3>
          <p className="text-slate-500 text-sm mb-4">{description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-mono">{filename}</span>
            <button
              onClick={handleDownload}
              className="btn-primary text-xs"
            >
              <FileDown size={13} />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const reports = [
    {
      icon: BarChart2,
      title: 'Revenue Report',
      description: 'Monthly revenue by region and category with discount analysis. Includes all aggregated metrics.',
      filename: 'revenue_report.csv',
      url: reportAPI.downloadRevenueCsv(),
      color: 'indigo',
    },
    {
      icon: FileText,
      title: 'Customer Report',
      description: 'Full customer list with order history, total revenue, profit contribution and engagement metrics.',
      filename: 'customer_report.csv',
      url: reportAPI.downloadCustomerCsv(),
      color: 'emerald',
    },
    {
      icon: FileText,
      title: 'Product Report',
      description: 'Product performance ranked by revenue with margin analysis, quantity sold and category breakdown.',
      filename: 'product_report.csv',
      url: reportAPI.downloadProductCsv(),
      color: 'amber',
    },
    {
      icon: FileJson,
      title: 'Business Insights (JSON)',
      description: 'Complete analytics summary including executive KPIs, monthly trends, regional data and segment analysis.',
      filename: 'insights_report.json',
      url: reportAPI.downloadInsightsJson(),
      color: 'sky',
    },
  ]

  return (
    <div className="fade-in">
      <TopBar title="Export Reports" subtitle="Download analytics data as CSV and JSON" />
      <div className="p-6 space-y-6">

        <div className="card border-accent/20 bg-accent/5">
          <div className="flex items-start gap-3">
            <FileDown size={20} className="text-accent mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm">Report Export Center</p>
              <p className="text-slate-400 text-xs mt-1">
                All reports are generated in real-time from your sales database. CSV files open in Excel, Google Sheets, or any data tool.
                JSON reports are structured for programmatic use or BI tool integration.
              </p>
            </div>
          </div>
        </div>

        <div>
          <SectionHeader title="Available Reports" subtitle="Click Download to generate and save each report" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r) => <ReportCard key={r.filename} {...r} />)}
          </div>
        </div>

        {/* Schema reference */}
        <div className="card">
          <SectionHeader title="Report Schema Reference" subtitle="Field definitions for exported data" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <p className="text-slate-400 font-medium mb-2">Revenue CSV</p>
              <ul className="space-y-1 text-slate-500 font-mono">
                {['Month', 'Region', 'Category', 'Revenue', 'Profit', 'Orders', 'Avg Discount'].map((f) => (
                  <li key={f} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />{f}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-2">Customer CSV</p>
              <ul className="space-y-1 text-slate-500 font-mono">
                {['Customer ID', 'Name', 'Total Orders', 'Total Revenue', 'Total Profit', 'First/Last Order', 'Revenue Rank'].map((f) => (
                  <li key={f} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
