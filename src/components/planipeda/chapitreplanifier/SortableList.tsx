// src/components/planipeda/chapitreplanifier/SortableList.tsx
import React from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItem from './SortableItem';
import { PlanChapterProgressionItem } from '@/types/planificationTypes';

interface SortableListProps {
  items: PlanChapterProgressionItem[];
  selectedItemId: string | null;
  onSelectItem: (item: PlanChapterProgressionItem) => void;
  onReorder: (newItems: PlanChapterProgressionItem[]) => void;
  onRemove: (type: 'activity' | 'evaluation' | 'sequence', id: string) => void;
}

const SortableList: React.FC<SortableListProps> = ({
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
      ordre: index + 1,
    }));

    onReorder(reordered);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <>
          {items.map((item, index) => (
            <SortableItem
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
        </>
      </SortableContext>
    </DndContext>
  );
};

export default SortableList;
