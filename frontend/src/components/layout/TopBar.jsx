import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { dashboardAPI } from '../../services/api'

export default function TopBar({ title, subtitle }) {
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const fileRef = useRef()

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    try {
      const result = await dashboardAPI.uploadCSV(file)
      setUploadResult({
        type: 'success',
        text: result.message || 'Uploaded successfully',
        warnings: result.warnings || [],
        mapped: result.columns_mapped || {},
      })
      setTimeout(() => window.location.reload(), 1800)
    } catch (err) {
      setUploadResult({ type: 'error', text: err.message })
    } finally {
      setUploading(false)
      fileRef.current.value = ''
    }
  }

  return (
    <header className="h-16 bg-surface-800 border-b border-surface-500 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-white font-semibold text-base leading-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Upload result feedback */}
        {uploadResult && (
          <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${
            uploadResult.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {uploadResult.type === 'success'
              ? <CheckCircle size={13} />
              : <AlertCircle size={13} />}
            <span>{uploadResult.text}</span>
            {uploadResult.warnings?.length > 0 && (
              <span className="text-amber-400 ml-1">({uploadResult.warnings[0]})</span>
            )}
          </div>
        )}

        {/* CSV format hint tooltip */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowHint(true)}
            onMouseLeave={() => setShowHint(false)}
            className="text-slate-600 hover:text-slate-400 transition-colors"
            title="CSV format help"
          >
            <Info size={15} />
          </button>
          {showHint && (
            <div className="absolute right-0 top-7 w-80 bg-surface-600 border border-surface-400 rounded-xl p-4 shadow-xl z-50 text-xs">
              <p className="text-white font-semibold mb-2">📋 CSV Upload — Accepted Formats</p>
              <p className="text-slate-400 mb-2">
                Only <strong className="text-white">3 columns are strictly required</strong> — everything else is optional or auto-filled:
              </p>
              <div className="space-y-1 mb-3">
                {[
                  ['order_id / invoice_id / id', '🔴 Required'],
                  ['customer_name / customer / client', '🔴 Required'],
                  ['sales_amount / revenue / total / amount', '🔴 Required'],
                  ['order_date / date / sale_date', '🔴 Required'],
                  ['product_name / product / item', '🔴 Required'],
                  ['product_category / category', '🟡 Auto → "General"'],
                  ['region / area / territory', '🟡 Auto → "Unknown"'],
                  ['quantity / qty', '🟡 Auto → 1'],
                  ['discount / discount_pct', '🟡 Auto → 0%'],
                  ['profit / net_profit / margin', '🟡 Auto → 20% of revenue'],
                ].map(([col, hint]) => (
                  <div key={col} className="flex justify-between gap-2">
                    <code className="text-indigo-300 text-[10px]">{col}</code>
                    <span className="text-slate-500 text-[10px] shrink-0">{hint}</span>
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-[10px]">
                Discounts as % (e.g. 15) are auto-converted. Extra columns are ignored. Most Kaggle sales datasets work out of the box.
              </p>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleUpload} />
        <button
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          className="btn-ghost text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload size={14} className={uploading ? 'animate-pulse' : ''} />
          {uploading ? 'Uploading…' : 'Upload CSV'}
        </button>

        <div className="w-px h-5 bg-surface-500" />

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
          A
        </div>
      </div>
    </header>
  )
}
