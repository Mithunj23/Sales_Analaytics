import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Overview from './pages/Overview'
import Revenue from './pages/Revenue'
import Regional from './pages/Regional'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Discounts from './pages/Discounts'
import Pareto from './pages/Pareto'
import Trends from './pages/Trends'
import Anomalies from './pages/Anomalies'
import Insights from './pages/Insights'
import Reports from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-60 min-h-screen overflow-x-hidden transition-all duration-300" id="main-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/regional" element={<Regional />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/discounts" element={<Discounts />} />
            <Route path="/pareto" element={<Pareto />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/anomalies" element={<Anomalies />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
