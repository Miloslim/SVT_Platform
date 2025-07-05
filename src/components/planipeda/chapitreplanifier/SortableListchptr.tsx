// src/components/planipeda/ScenarioEditor/SortableListchptr.tsx

import React from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItemchptr from './SortableItemchptr';
import { PlanChapterProgressionItem } from '@/types/planificationTypes';

interface SortableListchptrProps {
  items: PlanChapterProgressionItem[];
  selectedItemId: string | null;
  onSelectItem: (item: PlanChapterProgressionItem) => void;
  onReorder: (newItems: PlanChapterProgressionItem[]) => void;
  onRemove: (type: 'activity' | 'evaluation' | 'sequence', id: string | number) => void;
}

const SortableListchptr: React.FC<SortableListchptrProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  onReorder,
  onRemove,
}) => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      ordre: index + 1,  // ordre commence à 1 pour la lisibilité et cohérence
    }));

    onReorder(reordered);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase tracking-wider">
            <tr>
              <th className="w-12 py-2 text-center font-normal">Ordre</th>
              <th className="w-16 py-2 text-center font-normal">Type</th>
              <th className="py-2 font-normal text-left">Titre</th>
              <th className="w-32 py-2 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => (
              <SortableItemchptr
                key={item.id}
                id={item.id}
                item={item}
                index={index}
                onRemove={onRemove}
                onMoveUp={() => {
                  if (index > 0) {
                    const reordered = arrayMove(items, index, index - 1).map((itm, i) => ({
                      ...itm,
                      ordre: i + 1,
                    }));
                    onReorder(reordered);
                  }
                }}
                onMoveDown={() => {
                  if (index < items.length - 1) {
                    const reordered = arrayMove(items, index, index + 1).map((itm, i) => ({
                      ...itm,
                      ordre: i + 1,
                    }));
                    onReorder(reordered);
                  }
                }}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                isSelected={selectedItemId === item.id}
                onSelect={() => onSelectItem(item)}
              />
            ))}
          </tbody>
        </table>
      </SortableContext>
    </DndContext>
  );
};

export default SortableListchptr;
