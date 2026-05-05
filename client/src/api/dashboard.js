import apiClient from './client'

export function getSummary(params) {
  return apiClient.get('/dashboard/summary', {
    params: { startDate: params.startDate, endDate: params.endDate }
  }).then(response => response.data)
}

export function getPieData(params) {
  return apiClient.get('/dashboard/charts/pie', {
    params: { startDate: params.startDate, endDate: params.endDate }
  }).then(response => response.data)
}

export function getBarData() {
  return apiClient.get('/dashboard/charts/bar').then(response => response.data)
}

export function getLineData(params) {
  return apiClient.get('/dashboard/charts/line', {
    params: { startDate: params.startDate, endDate: params.endDate }
  }).then(response => response.data)
}
