'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PodiumCard } from '@/components/PodiumCard';
import { PlayerRow } from '@/components/PlayerRow';
import { WeekSelector } from '@/components/WeekSelector';
import type { RankedPlayer } from '@/types';

interface WeekData {
  week: { id: number; year: number; isoWeek: number; status: string; label: string };
  players: RankedPlayer[];
  lowParticipation: boolean;
  totalVotes?: number;
  isLive?: boolean;
}

function Spinner() {
  return (
    <div className="flex h-32 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function Podium({ players }: { players: RankedPlayer[] }) {
  if (players.length < 3) return null;
  const [p1, p2, p3] = [players[0]!, players[1]!, players[2]!];
  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      <PodiumCard player={p2} rank={2} />
      <PodiumCard player={p1} rank={1} />
      <PodiumCard player={p3} rank={3} />
    </div>
  );
}

/** Live badge + vote count */
function LiveBadge({ totalVotes }: { totalVotes: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 py-0.5 rounded-full text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
        LIVE
      </span>
      <span className="text-xs text-muted-foreground">{totalVotes} vote{totalVotes > 1 ? 's' : ''}</span>
    </div>
  );
}

function WeekTab() {
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number | null>(null);
  const [week, setWeek] = useState<number | null>(null);
  // When the user navigates to a specific past week, we leave live mode
  const [isPastWeek, setIsPastWeek] = useState(false);
  const lastRefreshRef = useRef<Date>(new Date());

  const loadLive = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await fetch('/api/ranking/live');
    const d = await res.json();
    if (d.ok) {
      setData(d.data);
      setYear(d.data.week.year);
      setWeek(d.data.week.isoWeek);
      lastRefreshRef.current = new Date();
    } else {
      if (!silent) setData(null);
    }
    if (!silent) setLoading(false);
  }, []);

  const loadPastWeek = useCallback(async (y: number, w: number) => {
    setLoading(true);
    const res = await fetch(`/api/ranking/week?year=${y}&week=${w}`);
    const d = await res.json();
    if (d.ok) {
      setData({ ...d.data, isLive: false });
      setYear(d.data.week.year);
      setWeek(d.data.week.isoWeek);
    } else {
      setData(null);
    }
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => { loadLive(); }, [loadLive]);

  // Auto-refresh every 30s when the current week is live
  useEffect(() => {
    if (!data?.isLive || isPastWeek) return;
    const id = setInterval(() => loadLive(true), 30_000);
    return () => clearInterval(id);
  }, [data?.isLive, isPastWeek, loadLive]);

  function navWeek(dir: -1 | 1) {
    if (!week || !year) return;
    setIsPastWeek(true);
    let newWeek = week + dir;
    let newYear = year;
    if (newWeek < 1) { newYear--; newWeek = 52; }
    if (newWeek > 52) { newYear++; newWeek = 1; }
    loadPastWeek(newYear, newWeek);
  }

  function backToLive() {
    setIsPastWeek(false);
    loadLive();
  }

  const restPlayers = (data?.players ?? []).slice(3).map((p) => ({
    ...p,
    delta: p.prevRank != null ? p.prevRank - p.rank : undefined,
  }));

  const isLive = data?.isLive && !isPastWeek;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <WeekSelector
          label={data?.week.label ?? '—'}
          onPrevious={() => navWeek(-1)}
          onNext={() => navWeek(1)}
          canNext={isPastWeek}
        />
        <div className="flex items-center gap-2">
          {isLive && <LiveBadge totalVotes={data?.totalVotes ?? 0} />}
          {isPastWeek && (
            <button
              onClick={backToLive}
              className="text-xs text-primary font-medium hover:underline"
            >
              Semaine actuelle →
            </button>
          )}
          {!isLive && data?.lowParticipation && (
            <div className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-medium">
              Faible participation
            </div>
          )}
        </div>
      </div>

      {loading && <Spinner />}

      {!loading && !data && (
        <EmptyState message="Aucun vote pour cette semaine." />
      )}

      {!loading && data && data.players.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground text-sm">
            Aucun vote enregistré pour l&apos;instant.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Les résultats apparaissent dès le premier vote.
          </p>
        </div>
      )}

      {!loading && data && data.players.length > 0 && (
        <>
          <Podium players={data.players} />
          {restPlayers.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-2 space-y-1">
              {restPlayers.map((p) => (
                <PlayerRow key={p.userId} player={p} />
              ))}
            </div>
          )}
          {isLive && (
            <p className="text-[10px] text-center text-muted-foreground">
              Mis à jour toutes les 30 secondes · Résultats provisoires
            </p>
          )}
        </>
      )}
    </div>
  );
}

function MonthTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<{
    label: string;
    players: RankedPlayer[];
    weekCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const res = await fetch(`/api/ranking/month?year=${y}&month=${m}`);
    const d = await res.json();
    setData(d.ok ? d.data : null);
    setLoading(false);
  }, []);

  useEffect(() => { load(year, month); }, [load, year, month]);

  function navMonth(dir: -1 | 1) {
    let m = month + dir;
    let y = year;
    if (m < 1) { y--; m = 12; }
    if (m > 12) { y++; m = 1; }
    setYear(y);
    setMonth(m);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const topPlayers = (data?.players ?? []).slice(0, 3);
  const restPlayers = (data?.players ?? []).slice(3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <WeekSelector
          label={data?.label ?? '—'}
          onPrevious={() => navMonth(-1)}
          onNext={() => navMonth(1)}
          canNext={!isCurrentMonth}
        />
        {data && (
          <span className="text-sm text-muted-foreground">{data.weekCount} sem.</span>
        )}
      </div>
      {loading && <Spinner />}
      {!loading && (!data || data.players.length === 0) && (
        <EmptyState message="Aucun résultat pour ce mois." />
      )}
      {!loading && data && data.players.length > 0 && (
        <>
          {topPlayers.length >= 3 && <Podium players={topPlayers} />}
          {restPlayers.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-2 space-y-1">
              {restPlayers.map((p) => (
                <PlayerRow key={p.userId} player={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GeneralTab() {
  const [data, setData] = useState<{ players: RankedPlayer[]; totalWeeks: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ranking/general')
      .then((r) => r.json())
      .then((d) => setData(d.ok ? d.data : null))
      .finally(() => setLoading(false));
  }, []);

  const topPlayers = (data?.players ?? []).slice(0, 3);
  const restPlayers = (data?.players ?? []).slice(3);

  return (
    <div className="space-y-4">
      {data && (
        <p className="text-sm text-muted-foreground text-center">
          {data.totalWeeks} semaines comptabilisées
        </p>
      )}
      {loading && <Spinner />}
      {!loading && (!data || data.players.length === 0) && (
        <EmptyState message="Aucun résultat disponible." />
      )}
      {!loading && data && data.players.length > 0 && (
        <>
          {topPlayers.length >= 3 && <Podium players={topPlayers} />}
          {restPlayers.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-2 space-y-1">
              {restPlayers.map((p) => (
                <PlayerRow key={p.userId} player={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

type Tab = 'week' | 'month' | 'general';

export default function ClassementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('week');

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-2">
      <h1 className="text-2xl font-bold mb-4">Classement</h1>

      <div className="flex gap-2 mb-6 border-b border-border">
        {(['week', 'month', 'general'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'week' ? 'Semaine' : tab === 'month' ? 'Mois' : 'Général'}
          </button>
        ))}
      </div>

      {activeTab === 'week' && <WeekTab />}
      {activeTab === 'month' && <MonthTab />}
      {activeTab === 'general' && <GeneralTab />}
    </div>
  );
}
