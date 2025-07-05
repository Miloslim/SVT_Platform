// src/components/planipeda/chapitreplanifier/ProgressionList.tsx

import React from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import ProgressionSortableRow, { PlanChapterProgressionItem } from './ProgressionSortableRow';

interface ProgressionListProps {
  items: PlanChapterProgressionItem[];
  selectedItemId: string | null;
  onSelectItem: (item: PlanChapterProgressionItem) => void;
  onReorder: (newItems: PlanChapterProgressionItem[]) => void;
  onRemove: (type: 'activity' | 'evaluation' | 'sequence', id: string) => void;
  onToggleExpand: (id: string) => void;
}

const ProgressionList: React.FC<ProgressionListProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  onReorder,
  onRemove,
  onToggleExpand,
}) => {
  // Gestion du drag & drop de l’ordre
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      ordre: index,
    }));

    onReorder(reordered);
  };

  // Monter un item dans la liste
  const handleMoveUp = (id: string) => {
    const currentIndex = items.findIndex((item) => item.id === id);
    if (currentIndex > 0) {
      const reordered = arrayMove(items, currentIndex, currentIndex - 1).map((item, index) => ({
        ...item,
        ordre: index,
      }));
      onReorder(reordered);
    }
  };

  // Descendre un item dans la liste
  const handleMoveDown = (id: string) => {
    const currentIndex = items.findIndex((item) => item.id === id);
    if (currentIndex < items.length - 1) {
      const reordered = arrayMove(items, currentIndex, currentIndex + 1).map((item, index) => ({
        ...item,
        ordre: index,
      }));
      onReorder(reordered);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase tracking-wider text-xs text-left">
            <tr>
              <th className="px-2 py-3 text-center">Ordre</th>
              <th className="px-2 py-3 text-center">Type</th>
              <th className="px-4 py-3">Contenu</th>
              <th className="px-2 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => (
              <ProgressionSortableRow
                key={item.id}
                id={item.id}
                item={item}
                index={index}
                totalItems={items.length}
                onRemove={onRemove}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onToggleExpand={onToggleExpand}
                isSelected={selectedItemId === item.id}
                onSelect={onSelectItem}
              />
            ))}
          </tbody>
        </table>
      </SortableContext>
    </DndContext>
  );
};

export default ProgressionList;
