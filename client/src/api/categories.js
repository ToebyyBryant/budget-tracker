import apiClient from './client'

export function getCategories() {
  return apiClient.get('/categories').then((response) => response.data)
}

export function createCategory(name) {
  return apiClient.post('/categories', { name }).then((response) => response.data)
}

export function deleteCategory(id) {
  return apiClient.delete(`/categories/${id}`)
}
