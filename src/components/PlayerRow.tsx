import { ArrowUp, ArrowDown } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

interface PlayerRowProps {
  player: {
    userId: number;
    username: string;
    points: number;
    rank: number;
    delta?: number;
  };
  onClick?: () => void;
}

export function PlayerRow({ player, onClick }: PlayerRowProps) {
  const formattedPoints = (player.points / 100).toFixed(2);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 min-h-[44px] hover:bg-accent transition-colors rounded-lg"
    >
      <div className="w-6 text-center font-bold text-muted-foreground">{player.rank}</div>

      <PlayerAvatar username={player.username} size="sm" />

      <div className="flex-1 text-left truncate font-medium">{player.username}</div>

      {player.delta !== undefined && player.delta !== 0 && (
        <div
          className={`flex items-center gap-0.5 text-xs font-medium ${
            player.delta > 0 ? 'text-success' : 'text-destructive'
          }`}
        >
          {player.delta > 0 ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )}
          <span>{Math.abs(player.delta)}</span>
        </div>
      )}

      <div className="text-sm font-mono font-bold tabular-nums">{formattedPoints}</div>
    </button>
  );
}
