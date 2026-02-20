import { apiClient } from './api';

export interface DynatraceApiPage {
  id: string;
  name: string;
}

export const dynatraceService = {
  async listPages(): Promise<DynatraceApiPage[]> {
    const { data } = await apiClient.get<DynatraceApiPage[]>('/dynatrace/pages');
    return data;
  }
};
