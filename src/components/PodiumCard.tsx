import Link from 'next/link';
import { PlayerAvatar } from './PlayerAvatar';
import type { RankedPlayer } from '@/types';

interface PodiumCardProps {
  player: RankedPlayer;
  rank: 1 | 2 | 3;
}

const medals: Record<1 | 2 | 3, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const colors: Record<1 | 2 | 3, { border: string; bg: string }> = {
  1: { border: 'border-[#F59E0B]/40', bg: 'bg-[#F59E0B]/5' },
  2: { border: 'border-[#9CA3AF]/40', bg: 'bg-[#9CA3AF]/5' },
  3: { border: 'border-[#B45309]/40', bg: 'bg-[#B45309]/5' },
};

export function PodiumCard({ player, rank }: PodiumCardProps) {
  const medal = medals[rank];
  const color = colors[rank];
  const formattedPoints = (player.points / 100).toFixed(2);

  return (
    <Link
      href={`/stats?userId=${player.userId}`}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 ${color.border} ${color.bg} bg-card transition-transform hover:scale-[1.02] active:scale-[0.98]`}
    >
      <div className="text-2xl">{medal}</div>
      <PlayerAvatar username={player.username} size="lg" />
      <div className="flex flex-col items-center gap-0.5 min-w-0 w-full">
        <div className="flex items-center justify-center gap-1 w-full px-1">
          <p className="font-semibold truncate text-center text-sm">
            {player.username}
          </p>
          {player.isMvp && (
            <span title={`MVP (${player.mvpCount} votes)`} className="text-[#F59E0B] text-[10px] flex-shrink-0">
              ⭐
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono">{formattedPoints} pts</p>
      </div>
    </Link>
  );
}
