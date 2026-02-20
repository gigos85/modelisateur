import {
  Background,
  Controls,
  Edge,
  Node,
  NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import StepNode from '../components/StepNode';
import { cujService } from '../services/cujService';
import { dynatraceService } from '../services/dynatraceService';
import { useCujStore } from '../store/cujStore';
import { DynatracePage, Macrofunctionality, Step } from '../types/cuj';

const macroCatalog: Macrofunctionality[] = [
  { id: 'macro-1', name: 'Calcul Mensualité', components: ['api-credit'], dynatracePages: [] },
  { id: 'macro-2', name: 'Vérification Éligibilité', components: ['idp-auth'], dynatracePages: [] },
  { id: 'macro-3', name: 'Création Dossier', components: ['svc-notifications'], dynatracePages: [] }
];

const nodeTypes: NodeTypes = { stepNode: StepNode };

const EditorPage = () => {
  const { id = '' } = useParams();
  const { cujs, setCujs, addStep, addMacroToStep, attachDynatracePages, exportCUJ } = useCujStore();
  const [selectedMacro, setSelectedMacro] = useState<{ stepId: string; macro: Macrofunctionality } | null>(null);
  const [availablePages, setAvailablePages] = useState<DynatracePage[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, _setEdges, onEdgesChange] = useEdgesState([]);

  const cuj = cujs.find((item) => item.id === id);

  useEffect(() => {
    if (!cuj) {
      void cujService.list().then(setCujs);
    }
    void dynatraceService.listPages().then((pages) =>
      setAvailablePages(
        pages.map((page) => ({
          id: page.id,
          name: page.name,
          applicationId: page.id
        }))
      )
    );
  }, [cuj, setCujs]);

  useEffect(() => {
    if (!cuj) {
      return;
    }

    const uiNodes: Node[] = cuj.steps.map((step) => ({
      id: step.id,
      type: 'stepNode',
      position: step.position,
      data: {
        id: step.id,
        name: step.name,
        macrofunctionalities: step.macrofunctionalities,
        onDropMacro: (stepId: string, macroId: string) => {
          const macro = macroCatalog.find((item) => item.id === macroId);
          if (macro) {
            addMacroToStep(cuj.id, stepId, structuredClone(macro));
          }
        },
        onSelectMacro: (stepId: string, macro: Macrofunctionality) => setSelectedMacro({ stepId, macro })
      }
    }));

    const uiEdges: Edge[] = cuj.steps.slice(1).map((step, index) => ({
      id: `edge-${cuj.steps[index].id}-${step.id}`,
      source: cuj.steps[index].id,
      target: step.id
    }));

    setNodes(uiNodes);
    _setEdges(uiEdges);
  }, [cuj, addMacroToStep, setNodes, _setEdges]);

  const persist = async (updatedSteps: Step[]) => {
    if (!cuj) return;
    const updated = await cujService.update(cuj.id, {
      name: cuj.name,
      criticity: cuj.criticity,
      steps: updatedSteps
    });
    setCujs(cujs.map((item) => (item.id === cuj.id ? updated : item)));
  };

  const addStepHandler = async () => {
    if (!cuj) return;
    const step: Step = {
      id: crypto.randomUUID(),
      name: `Étape ${cuj.steps.length + 1}`,
      position: { x: 50 + cuj.steps.length * 280, y: 120 },
      macrofunctionalities: []
    };
    addStep(cuj.id, step);
    await persist([...cuj.steps, step]);
  };

  const saveDynatracePages = async () => {
    if (!cuj || !selectedMacro) return;
    const selected = availablePages.slice(0, 2);
    attachDynatracePages(cuj.id, selectedMacro.stepId, selectedMacro.macro.id, selected);

    const updatedSteps = cuj.steps.map((step) =>
      step.id === selectedMacro.stepId
        ? {
            ...step,
            macrofunctionalities: step.macrofunctionalities.map((macro) =>
              macro.id === selectedMacro.macro.id ? { ...macro, dynatracePages: selected } : macro
            )
          }
        : step
    );
    await persist(updatedSteps);
  };

  const exportedJson = useMemo(() => (cuj ? exportCUJ(cuj.id) : null), [cuj, exportCUJ]);

  if (!cuj) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="h-screen">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <h1 className="text-xl font-bold">Parcours : {cuj.name}</h1>
        <div className="flex gap-2">
          <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white" onClick={() => void addStepHandler()}>
            Ajouter Étape
          </button>
          <button
            className="rounded bg-emerald-600 px-3 py-2 text-sm text-white"
            onClick={() => {
              if (!exportedJson) return;
              const blob = new Blob([JSON.stringify(exportedJson, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${cuj.name}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Exporter JSON
          </button>
        </div>
      </header>
      <div className="grid h-[calc(100%-57px)] grid-cols-[250px_1fr_300px]">
        <aside className="border-r bg-white p-3">
          <h2 className="mb-2 font-semibold">Macrofonctionnalités</h2>
          <div className="space-y-2">
            {macroCatalog.map((macro) => (
              <div
                key={macro.id}
                className="cursor-grab rounded border p-2 text-sm"
                draggable
                onDragStart={(event) => event.dataTransfer.setData('application/macro-id', macro.id)}
              >
                {macro.name}
              </div>
            ))}
          </div>
        </aside>
        <main className="h-full">
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes}>
            <Background />
            <Controls />
          </ReactFlow>
        </main>
        <aside className="border-l bg-white p-3">
          <h2 className="font-semibold">Détails macro</h2>
          {selectedMacro ? (
            <div className="mt-3 space-y-3">
              <div className="rounded border p-2 text-sm">
                <div className="font-medium">{selectedMacro.macro.name}</div>
                <div className="mt-2 text-xs text-slate-500">Pages Dynatrace associées:</div>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {selectedMacro.macro.dynatracePages.map((page) => (
                    <li key={page.id}>{page.name}</li>
                  ))}
                </ul>
              </div>
              <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white" onClick={() => void saveDynatracePages()}>
                Associer pages Dynatrace
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Sélectionnez une macro dans une étape.</p>
          )}
        </aside>
      </div>
    </div>
  );
};

export default EditorPage;
