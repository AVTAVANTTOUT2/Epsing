import { useState } from 'react';
import { PlayerAvatar } from './PlayerAvatar';
import { RankChart, PointsChart } from './ProgressionChart';

const mockUserStats = {
  userId: 1,
  username: 'Alice',
  bestRank: 1,
  avgRank: 1.5,
  weekCount: 8,
  history: [
    { year: 2026, isoWeek: 15, label: 'Sem. 15', points: 285, rank: 2, voteCount: 5 },
    { year: 2026, isoWeek: 16, label: 'Sem. 16', points: 340, rank: 1, voteCount: 5 },
    { year: 2026, isoWeek: 17, label: 'Sem. 17', points: 298, rank: 1, voteCount: 4 },
    { year: 2026, isoWeek: 18, label: 'Sem. 18', points: 320, rank: 1, voteCount: 5 }
  ]
};

export function StatsPage() {
  const [period, setPeriod] = useState<'4w' | '3m' | '6m' | 'all'>('all');

  const rankChartData = mockUserStats.history.map((h, index) => ({
    label: `S${h.isoWeek}`,
    rank: h.rank,
    key: `${h.year}-${h.isoWeek}-${index}`
  }));

  const pointsChartData = mockUserStats.history.map((h, index) => ({
    label: `S${h.isoWeek}`,
    points: h.points / 100,
    key: `${h.year}-${h.isoWeek}-${index}`
  }));

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-2 space-y-6">
        <h1 className="text-2xl font-bold">Stats</h1>

        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <PlayerAvatar username={mockUserStats.username} size="lg" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{mockUserStats.username}</h2>
            <p className="text-sm text-muted-foreground">
              {mockUserStats.weekCount} semaines
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="text-3xl font-black text-primary tabular-nums">
              {mockUserStats.bestRank}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Meilleur rang</div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="text-3xl font-black text-primary tabular-nums">
              {mockUserStats.avgRank.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Rang moyen</div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="text-3xl font-black text-primary tabular-nums">
              {mockUserStats.weekCount}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Sem. jouées</div>
          </div>
        </div>

        <div className="flex gap-2">
          {(['4w', '3m', '6m', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {p === '4w' ? '4 sem.' : p === '3m' ? '3 mois' : p === '6m' ? '6 mois' : 'Tout'}
            </button>
          ))}
        </div>

        {mockUserStats.history.length > 0 ? (
          <>
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-4">Évolution du rang</h3>
              <RankChart data={rankChartData} />
            </div>

            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-4">Points par semaine</h3>
              <PointsChart data={pointsChartData} />
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Historique</h3>
              </div>
              <div className="divide-y divide-border">
                {mockUserStats.history.slice().reverse().map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{h.label}</span>
                      {h.voteCount < 3 && (
                        <span className="bg-warning/10 text-warning px-2 py-0.5 rounded text-xs font-medium">
                          Faible part.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono">{(h.points / 100).toFixed(2)} pts</span>
                      <span className="text-sm font-bold text-primary w-8 text-right">
                        #{h.rank}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}
