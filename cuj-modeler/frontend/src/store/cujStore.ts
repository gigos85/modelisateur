import { create } from 'zustand';
import { CUJ, DynatracePage, ExportedCuj, Macrofunctionality, Step } from '../types/cuj';

interface CujState {
  cujs: CUJ[];
  selectedCujId: string | null;
  setCujs: (cujs: CUJ[]) => void;
  setSelectedCuj: (id: string | null) => void;
  addStep: (cujId: string, step: Step) => void;
  removeStep: (cujId: string, stepId: string) => void;
  addMacroToStep: (cujId: string, stepId: string, macro: Macrofunctionality) => void;
  removeMacroFromStep: (cujId: string, stepId: string, macroId: string) => void;
  attachDynatracePages: (cujId: string, stepId: string, macroId: string, pages: DynatracePage[]) => void;
  exportCUJ: (cujId: string) => ExportedCuj | null;
}

const updateCuj = (cujs: CUJ[], cujId: string, updater: (current: CUJ) => CUJ): CUJ[] =>
  cujs.map((cuj) => (cuj.id === cujId ? updater(cuj) : cuj));

export const useCujStore = create<CujState>((set, get) => ({
  cujs: [],
  selectedCujId: null,
  setCujs: (cujs) => set({ cujs }),
  setSelectedCuj: (id) => set({ selectedCujId: id }),
  addStep: (cujId, step) => {
    set((state) => ({
      cujs: updateCuj(state.cujs, cujId, (cuj) => ({ ...cuj, steps: [...cuj.steps, step] }))
    }));
  },
  removeStep: (cujId, stepId) => {
    set((state) => ({
      cujs: updateCuj(state.cujs, cujId, (cuj) => ({ ...cuj, steps: cuj.steps.filter((step) => step.id !== stepId) }))
    }));
  },
  addMacroToStep: (cujId, stepId, macro) => {
    set((state) => ({
      cujs: updateCuj(state.cujs, cujId, (cuj) => ({
        ...cuj,
        steps: cuj.steps.map((step) =>
          step.id === stepId
            ? { ...step, macrofunctionalities: [...step.macrofunctionalities.filter((m) => m.id !== macro.id), macro] }
            : step
        )
      }))
    }));
  },
  removeMacroFromStep: (cujId, stepId, macroId) => {
    set((state) => ({
      cujs: updateCuj(state.cujs, cujId, (cuj) => ({
        ...cuj,
        steps: cuj.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                macrofunctionalities: step.macrofunctionalities.filter((macro) => macro.id !== macroId)
              }
            : step
        )
      }))
    }));
  },
  attachDynatracePages: (cujId, stepId, macroId, pages) => {
    set((state) => ({
      cujs: updateCuj(state.cujs, cujId, (cuj) => ({
        ...cuj,
        steps: cuj.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                macrofunctionalities: step.macrofunctionalities.map((macro) =>
                  macro.id === macroId ? { ...macro, dynatracePages: pages } : macro
                )
              }
            : step
        )
      }))
    }));
  },
  exportCUJ: (cujId) => {
    const cuj = get().cujs.find((item) => item.id === cujId);
    if (!cuj) {
      return null;
    }

    return {
      cujName: cuj.name,
      criticity: cuj.criticity,
      steps: cuj.steps.map((step) => ({
        name: step.name,
        macrofunctionalities: step.macrofunctionalities.map((macro) => ({
          name: macro.name,
          pages: macro.dynatracePages.map((page) => ({ id: page.id, name: page.name }))
        }))
      }))
    };
  }
}));
