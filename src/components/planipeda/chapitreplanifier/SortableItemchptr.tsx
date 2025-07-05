// src/components/planipeda/ScenarioEditor/SortableItemchptr.tsx

import React, { useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Activity, BookText, ArrowUp, ArrowDown, Trash2, GripVertical, FlaskConical } from 'lucide-react';
import { PlanChapterProgressionItem } from '@/types/planificationTypes'; // tu peux unifier avec ton autre composant

interface SortableItemProps {
  id: string;
  item: PlanChapterProgressionItem;
  index: number;
  onRemove: (type: 'activity' | 'evaluation' | 'sequence', id: string | number) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  isSelected?: boolean;
  onSelect?: (item: PlanChapterProgressionItem) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  item,
  index,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isSelected = false,
  onSelect = () => {},
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const handleRemove = useCallback(() => {
    if (window.confirm(`Supprimer "${item.titre || 'cet élément'}" ?`)) {
      onRemove(item.type, item.id);
    }
  }, [item, onRemove]);

  const handleClick = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  const typeConfig = {
    activity: {
      label: 'Activité',
      bg: 'bg-green-100',
      text: 'text-green-700',
      iconColor: 'text-green-600',
      icon: Activity,
    },
    evaluation: {
      label: 'Évaluation',
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      iconColor: 'text-purple-600',
      icon: BookText,
    },
    sequence: {
      label: 'Séquence',
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      iconColor: 'text-blue-600',
      icon: FlaskConical,
    },
  }[item.type];

  const Icon = typeConfig.icon;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={`border-b hover:bg-gray-50 transition duration-150 ease-in-out ${isSelected ? 'bg-blue-100 shadow-md' : 'bg-white'}`}
    >
      {/* Drag Handle + Index */}
      <td className="px-2 py-3 text-center relative">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <span className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold rounded-full px-2 py-1 ${typeConfig.bg} ${typeConfig.text}`}>
          {item.ordre != null ? item.ordre + 1 : index + 1}
        </span>
      </td>

      {/* Type label */}
      <td className="px-2 py-3 text-center text-sm">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${typeConfig.bg} ${typeConfig.text}`}>
          <Icon className={`h-4 w-4 mr-1 ${typeConfig.iconColor}`} />
          {typeConfig.label}
        </span>
      </td>

      {/* Title & description */}
      <td className="px-4 py-3 text-sm font-medium text-left text-gray-900 truncate max-w-xs">
        {item.titre || 'Sans titre'}
        {item.description && (
          <p className="text-xs text-gray-600 mt-1 truncate">{item.description}</p>
        )}
        {item.type === 'evaluation' && (item as any).type_evaluation && (
          <p className="text-xs text-gray-500">Type : {(item as any).type_evaluation}</p>
        )}
        {'dureeEstimeeMinutes' in item && item.dureeEstimeeMinutes && (
          <span className="text-xs text-gray-400 ml-1">({item.dureeEstimeeMinutes} min)</span>
        )}
      </td>

      {/* Action buttons */}
      <td className="px-2 py-3 text-sm text-right">
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveUp(id); }}
            disabled={isFirst}
            className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 rounded-full"
            title="Déplacer vers le haut"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveDown(id); }}
            disabled={isLast}
            className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 rounded-full"
            title="Déplacer vers le bas"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleRemove(); }}
            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default SortableItem;
