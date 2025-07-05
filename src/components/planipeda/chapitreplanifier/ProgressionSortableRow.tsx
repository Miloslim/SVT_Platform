// src/components/planipeda/chapitreplanifier/ProgressionSortableRow.tsx

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface PlanChapterProgressionItem {
  id: string;
  type: 'sequence' | 'activity' | 'evaluation';
  titre?: string;
  ordre: number;
  // autres propriétés éventuelles...
}

interface ProgressionSortableRowProps {
  id: string;
  item: PlanChapterProgressionItem;
  index: number;
  totalItems: number;
  onRemove: (type: 'activity' | 'evaluation' | 'sequence', id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onToggleExpand: (id: string) => void;
  isSelected: boolean;
  onSelect: (item: PlanChapterProgressionItem) => void;
}

const ProgressionSortableRow: React.FC<ProgressionSortableRowProps> = ({
  id,
  item,
  index,
  totalItems,
  onRemove,
  onMoveUp,
  onMoveDown,
  onToggleExpand,
  isSelected,
  onSelect,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    backgroundColor: isSelected ? '#ebf8ff' : undefined, // style pour ligne sélectionnée
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(item)}
      className="hover:bg-gray-100"
    >
      <td className="px-2 py-2 text-center">{index + 1}</td>
      <td className="px-2 py-2 text-center capitalize">{item.type}</td>
      <td className="px-4 py-2">{item.titre || 'Sans titre'}</td>
      <td className="px-2 py-2 text-right space-x-2">
        <button
          onClick={e => { e.stopPropagation(); onMoveUp(id); }}
          disabled={index === 0}
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          title="Monter"
        >
          ↑
        </button>
        <button
          onClick={e => { e.stopPropagation(); onMoveDown(id); }}
          disabled={index === totalItems - 1}
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          title="Descendre"
        >
          ↓
        </button>
        <button
          onClick={e => { e.stopPropagation(); onToggleExpand(id); }}
          className="px-2 py-1 bg-blue-500 text-white rounded"
          title="Développer / Réduire"
        >
          +
        </button>
        <button
          onClick={e => { e.stopPropagation(); onRemove(item.type, id); }}
          className="px-2 py-1 bg-red-500 text-white rounded"
          title="Supprimer"
        >
          ✕
        </button>
      </td>
    </tr>
  );
};

export default ProgressionSortableRow;
