import { useState } from 'react';
import { RankingDnd } from './RankingDnd';

const mockPlayers = [
  { id: 1, username: 'Alice' },
  { id: 2, username: 'Bob' },
  { id: 3, username: 'Charlie' },
  { id: 4, username: 'Diana' },
  { id: 5, username: 'Ethan' }
];

export function VotePage() {
  const [orderedIds, setOrderedIds] = useState<number[]>(mockPlayers.map((p) => p.id));
  const [hasVoted, setHasVoted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    setHasVoted(true);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const isComplete = orderedIds.length === mockPlayers.length;

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-2">
        <div className="space-y-1 mb-4">
          <h1 className="text-2xl font-bold">Vote</h1>
          <p className="text-sm text-muted-foreground">Semaine 18 · 2026</p>
        </div>

        {hasVoted && (
          <div className="mb-4 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
            <p className="text-sm text-primary font-medium">Modifiable</p>
            <p className="text-xs text-primary/80">
              Tu peux modifier ton vote jusqu'à dimanche 23:59
            </p>
          </div>
        )}

        {showSuccess && (
          <div className="mb-4 bg-success/10 rounded-lg px-3 py-2">
            <p className="text-sm text-success font-medium">
              ✓ Ton classement a été enregistré avec succès
            </p>
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          Glisse les joueurs pour établir ton classement.
        </p>

        <RankingDnd players={mockPlayers} onChange={setOrderedIds} />

        <div
          className="fixed left-0 right-0 md:static md:mt-6 p-4 md:p-0"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)'
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={!isComplete}
            className="w-full max-w-lg mx-auto block py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-lg md:shadow-none"
          >
            {hasVoted ? 'Mettre à jour mon vote' : 'Soumettre mon classement'}
          </button>
        </div>
      </div>
    </div>
  );
}
