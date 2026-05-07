import { useState, useEffect } from 'react'
import { getSummary, getPieData, getBarData, getLineData } from '../api/dashboard'
import PeriodSelector from '../components/PeriodSelector'
import SummaryCard from '../components/SummaryCard'
import PieChart from '../components/PieChart'
import BarChart from '../components/BarChart'
import LineChart from '../components/LineChart'

const PIE_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#C9CBCF', '#7BC8A4', '#E7E9ED', '#76D7C4',
]

function getDefaultPeriod() {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]
  return { startDate, endDate }
}

/**
 * Transform raw API pie data into Chart.js format
 * API returns: [{ categoryId, name, total }]
 * Chart.js needs: { labels, datasets: [{ data, backgroundColor }] }
 */
function transformPieData(raw) {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null
  return {
    labels: raw.map(r => r.name),
    datasets: [{
      data: raw.map(r => r.total),
      backgroundColor: raw.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]),
    }]
  }
}

/**
 * Transform raw API bar data into Chart.js format
 * API returns: [{ month, income, expenses }]
 * Chart.js needs: { labels, datasets: [{ label, data }] }
 */
function transformBarData(raw) {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null
  return {
    labels: raw.map(r => r.month),
    datasets: [
      { label: 'Income', data: raw.map(r => r.income), backgroundColor: '#4ade80' },
      { label: 'Expenses', data: raw.map(r => r.expenses), backgroundColor: '#f87171' },
    ]
  }
}

/**
 * Transform raw API line data into Chart.js format
 * API returns: [{ date, balance }]
 * Chart.js needs: { labels, datasets: [{ label, data }] }
 */
function transformLineData(raw) {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null
  return {
    labels: raw.map(r => r.date),
    datasets: [{
      label: 'Balance',
      data: raw.map(r => r.balance),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
    }]
  }
}

export default function DashboardPage() {
  const [period, setPeriod] = useState(getDefaultPeriod)
  const [summary, setSummary] = useState(null)
  const [pieData, setPieData] = useState(null)
  const [barData, setBarData] = useState(null)
  const [lineData, setLineData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEmpty, setIsEmpty] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      getSummary(period),
      getPieData(period),
      getBarData(),
      getLineData(period),
    ])
      .then(([summaryRes, pieRes, barRes, lineRes]) => {
        if (cancelled) return
        setSummary(summaryRes)
        setPieData(transformPieData(pieRes))
        setBarData(transformBarData(barRes))
        setLineData(transformLineData(lineRes))

        // Determine empty state: no income and no expenses
        const noData =
          summaryRes.totalIncome === 0 && summaryRes.totalExpenses === 0
        setIsEmpty(noData)
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(null)
          setPieData(null)
          setBarData(null)
          setLineData(null)
          setIsEmpty(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [period])

  function handlePeriodChange(newPeriod) {
    setPeriod(newPeriod)
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <PeriodSelector
          startDate={period.startDate}
          endDate={period.endDate}
          onChange={handlePeriodChange}
        />
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg bg-gray-50 p-12 text-center">
          <p className="text-lg text-gray-600">
            No budget entries yet. Add your first entry to see your financial overview.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PeriodSelector
        startDate={period.startDate}
        endDate={period.endDate}
        onChange={handlePeriodChange}
      />

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Income"
          value={summary?.totalIncome}
          color="green"
        />
        <SummaryCard
          label="Total Expenses"
          value={summary?.totalExpenses}
          color="red"
        />
        <SummaryCard
          label="Net Balance"
          value={summary?.netBalance}
          color="blue"
        />
      </div>

      {/* Top-5 Expense Categories */}
      {summary?.top5Categories && summary.top5Categories.length > 0 && (
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Top 5 Expense Categories
          </h3>
          <ul className="space-y-2">
            {summary.top5Categories.map((cat, idx) => (
              <li
                key={cat.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">
                  {idx + 1}. {cat.name}
                </span>
                <span className="font-medium text-gray-800">
                  ${cat.total.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Expenses by Category
          </h3>
          <PieChart data={pieData} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Monthly Income vs Expenses
          </h3>
          <BarChart data={barData} />
        </div>
      </div>
      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Cumulative Balance Over Time
        </h3>
        <LineChart data={lineData} />
      </div>
    </div>
  )
}
