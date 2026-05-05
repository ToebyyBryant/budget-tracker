export default function PeriodSelector({ startDate, endDate, onChange }) {
  function handleStartChange(e) {
    onChange({ startDate: e.target.value, endDate })
  }

  function handleEndChange(e) {
    onChange({ startDate, endDate: e.target.value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-gray-600">
        From
        <input
          type="date"
          value={startDate}
          onChange={handleStartChange}
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        To
        <input
          type="date"
          value={endDate}
          onChange={handleEndChange}
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
      </label>
    </div>
  )
}
