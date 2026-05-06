'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { PlayerAvatar } from '@/components/PlayerAvatar';

interface Match {
  id: number;
  score1: number;
  score2: number;
  elo_change1: number;
  elo_change2: number;
  played_at: string;
  p1_username: string;
  p1_id: number;
  p2_username: string;
  p2_id: number;
}

export default function MatchsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<User | null>(null);

  const [opponentId, setOpponentId] = useState<string>('');
  const [myScore, setMyScore] = useState<string>('');
  const [opponentScore, setOpponentScore] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/matches').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json())
    ]).then(([usersRes, matchesRes, meRes]) => {
      if (usersRes.ok) setUsers(usersRes.data.users);
      if (matchesRes.ok) setMatches(matchesRes.data);
      if (meRes.ok) setMe(meRes.data.user);
    }).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!opponentId) {
      setError("Veuillez sélectionner un adversaire.");
      return;
    }
    const score1 = parseInt(myScore, 10);
    const score2 = parseInt(opponentScore, 10);

    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
      setError("Scores invalides.");
      return;
    }
    if (score1 === score2) {
      setError("Il ne peut pas y avoir de match nul.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponentId: parseInt(opponentId, 10),
          myScore: score1,
          opponentScore: score2
        })
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
      } else {
        setSuccess("Match enregistré avec succès !");
        setOpponentId('');
        setMyScore('');
        setOpponentScore('');
        
        // Refresh matches and me to get new Elo
        const newMatches = await fetch('/api/matches').then(r => r.json());
        if (newMatches.ok) setMatches(newMatches.data);
        
        const newMe = await fetch('/api/auth/me').then(r => r.json());
        if (newMe.ok) setMe(newMe.data.user);
        
        const newUsers = await fetch('/api/users').then(r => r.json());
        if (newUsers.ok) setUsers(newUsers.data.users);

        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Remove Elo leaderboard logic
  const eligibleOpponents = Array.isArray(users) ? users.filter(u => u.id !== me?.id && u.isActive) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-6 space-y-8">
      <h1 className="text-2xl font-bold text-primary">Matchs 1vs1</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Formulaire de match */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Saisir un Résultat</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Adversaire</label>
              <select
                value={opponentId}
                onChange={(e) => setOpponentId(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sélectionnez un adversaire</option>
                {eligibleOpponents.map(u => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-primary">Mon Score</label>
                <input
                  type="number"
                  min="0"
                  value={myScore}
                  onChange={(e) => setMyScore(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-center font-bold text-lg"
                  placeholder="0"
                />
              </div>
              <span className="text-2xl font-bold text-muted-foreground mt-6">-</span>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-destructive">Score Adv.</label>
                <input
                  type="number"
                  min="0"
                  value={opponentScore}
                  onChange={(e) => setOpponentScore(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-center font-bold text-lg"
                  placeholder="0"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-success/10 text-success rounded-md text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Valider le Match'}
            </button>
          </form>
        </div>
      </div>

      {/* Historique */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Historique des Matchs</h2>
        
        {(!Array.isArray(matches) || matches.length === 0) ? (
          <p className="text-muted-foreground text-center py-4">Aucun match joué pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {matches.map(m => {
              const amIP1 = m.p1_id === me?.id;
              const amIP2 = m.p2_id === me?.id;
              
              const p1Won = m.score1 > m.score2;
              
              return (
                <div key={m.id} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-background border border-border gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto flex-1 justify-center sm:justify-end">
                    <span className={`font-semibold ${p1Won ? 'text-success' : ''} ${amIP1 ? 'text-primary' : ''}`}>{m.p1_username}</span>
                    <PlayerAvatar username={m.p1_username} size="sm" />
                  </div>
                  
                  <div className="flex items-center gap-3 font-mono font-bold text-xl px-4 shrink-0">
                    <span className={p1Won ? 'text-success' : 'text-muted-foreground'}>{m.score1}</span>
                    <span className="text-muted-foreground text-sm">-</span>
                    <span className={!p1Won ? 'text-success' : 'text-muted-foreground'}>{m.score2}</span>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto flex-1 justify-center sm:justify-start">
                    <PlayerAvatar username={m.p2_username} size="sm" />
                    <span className={`font-semibold ${!p1Won ? 'text-success' : ''} ${amIP2 ? 'text-primary' : ''}`}>{m.p2_username}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
