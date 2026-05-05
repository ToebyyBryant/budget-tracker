import apiClient from './client'

export function getEntries(filters = {}) {
  const params = {}
  if (filters.startDate) params.startDate = filters.startDate
  if (filters.endDate) params.endDate = filters.endDate
  if (filters.categoryId) params.categoryId = filters.categoryId
  if (filters.type) params.type = filters.type
  return apiClient.get('/entries', { params }).then((response) => response.data)
}

export function createEntry(data) {
  return apiClient
    .post('/entries', {
      amount: data.amount,
      type: data.type,
      category_id: data.category_id,
      entry_date: data.entry_date,
      description: data.description,
    })
    .then((response) => response.data)
}

export function updateEntry(id, data) {
  return apiClient
    .put(`/entries/${id}`, {
      amount: data.amount,
      type: data.type,
      category_id: data.category_id,
      entry_date: data.entry_date,
      description: data.description,
    })
    .then((response) => response.data)
}

export function deleteEntry(id) {
  return apiClient.delete(`/entries/${id}`)
}
