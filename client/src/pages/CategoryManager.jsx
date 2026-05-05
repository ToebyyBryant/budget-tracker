import { useState, useEffect } from 'react'
import { getCategories, createCategory, deleteCategory } from '../api/categories'

export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      setLoading(true)
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      setError('Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    const trimmed = newName.trim()
    if (!trimmed) return

    try {
      const created = await createCategory(trimmed)
      setCategories((prev) => [...prev, created])
      setNewName('')
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError('A category with this name already exists.')
      } else {
        setError('Failed to create category.')
      }
    }
  }

  async function handleDelete(id) {
    setError('')
    try {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError('This category is in use and cannot be deleted.')
      } else {
        setError('Failed to delete category.')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <p className="text-gray-500">Loading categories...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Category Manager</h1>

        {/* Add category form */}
        <form onSubmit={handleAdd} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Category list */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-gray-600 font-medium">Name</th>
              <th className="text-left py-2 text-gray-600 font-medium">Type</th>
              <th className="text-right py-2 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-800">{category.name}</td>
                <td className="py-3">
                  <span
                    className={`text-sm px-2 py-1 rounded ${
                      category.is_default
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {category.is_default ? 'Default' : 'Custom'}
                  </span>
                </td>
                <td className="py-3 text-right">
                  {category.is_default ? (
                    <button
                      disabled
                      title="Default categories cannot be deleted"
                      className="text-sm text-gray-400 cursor-not-allowed px-3 py-1 border border-gray-200 rounded"
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-sm text-red-600 hover:text-red-800 px-3 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && (
          <p className="text-center text-gray-500 py-4">No categories found.</p>
        )}
      </div>
    </div>
  )
}
