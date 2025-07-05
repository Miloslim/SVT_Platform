// src/components/planipeda/chapitreplanifier/SortableItem.tsx
import React, { useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlanChapterProgressionItem, PlanEvaluation } from '@/types/planificationTypes';
import { Button } from '@/components/ui/button';
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  GripVertical,
  FlaskConical,
  BookText,
  Lightbulb,
} from 'lucide-react';

interface SortableItemProps {
  id: string;
  item: PlanChapterProgressionItem;
  index: number;
  onRemove: (type: 'activity' | 'evaluation' | 'sequence', id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  item,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isSelected = false,
  onSelect = () => {},
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRemove = useCallback(() => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${item.titre || 'cet élément'}" ?`)) {
      onRemove(item.type, item.id);
    }
  }, [item.id, item.titre, item.type, onRemove]);

  // Choix de l'icône selon le type
  const IconComponent =
    item.type === 'activity' ? Lightbulb :
    item.type === 'evaluation' ? BookText :
    FlaskConical;

  const borderColor =
    item.type === 'activity' ? 'border-green-400' :
    item.type === 'evaluation' ? 'border-purple-400' :
    'border-blue-400';

  const bgColor =
    item.type === 'activity' ? 'bg-green-50' :
    item.type === 'evaluation' ? 'bg-purple-50' :
    'bg-blue-50';

  const titleColor =
    item.type === 'activity' ? 'text-green-800' :
    item.type === 'evaluation' ? 'text-purple-800' :
    'text-blue-800';

  const iconColor =
    item.type === 'activity' ? 'text-green-600' :
    item.type === 'evaluation' ? 'text-purple-600' :
    'text-blue-600';

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`relative transition-transform duration-300 ease-in-out cursor-pointer border-b border-gray-200 hover:shadow-lg
        ${bgColor} ${isSelected ? 'bg-blue-100' : ''}`}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onSelect(); } }}
    >
      {/* Ordre + poignée drag */}
      <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-center relative">
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold
            ${item.type === 'activity' ? 'bg-green-200 text-green-800' :
              item.type === 'evaluation' ? 'bg-purple-200 text-purple-800' :
              'bg-blue-200 text-blue-800'}`}
        >
          {item.ordre}
        </span>
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-y-0 left-0 flex items-center justify-center w-8 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-900"
          onClick={(e) => e.stopPropagation()}
          aria-label="Déplacer"
          role="button"
          tabIndex={-1}
        >
          <GripVertical className="h-5 w-5" />
        </div>
      </td>

      {/* Type */}
      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
            ${item.type === 'activity' ? 'bg-green-100 text-green-700' :
              item.type === 'evaluation' ? 'bg-purple-100 text-purple-700' :
              'bg-blue-100 text-blue-700'}`}
        >
          <IconComponent className={`h-4 w-4 mr-1 ${iconColor}`} />
          {item.type === 'activity' ? 'Activité' : item.type === 'evaluation' ? 'Évaluation' : 'Séquence'}
        </span>
      </td>

      {/* Titre + description + type evaluation */}
      <td className="px-4 py-3">
        <div className="flex items-center">
          <IconComponent className={`h-6 w-6 mr-3 ${iconColor} flex-shrink-0`} />
          <div className={`text-sm font-medium ${titleColor}`}>
            {item.titre || 'Sans titre'}
            {item.description && (
              <p className="text-gray-600 text-xs mt-1 truncate max-w-xs md:max-w-md lg:max-w-lg">
                {item.description}
              </p>
            )}
            {item.type === 'evaluation' && (item as PlanEvaluation).type_evaluation && (
              <p className="text-gray-500 text-xs mt-1">Type: {(item as PlanEvaluation).type_evaluation}</p>
            )}
          </div>
        </div>
      </td>

      {/* Actions */}
      <td className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-1">
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp(id);
            }}
            disabled={isFirst}
            className="p-1 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            title="Déplacer vers le haut"
            aria-label="Déplacer vers le haut"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown(id);
            }}
            disabled={isLast}
            className="p-1 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            title="Déplacer vers le bas"
            aria-label="Déplacer vers le bas"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
            title="Supprimer"
            aria-label="Supprimer l'élément"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default SortableItem;
