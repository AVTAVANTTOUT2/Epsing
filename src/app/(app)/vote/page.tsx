'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RankingDnd } from '@/components/RankingDnd';
import type { Week, User } from '@/types';

interface VoteStatus {
  week: Week;
  hasVoted: boolean;
  ballot: Array<{ userId: number; position: number }> | null;
  mvpUserId: number | null;
}

function useCountdown(target: string): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    function update() {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) {
        setLabel('maintenant');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(
        [d > 0 && `${d}j`, h > 0 && `${h}h`, m > 0 && `${m}m`, `${s}s`]
          .filter(Boolean)
          .join(' ')
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);

  return label;
}

function CountdownDisplay({ target }: { target: string }) {
  const label = useCountdown(target);
  return (
    <div className="flex flex-col items-center gap-2 py-8">
      <p className="text-sm text-muted-foreground">Le vote ouvre dans</p>
      <div className="text-5xl font-black tabular-nums text-primary">{label}</div>
      <p className="text-xs text-muted-foreground">Lundi 7h00 (heure de Paris)</p>
    </div>
  );
}

export default function VotePage() {
  const [status, setStatus] = useState<VoteStatus | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orderedIds, setOrderedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mvpUserId, setMvpUserId] = useState<number | null>(null);
  const onChangeRef = useRef<(ids: number[]) => void>(() => {});

  const handleOrderChange = useCallback((ids: number[]) => {
    setOrderedIds(ids);
  }, []);

  onChangeRef.current = handleOrderChange;

  useEffect(() => {
    async function load() {
      try {
        const [statusRes, usersRes, meRes] = await Promise.all([
          fetch('/api/vote/current'),
          fetch('/api/users'),
          fetch('/api/auth/me'),
        ]);
        const [statusData, usersData, meData] = await Promise.all([
          statusRes.json(),
          usersRes.json(),
          meRes.json(),
        ]);
        if (statusData.ok) {
          setStatus(statusData.data);
          if (statusData.data.mvpUserId) {
            setMvpUserId(statusData.data.mvpUserId);
          }
        }
        if (usersData.ok && meData.ok) {
          const currentUserId = meData.data.user.id;
          const allUsers: User[] = usersData.data.users.filter((u: User) => u.id !== currentUserId);
          setUsers(allUsers);
          if (statusData.ok && statusData.data.ballot) {
            const ballot: Array<{ userId: number; position: number }> = statusData.data.ballot;
            const sorted = [...ballot].sort((a, b) => a.position - b.position);
            setOrderedIds(sorted.map((b) => b.userId));
          } else {
            setOrderedIds(allUsers.map((u) => u.id));
          }
        }
      } catch {
        setError('Erreur lors du chargement.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit() {
    if (!status || !orderedIds.length) return;
    setSubmitting(true);
    setError('');
    try {
      const rankings = orderedIds.map((userId, i) => ({ userId, position: i + 1 }));
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId: status.week.id, rankings, mvpUserId }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
      } else {
        setSuccess(true);
        setStatus((prev) => (prev ? { ...prev, hasVoted: true } : prev));
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError('Erreur réseau, veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-2">
        <div className="space-y-1 mb-4">
          <h1 className="text-2xl font-bold">Vote</h1>
          {status && (
            <p className="text-sm text-muted-foreground">
              Semaine {status.week.isoWeek} · {status.week.year}
            </p>
          )}
        </div>

        {status?.week.status === 'upcoming' && (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Vote pas encore ouvert</h2>
            <CountdownDisplay target={status.week.votingOpensAt} />
          </div>
        )}

        {status?.week.status === 'closed' && (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-base font-medium">Le vote est fermé</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Le classement sera publié dès la clôture du décompte.
            </p>
          </div>
        )}

        {status?.week.status === 'open' && users.length > 0 && (
          <div className="space-y-4">
            {status.hasVoted && !success && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
                <p className="text-sm text-primary font-medium">Modifiable</p>
                <p className="text-xs text-primary/80">
                  Tu peux modifier ton vote jusqu&apos;à vendredi 20h
                </p>
              </div>
            )}

            {success && (
              <div className="bg-success/10 rounded-lg px-3 py-2">
                <p className="text-sm text-success font-medium">
                  ✓ Ton classement a été enregistré avec succès
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Glisse les joueurs pour établir ton classement.
            </p>

            <RankingDnd
              players={users.map((u) => ({ id: u.id, username: u.username }))}
              initialOrder={orderedIds}
              onChange={handleOrderChange}
              mvpUserId={mvpUserId}
              onMvpChange={setMvpUserId}
            />

            {error && (
              <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {!status && !loading && (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">Aucune semaine active.</p>
          </div>
        )}
      </div>

      {status?.week.status === 'open' && users.length > 0 && (
        <div
          className="fixed left-0 right-0 md:static md:max-w-lg md:mx-auto p-4 md:p-0 md:pb-6 md:px-4"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 3.5rem)' }}
        >
          <button
            onClick={handleSubmit}
            disabled={submitting || orderedIds.length !== users.length}
            className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-lg md:shadow-none"
          >
            {submitting
              ? 'Envoi…'
              : status.hasVoted
              ? 'Mettre à jour mon vote'
              : 'Soumettre mon classement'}
          </button>
        </div>
      )}
    </div>
  );
}
