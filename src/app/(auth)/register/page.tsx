'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [epsiCode, setEpsiCode] = useState('');
  const [showEpsiCode, setShowEpsiCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (username.length < 3 || username.length > 20) {
      setError('Le pseudo doit contenir entre 3 et 20 caractères');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Le pseudo ne peut contenir que des lettres, chiffres, - et _');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, epsiCode }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
      } else {
        router.push('/vote');
        router.refresh();
      }
    } catch {
      setError('Erreur réseau, veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-[40px] font-black text-primary leading-none">Epsing</h1>
            <h2 className="text-xl font-semibold">Créer un compte</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium">
                Pseudo
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="ton_pseudo"
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                3-20 caractères, lettres, chiffres, - et _ uniquement
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="epsiCode" className="block text-sm font-medium">
                Code EPSI
              </label>
              <div className="relative">
                <input
                  id="epsiCode"
                  type={showEpsiCode ? 'text' : 'password'}
                  value={epsiCode}
                  onChange={(e) => setEpsiCode(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Code d'invitation"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowEpsiCode(!showEpsiCode)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showEpsiCode ? 'Masquer le code' : 'Afficher le code'}
                >
                  {showEpsiCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Déjà un compte ? </span>
            <a href="/login" className="text-primary font-medium hover:underline">
              Se connecter
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
