import { useState, useEffect } from 'react'
import { getSummary, getPieData, getBarData, getLineData } from '../api/dashboard'
import PeriodSelector from '../components/PeriodSelector'
import SummaryCard from '../components/SummaryCard'
import PieChart from '../components/PieChart'
import BarChart from '../components/BarChart'
import LineChart from '../components/LineChart'

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
        setPieData(pieRes)
        setBarData(barRes)
        setLineData(lineRes)

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
