'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RankChart, PointsChart } from '@/components/ProgressionChart';
import { PlayerAvatar } from '@/components/PlayerAvatar';

type Period = '4w' | '3m' | '6m' | 'all';

interface UserStats {
  userId: number;
  username: string;
  bestRank: number | null;
  avgRank: number | null;
  weekCount: number;
  history: Array<{
    year: number;
    isoWeek: number;
    label: string;
    points: number;
    rank: number;
    voteCount: number;
    mvpCount: number;
    isMvp: boolean;
  }>;
  totalMvpStars: number;
}

function StatsContent() {
  const searchParams = useSearchParams();
  const [period, setPeriod] = useState<Period>('all');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const targetUserId = searchParams.get('userId');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setCurrentUserId(d.data.user.id); });
  }, []);

  const load = useCallback(async (uid: string, p: Period) => {
    setLoading(true);
    const res = await fetch(`/api/stats/${uid}?period=${p}`);
    const data = await res.json();
    if (data.ok) setStats(data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentUserId === null) return;
    const uid = targetUserId ?? String(currentUserId);
    load(uid, period);
  }, [targetUserId, currentUserId, period, load]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Aucune donnée disponible.</p>
      </div>
    );
  }

  const rankChartData = stats.history.map((h) => ({
    label: `S${h.isoWeek}`,
    rank: h.rank,
  }));

  const pointsChartData = stats.history.map((h) => ({
    label: `S${h.isoWeek}`,
    points: h.points / 100,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
        <PlayerAvatar username={stats.username} size="lg" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{stats.username}</h2>
          <p className="text-sm text-muted-foreground">{stats.weekCount} semaines</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <div className="text-3xl font-black text-primary tabular-nums">
            {stats.bestRank ?? '—'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Meilleur rang</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <div className="text-3xl font-black text-primary tabular-nums">
            {stats.avgRank != null ? Number(stats.avgRank).toFixed(1) : '—'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Rang moyen</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <div className="text-3xl font-black text-primary tabular-nums">
            {stats.weekCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Sem. jouées</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <div className="text-3xl font-black text-[#F59E0B] tabular-nums flex items-center justify-center gap-1">
            {stats.totalMvpStars} <span className="text-xl">⭐</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Titres MVP</div>
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

      {stats.history.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Pas encore de données pour cette période.</p>
        </div>
      ) : (
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
              {[...stats.history].reverse().map((h, idx) => (
                <div
                  key={`${h.year}-${h.isoWeek}-${idx}`}
                  className="flex items-center justify-between px-4 py-3"
                >
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
                    {h.isMvp && <span title="MVP de la semaine" className="text-[#F59E0B] text-xs">⭐</span>}
                    <span className="text-sm font-bold text-primary w-8 text-right">
                      #{h.rank}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function StatsPage() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-2 space-y-6">
      <h1 className="text-2xl font-bold">Stats</h1>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
        <StatsContent />
      </Suspense>
    </div>
  );
}
