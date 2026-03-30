import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:4000/api/cuj' })

export const getCujs = async () => {
  const res = await api.get('/')
  return res.data
}

export const getCuj = async (id: string) => {
  const res = await api.get(`/${id}`)
  return res.data
}

export const createCuj = async (payload: any) => {
  const res = await api.post('/', payload)
  return res.data
}

export const createStep = async (cujId: string, step: any) => {
  const res = await api.post(`/${cujId}/steps`, step)
  return res.data
}

export const updateStep = async (cujId: string, stepId: string, payload: any) => {
  const res = await api.put(`/${cujId}/steps/${stepId}`, payload)
  return res.data
}

export const linkMacroToStep = async (cujId: string, stepId: string, macro: any) => {
  const res = await api.post(`/${cujId}/steps/${stepId}/macros`, macro)
  return res.data
}

export const createEdge = async (cujId: string, edge: any) => {
  const res = await api.post(`/${cujId}/edges`, edge)
  return res.data
}

export const deleteEdge = async (cujId: string, edge: { from: string, to: string }) => {
  const res = await api.delete(`/${cujId}/edges`, { data: edge })
  return res.data
}

export const createMacro = async (cujId: string, macro: any) => {
  const res = await api.post(`/${cujId}/macros`, macro)
  return res.data
}

export const linkPageToMacro = async (cujId: string, stepId: string, macroName: string, page: any) => {
  const res = await api.post(`/${cujId}/steps/${stepId}/macros/${encodeURIComponent(macroName)}/pages`, page)
  return res.data
}

export const updateMacroName = async (cujId: string, stepId: string, macroName: string, payload: any) => {
  const res = await api.put(`/${cujId}/steps/${stepId}/macros/${encodeURIComponent(macroName)}`, payload)
  return res.data
}

export const updateCuj = async (cujId: string, payload: any) => {
  const res = await api.put(`/${cujId}`, payload)
  return res.data
}

export const saveCujLayout = async (cujId: string, nodes: any[], edges: any[], startStepId?: string | null) => {
  const body: any = { nodes, edges }
  if (startStepId !== undefined) {
    body.startStepId = startStepId
  }
  const res = await api.post(`/${cujId}/save-layout`, body)
  return res.data
}

export const updateCujMacroName = async (cujId: string, macroName: string, payload: any) => {
  const res = await api.put(`/${cujId}/macros/${encodeURIComponent(macroName)}`, payload)
  return res.data
}

export const updateCujMacroById = async (cujId: string, macroId: string | number, payload: any) => {
  const res = await api.put(`/${cujId}/macros/id/${macroId}`, payload)
  return res.data
}

export const deleteMacroFromStep = async (cujId: string, stepId: string, macroName: string) => {
  const res = await api.delete(`/${cujId}/steps/${stepId}/macros/${encodeURIComponent(macroName)}`)
  return res.data
}

export const deleteStep = async (cujId: string, stepId: string) => {
  const res = await api.delete(`/${cujId}/steps/${stepId}`)
  return res.data
}

export const deletePageFromMacro = async (cujId: string, stepId: string, macroName: string, pageUrl: string) => {
  const res = await api.delete(`/${cujId}/steps/${stepId}/macros/${encodeURIComponent(macroName)}/pages/${encodeURIComponent(pageUrl)}`)
  return res.data
}

export const deleteCujMacro = async (cujId: string, macroName: string) => {
  const res = await api.delete(`/${cujId}/macros/${encodeURIComponent(macroName)}`)
  return res.data
}

export const deleteCujMacroById = async (cujId: string, macroId: string | number) => {
  const res = await api.delete(`/${cujId}/macros/id/${macroId}`)
  return res.data
}

// ============================================
// COMPONENT API FUNCTIONS
// ============================================

export const createComponent = async (cujId: string, componentData: any) => {
  const res = await api.post(`/${cujId}/components`, componentData)
  return res.data
}

export const updateComponent = async (cujId: string, componentId: string | number, payload: any) => {
  const res = await api.put(`/${cujId}/components/${componentId}`, payload)
  return res.data
}

export const deleteComponent = async (cujId: string, componentId: string | number) => {
  const res = await api.delete(`/${cujId}/components/${componentId}`)
  return res.data
}

export const createMacroInComponent = async (cujId: string, componentId: string | number, macro: any) => {
  const res = await api.post(`/${cujId}/components/${componentId}/macros`, macro)
  return res.data
}

export const addMacroToComponent = async (cujId: string, componentId: string | number, macroId: string | number) => {
  const res = await api.post(`/${cujId}/components/${componentId}/macros/${macroId}`)
  return res.data
}

export const removeMacroFromComponent = async (cujId: string, componentId: string | number, macroId: string | number) => {
  const res = await api.delete(`/${cujId}/components/${componentId}/macros/${macroId}`)
  return res.data
}

export default api
