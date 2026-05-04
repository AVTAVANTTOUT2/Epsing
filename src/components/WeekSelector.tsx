'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekSelectorProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  canPrev?: boolean;
  canNext?: boolean;
}

export function WeekSelector({
  label,
  onPrevious,
  onNext,
  canPrev = true,
  canNext = true,
}: WeekSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrevious}
        disabled={!canPrev}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Semaine précédente"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="min-w-[140px] text-center font-medium text-sm">{label}</div>

      <button
        onClick={onNext}
        disabled={!canNext}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Semaine suivante"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
