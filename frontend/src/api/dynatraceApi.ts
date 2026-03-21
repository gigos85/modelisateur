import axios from 'axios'

const api = axios.create({ baseURL: '/api/dynatrace' })

export const getPages = async () => {
  const res = await api.get('/pages')
  return res.data
}

export const createPage = async (payload: any) => {
  const res = await api.post('/pages', payload)
  return res.data
}

export default api
