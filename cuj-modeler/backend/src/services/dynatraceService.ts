import '../config.js';
interface DynatraceApiPage {
  id: string;
  name: string;
}

const mockPages: DynatraceApiPage[] = [
  { id: 'APP-001', name: 'Simulation Page' },
  { id: 'APP-002', name: 'Souscription Page' }
];

export const getDynatracePages = async (): Promise<DynatraceApiPage[]> => {
  const token = process.env.DYNATRACE_TOKEN;

  // MVP: fallback to mock data when no token is present. Real API integration can be added without impacting UI.
  if (!token) {
    return mockPages;
  }

  // Placeholder for real integration.
  return mockPages;
};
