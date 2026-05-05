import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function PieChart({ data }) {
  const isEmpty =
    !data ||
    !data.labels ||
    data.labels.length === 0 ||
    (data.datasets &&
      data.datasets[0] &&
      data.datasets[0].data.every(v => v === 0))

  if (isEmpty) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
        No expense data for this period.
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <Pie data={data} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
    </div>
  )
}
