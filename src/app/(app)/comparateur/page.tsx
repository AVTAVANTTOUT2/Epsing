'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { PlayerAvatar } from '@/components/PlayerAvatar';

export default function ComparateurPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [p1, setP1] = useState<string>('');
  const [p2, setP2] = useState<string>('');
  
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(d => {
        if (d.ok) setUsers(d.data.users);
      })
      .finally(() => setLoadingUsers(false));
  }, []);

  useEffect(() => {
    if (p1 && p2 && p1 !== p2) {
      setLoadingData(true);
      fetch(`/api/stats/compare?p1=${p1}&p2=${p2}`)
        .then(r => r.json())
        .then(d => {
          if (d.ok) setData(d.data);
        })
        .finally(() => setLoadingData(false));
    } else {
      setData(null);
    }
  }, [p1, p2]);

  if (loadingUsers) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-6 space-y-8">
      <h1 className="text-2xl font-bold text-primary">Comparateur Face-à-Face</h1>

      <div className="bg-card rounded-xl border border-border p-6 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-end">
        <div>
          <label className="block text-sm font-medium mb-2">Joueur 1</label>
          <select
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sélectionnez un joueur</option>
            {Array.isArray(users) && users.map(u => (
              <option key={u.id} value={u.id} disabled={u.id.toString() === p2}>{u.username}</option>
            ))}
          </select>
        </div>
        
        <div className="hidden md:flex font-bold text-2xl text-muted-foreground pb-2">VS</div>

        <div>
          <label className="block text-sm font-medium mb-2">Joueur 2</label>
          <select
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sélectionnez un joueur</option>
            {Array.isArray(users) && users.map(u => (
              <option key={u.id} value={u.id} disabled={u.id.toString() === p1}>{u.username}</option>
            ))}
          </select>
        </div>
      </div>

      {loadingData && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {data && !loadingData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Colonne Joueur 1 */}
            <div className={`bg-card rounded-xl border border-border p-6 flex flex-col items-center text-center gap-2 ${data.headToHead.wins1 > data.headToHead.wins2 ? 'ring-2 ring-primary' : ''}`}>
              <PlayerAvatar username={data.user1.username} size="lg" />
              <h2 className="text-xl font-bold">{data.user1.username}</h2>
              {data.user1.bio && <p className="text-sm italic text-muted-foreground">"{data.user1.bio}"</p>}
              <div className="text-xs font-semibold px-2 py-1 bg-secondary rounded text-secondary-foreground mt-1">
                {data.user1.play_style || 'Style inconnu'}
              </div>
            </div>

            {/* Colonne Joueur 2 */}
            <div className={`bg-card rounded-xl border border-border p-6 flex flex-col items-center text-center gap-2 ${data.headToHead.wins2 > data.headToHead.wins1 ? 'ring-2 ring-primary' : ''}`}>
              <PlayerAvatar username={data.user2.username} size="lg" />
              <h2 className="text-xl font-bold">{data.user2.username}</h2>
              {data.user2.bio && <p className="text-sm italic text-muted-foreground">"{data.user2.bio}"</p>}
              <div className="text-xs font-semibold px-2 py-1 bg-secondary rounded text-secondary-foreground mt-1">
                {data.user2.play_style || 'Style inconnu'}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-center mb-6 text-lg">Comparaison Statistique</h3>
            
            <div className="space-y-6">
              <StatRow label="Titres MVP" val1={data.user1.total_mvp} val2={data.user2.total_mvp} />
              <StatRow label="Victoires directes" val1={data.headToHead.wins1} val2={data.headToHead.wins2} />
              <StatRow label="Points marqués (1v1)" val1={data.headToHead.totalPoints1} val2={data.headToHead.totalPoints2} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, val1, val2 }: { label: string; val1: number; val2: number }) {
  const isV1Winner = val1 > val2;
  const isV2Winner = val2 > val1;
  const isEqual = val1 === val2;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={`font-bold ${isV1Winner ? 'text-primary' : 'text-muted-foreground'}`}>{val1}</span>
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className={`font-bold ${isV2Winner ? 'text-primary' : 'text-muted-foreground'}`}>{val2}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        {isEqual && val1 === 0 ? (
          <div className="w-full bg-border" />
        ) : isEqual ? (
          <>
            <div className="w-1/2 bg-primary/50" />
            <div className="w-1/2 bg-primary/50" />
          </>
        ) : (
          <>
            <div 
              className="bg-primary transition-all duration-500" 
              style={{ width: `${(val1 / (val1 + val2)) * 100}%` }}
            />
            <div 
              className="bg-primary opacity-30 transition-all duration-500" 
              style={{ width: `${(val2 / (val1 + val2)) * 100}%` }}
            />
          </>
        )}
      </div>
    </div>
  );
}
