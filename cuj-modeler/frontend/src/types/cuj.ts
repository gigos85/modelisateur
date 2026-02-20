export type Criticity = 'Gold' | 'Silver' | 'Bronze';

export interface DynatracePage {
  id: string;
  name: string;
  applicationId: string;
}

export interface Macrofunctionality {
  id: string;
  name: string;
  components: string[];
  dynatracePages: DynatracePage[];
}

export interface Step {
  id: string;
  name: string;
  position: { x: number; y: number };
  macrofunctionalities: Macrofunctionality[];
}

export interface CUJ {
  id: string;
  name: string;
  criticity: Criticity;
  steps: Step[];
}

export interface ExportedCuj {
  cujName: string;
  criticity: Criticity;
  steps: Array<{
    name: string;
    macrofunctionalities: Array<{
      name: string;
      pages: Array<{
        id: string;
        name: string;
      }>;
    }>;
  }>;
}
