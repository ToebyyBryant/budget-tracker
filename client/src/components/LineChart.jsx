import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function LineChart({ data }) {
  const isEmpty =
    !data ||
    !data.labels ||
    data.labels.length === 0 ||
    (data.datasets &&
      data.datasets.every(ds => ds.data.every(v => v === 0)))

  if (isEmpty) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
        No data for this period.
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <Line
        data={data}
        options={{
          responsive: true,
          plugins: { legend: { position: 'top' } },
          scales: { y: { beginAtZero: true } },
        }}
      />
    </div>
  )
}
