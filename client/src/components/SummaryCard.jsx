export default function SummaryCard({ label, value, color = 'blue' }) {
  const colorClasses = {
    blue: 'border-blue-500 text-blue-700',
    green: 'border-green-500 text-green-700',
    red: 'border-red-500 text-red-700',
  }

  const accent = colorClasses[color] || colorClasses.blue

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value ?? 0)

  return (
    <div className={`rounded-lg border-l-4 bg-white p-4 shadow ${accent.split(' ')[0]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${accent.split(' ')[1]}`}>{formatted}</p>
    </div>
  )
}
