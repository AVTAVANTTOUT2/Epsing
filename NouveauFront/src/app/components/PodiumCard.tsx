import { PlayerAvatar } from './PlayerAvatar';

type PodiumCardProps = {
  player: {
    userId: number;
    username: string;
    points: number;
    rank: number;
  };
  rank: 1 | 2 | 3;
  onClick?: () => void;
};

const medals = {
  1: '🥇',
  2: '🥈',
  3: '🥉'
};

const colors = {
  1: { border: 'border-[#F59E0B]/40', bg: 'bg-[#F59E0B]/5' },
  2: { border: 'border-[#9CA3AF]/40', bg: 'bg-[#9CA3AF]/5' },
  3: { border: 'border-[#B45309]/40', bg: 'bg-[#B45309]/5' }
};

export function PodiumCard({ player, rank, onClick }: PodiumCardProps) {
  const medal = medals[rank];
  const color = colors[rank];
  const formattedPoints = (player.points / 100).toFixed(2);

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 ${color.border} ${color.bg} bg-card flex flex-col items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]`}
    >
      <div className="text-2xl">{medal}</div>
      <PlayerAvatar username={player.username} size="lg" />
      <div className="flex flex-col items-center gap-0.5 min-w-0 w-full">
        <p className="font-semibold truncate max-w-[80px]">{player.username}</p>
        <p className="text-sm text-muted-foreground font-mono">{formattedPoints} pts</p>
      </div>
    </button>
  );
}
