import { useState, useEffect } from 'react'
import { getEntries, createEntry, updateEntry, deleteEntry } from '../api/entries'
import { getCategories } from '../api/categories'
import EntryForm from '../components/EntryForm'

export default function EntriesPage() {
  const [entries, setEntries] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    categoryId: '',
    type: '',
  })
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [filters])

  async function fetchCategories() {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      // silently fail — categories are non-critical for page load
    }
  }

  async function fetchEntries() {
    try {
      setLoading(true)
      const activeFilters = {}
      if (filters.startDate) activeFilters.startDate = filters.startDate
      if (filters.endDate) activeFilters.endDate = filters.endDate
      if (filters.categoryId) activeFilters.categoryId = filters.categoryId
      if (filters.type) activeFilters.type = filters.type
      const data = await getEntries(activeFilters)
      setEntries(data)
    } catch (err) {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(e) {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleAddClick() {
    setEditingEntry(null)
    setShowForm(true)
  }

  function handleEditClick(entry) {
    setEditingEntry(entry)
    setShowForm(true)
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this entry?')) return
    try {
      await deleteEntry(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      // silently fail
    }
  }

  async function handleSave(formData) {
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, formData)
      } else {
        await createEntry(formData)
      }
      setShowForm(false)
      setEditingEntry(null)
      fetchEntries()
    } catch (err) {
      // silently fail — form stays open for retry
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  function getCategoryName(categoryId) {
    const cat = categories.find((c) => c.id === categoryId)
    return cat ? cat.name : '—'
  }

  if (loading && entries.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <p className="text-gray-500">Loading entries...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Budget Entries</h1>
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Entry
          </button>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={filters.categoryId}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>

        {/* Entries table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-600 font-medium">Date</th>
                <th className="text-left py-2 text-gray-600 font-medium">Description</th>
                <th className="text-left py-2 text-gray-600 font-medium">Category</th>
                <th className="text-left py-2 text-gray-600 font-medium">Type</th>
                <th className="text-right py-2 text-gray-600 font-medium">Amount</th>
                <th className="text-right py-2 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100">
                  <td className="py-3 text-gray-800">{entry.entry_date}</td>
                  <td className="py-3 text-gray-800">{entry.description || '—'}</td>
                  <td className="py-3 text-gray-800">{getCategoryName(entry.category_id)}</td>
                  <td className="py-3">
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        entry.type === 'income'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium text-gray-800">
                    {formatCurrency(entry.amount)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleEditClick(entry)}
                      className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded hover:bg-blue-50 transition-colors mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-sm text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {entries.length === 0 && !loading && (
          <p className="text-center text-gray-500 py-8">
            No entries found. Click "Add Entry" to create your first budget entry.
          </p>
        )}
      </div>

      {/* Entry Form Modal */}
      <EntryForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingEntry(null)
        }}
        onSave={handleSave}
        entry={editingEntry}
        categories={categories}
      />
    </div>
  )
}
