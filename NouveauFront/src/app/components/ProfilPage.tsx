import { useState } from 'react';
import { PlayerAvatar } from './PlayerAvatar';

type ProfilPageProps = {
  onLogout: () => void;
};

export function ProfilPage({ onLogout }: ProfilPageProps) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const mockUser = {
    id: 1,
    username: 'Alice',
    createdAt: 'mars 2026'
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setShowPasswordDialog(false);
      setSuccess(false);
    }, 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-2 space-y-6">
        <h1 className="text-2xl font-bold">Profil</h1>

        <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-4">
          <PlayerAvatar username={mockUser.username} size="lg" />
          <div>
            <h2 className="text-lg font-semibold">{mockUser.username}</h2>
            <p className="text-sm text-muted-foreground">
              Membre depuis {mockUser.createdAt}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setShowPasswordDialog(true)}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl hover:bg-accent transition-colors text-left font-medium"
          >
            Changer mon mot de passe
          </button>

          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold mb-3">Barème des points</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">1er place</span>
                <span className="font-mono font-bold">5.00 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">2e place</span>
                <span className="font-mono font-bold">4.00 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">3e place</span>
                <span className="font-mono font-bold">3.00 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">4e place</span>
                <span className="font-mono font-bold">2.00 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">5e place et +</span>
                <span className="font-mono font-bold">1.00 pt</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              Les points affichés sont la moyenne des votes de tous les joueurs pour la semaine.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Application Web Progressive</h3>
                <p className="text-sm text-muted-foreground">
                  Installe Epsing sur ton appareil pour y accéder rapidement comme une app native.
                </p>
              </div>
              <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                PWA disponible
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full px-4 py-3 bg-destructive text-destructive-foreground rounded-xl hover:opacity-90 transition-opacity font-medium"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Changer le mot de passe</h2>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="block text-sm font-medium">
                  Mot de passe actuel
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="block text-sm font-medium">
                  Nouveau mot de passe
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium">
                  Confirmer
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-success/10 text-success px-3 py-2 rounded-lg text-sm font-medium">
                  ✓ Mot de passe mis à jour avec succès
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordDialog(false)}
                  className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
