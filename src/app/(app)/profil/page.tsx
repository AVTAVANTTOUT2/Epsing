'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlayerAvatar } from '@/components/PlayerAvatar';

interface UserProfile {
  id: number;
  username: string;
  createdAt: string;
  isActive: boolean;
  bio?: string | null;
  playStyle?: string | null;
  eloRating: number;
}

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Profile fields
  const [bio, setBio] = useState('');
  const [playStyle, setPlayStyle] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setUser(d.data.user);
          setBio(d.data.user.bio || '');
          setPlayStyle(d.data.user.playStyle || '');
        }
      });
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, playStyle }),
      });
      const data = await res.json();
      if (data.ok) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
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

    setPwdLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
      } else {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordDialog(false);
          setSuccess(false);
        }, 2000);
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setPwdLoading(false);
    }
  }

  const joinDate = user
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-2 space-y-6">
        <h1 className="text-2xl font-bold">Profil</h1>

        <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-4">
          {user && <PlayerAvatar username={user.username} size="lg" />}
          <div>
            <h2 className="text-lg font-semibold">{user?.username ?? '…'}</h2>
            <p className="text-sm text-muted-foreground">Membre depuis {joinDate}</p>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="bg-card rounded-xl border border-border p-4 space-y-4">
          <h3 className="font-semibold mb-2">Personnalisation</h3>
          
          <div className="space-y-2">
            <label htmlFor="playStyle" className="text-sm font-medium">Style de jeu</label>
            <input
              id="playStyle"
              type="text"
              value={playStyle}
              onChange={(e) => setPlayStyle(e.target.value)}
              placeholder="Ex: Défensif, Attaquant..."
              className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">Bio / Citation</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Une petite phrase d'accroche..."
              className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-y text-sm"
              maxLength={200}
            />
          </div>

          {profileSuccess && (
            <div className="p-2 bg-success/10 text-success rounded-md text-xs font-medium">
              Profil mis à jour !
            </div>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="w-full py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
          >
            {profileSaving ? 'Sauvegarde...' : 'Sauvegarder le profil'}
          </button>
        </form>

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
                <span className="text-muted-foreground">1re place</span>
                <span className="font-mono font-bold">N pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">2e place</span>
                <span className="font-mono font-bold">N-1 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">…</span>
                <span className="font-mono font-bold">…</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dernière place</span>
                <span className="font-mono font-bold">1 pt</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              Points affichés = moyenne des votes de tous les joueurs pour la semaine.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Application Web Progressive</h3>
                <p className="text-sm text-muted-foreground">
                  Installe Epsing sur ton appareil pour y accéder comme une app native.
                </p>
              </div>
              <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                PWA disponible
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
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
                  autoComplete="current-password"
                  disabled={pwdLoading}
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
                  autoComplete="new-password"
                  disabled={pwdLoading}
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
                  autoComplete="new-password"
                  disabled={pwdLoading}
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
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setError('');
                    setSuccess(false);
                  }}
                  className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                >
                  {pwdLoading ? 'Mise à jour…' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
