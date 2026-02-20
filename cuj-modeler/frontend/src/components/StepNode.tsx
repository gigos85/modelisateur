import { memo } from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { Macrofunctionality } from '../types/cuj';

interface StepNodeData {
  id: string;
  name: string;
  macrofunctionalities: Macrofunctionality[];
  onDropMacro: (stepId: string, macroId: string) => void;
  onSelectMacro: (stepId: string, macro: Macrofunctionality) => void;
}

const StepNode = ({ data }: NodeProps<StepNodeData>) => {
  return (
    <div
      className="min-w-64 rounded-lg border border-slate-300 bg-white p-3 shadow"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const macroId = event.dataTransfer.getData('application/macro-id');
        if (macroId) {
          data.onDropMacro(data.id, macroId);
        }
      }}
    >
      <div className="mb-2 text-sm font-semibold">{data.name}</div>
      <div className="space-y-2">
        {data.macrofunctionalities.map((macro) => (
          <button
            key={macro.id}
            className="w-full rounded border border-blue-200 bg-blue-50 px-2 py-1 text-left text-xs"
            onClick={() => data.onSelectMacro(data.id, macro)}
          >
            <div className="font-medium">{macro.name}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {macro.dynatracePages.map((page) => (
                <span key={page.id} className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px]">
                  {page.name}
                </span>
              ))}
            </div>
          </button>
        ))}
        <div className="rounded border border-dashed border-slate-300 p-2 text-center text-xs text-slate-500">
          Glissez une macrofonctionnalité ici
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(StepNode);
