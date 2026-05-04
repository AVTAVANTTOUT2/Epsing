import { useState } from 'react';
import { PlayerRow } from './PlayerRow';
import { WeekSelector } from './WeekSelector';

const mockWeekData = {
  week: { label: 'Sem. 18 · 2026', year: 2026, isoWeek: 18 },
  players: [
    { userId: 1, username: 'Alice', points: 785, rank: 1 },
    { userId: 2, username: 'Bob', points: 612, rank: 2 },
    { userId: 3, username: 'Charlie', points: 548, rank: 3 },
    { userId: 4, username: 'Diana', points: 423, rank: 4, delta: 2 },
    { userId: 5, username: 'Ethan', points: 389, rank: 5, delta: -1 }
  ],
  lowParticipation: false
};

const mockMonthData = {
  label: 'Mai 2026',
  weekCount: 4,
  players: [
    { userId: 1, username: 'Alice', points: 3140, rank: 1 },
    { userId: 2, username: 'Bob', points: 2890, rank: 2 },
    { userId: 3, username: 'Charlie', points: 2456, rank: 3 },
    { userId: 4, username: 'Diana', points: 2123, rank: 4 },
    { userId: 5, username: 'Ethan', points: 1998, rank: 5 }
  ]
};

const mockGeneralData = {
  weekCount: 18,
  players: [
    { userId: 1, username: 'Alice', points: 14250, rank: 1 },
    { userId: 2, username: 'Bob', points: 12890, rank: 2 },
    { userId: 3, username: 'Charlie', points: 11456, rank: 3 },
    { userId: 4, username: 'Diana', points: 10123, rank: 4 },
    { userId: 5, username: 'Ethan', points: 9998, rank: 5 }
  ]
};

export function ClassementPage() {
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'general'>('general');

  const renderWeekTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <WeekSelector
          label={mockWeekData.week.label}
          onPrevious={() => {}}
          onNext={() => {}}
          canPrev={true}
          canNext={false}
        />
        {mockWeekData.lowParticipation && (
          <div className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-medium">
            Faible participation
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border p-2 space-y-1">
        {mockWeekData.players.map((player) => (
          <PlayerRow key={player.userId} player={player} />
        ))}
      </div>
    </div>
  );

  const renderMonthTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <WeekSelector
          label={mockMonthData.label}
          onPrevious={() => {}}
          onNext={() => {}}
          canPrev={true}
          canNext={false}
        />
        <div className="text-sm text-muted-foreground">
          {mockMonthData.weekCount} sem.
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-2 space-y-1">
        {mockMonthData.players.map((player) => (
          <PlayerRow key={player.userId} player={{ ...player, points: player.points }} />
        ))}
      </div>
    </div>
  );

  const renderGeneralTab = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        {mockGeneralData.weekCount} semaines comptabilisées
      </p>

      <div className="bg-card rounded-xl border border-border p-2 space-y-1">
        {mockGeneralData.players.map((player) => (
          <PlayerRow key={player.userId} player={{ ...player, points: player.points }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold mb-4">Classement</h1>

        <div className="flex gap-2 mb-6 border-b border-border">
          {(['week', 'month', 'general'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'week' ? 'Semaine' : tab === 'month' ? 'Mois' : 'Général'}
            </button>
          ))}
        </div>

        {activeTab === 'week' && renderWeekTab()}
        {activeTab === 'month' && renderMonthTab()}
        {activeTab === 'general' && renderGeneralTab()}
      </div>
    </div>
  );
}
