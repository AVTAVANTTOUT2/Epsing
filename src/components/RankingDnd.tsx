'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

interface Player {
  id: number;
  username: string;
}

interface RankingDndProps {
  players: Player[];
  initialOrder?: number[];
  onChange: (orderedIds: number[]) => void;
}

const badgeColors: Record<number, string> = {
  1: 'bg-[#F59E0B] text-[#191919]',
  2: 'bg-[#9CA3AF] text-[#191919]',
  3: 'bg-[#B45309] text-white',
};

function SortableItem({ player, position }: { player: Player; position: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const badgeColor = badgeColors[position] ?? 'bg-muted text-muted-foreground';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 min-h-[56px] ${
        isDragging ? 'opacity-80 scale-[1.02] shadow-lg z-50' : ''
      }`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${badgeColor}`}
      >
        {position}
      </div>

      <PlayerAvatar username={player.username} size="md" />

      <div className="flex-1 font-medium truncate">{player.username}</div>

      <button
        {...listeners}
        {...attributes}
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="Déplacer"
      >
        <GripVertical className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
}

export function RankingDnd({ players, initialOrder, onChange }: RankingDndProps) {
  const [items, setItems] = useState<Player[]>(() => {
    if (initialOrder && initialOrder.length === players.length) {
      return initialOrder
        .map((id) => players.find((p) => p.id === id))
        .filter((p): p is Player => p !== undefined);
    }
    return players;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(prev, oldIndex, newIndex);
        onChange(newItems.map((item) => item.id));
        return newItems;
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((player, index) => (
            <SortableItem key={player.id} player={player} position={index + 1} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
