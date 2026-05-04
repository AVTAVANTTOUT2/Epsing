# Epsing — Classement hebdomadaire EPSI

Application web PWA pour voter chaque semaine sur un classement de joueurs au sein d'une promo EPSI.

---

## Stack technique

| Couche | Choix |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript strict |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Base de données | SQLite via `better-sqlite3` |
| Authentification | JWT custom (HS256) via `jose`, cookie httpOnly |
| Hash mots de passe | `bcryptjs` (12 rounds) |
| Validation | Zod v4 |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Graphiques | Recharts |
| Dates/timezone | `date-fns` + `date-fns-tz` (Europe/Paris) |
| PWA | `@ducanh2912/next-pwa` |
| Cron interne | `setInterval` 15 min, lancé via `instrumentation.ts` |
| Tests | Vitest |

---

## Installation

```bash
git clone <repo>
cd epsing

cp .env.example .env.local
# Éditez .env.local : remplissez JWT_SECRET et EPSI_REGISTRATION_CODE

npm install
npm run dev
```

L'app est disponible sur `http://localhost:3000`.

---

## Variables d'environnement

Fichier `.env.local` (basé sur `.env.example`) :

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_PATH` | Chemin vers le fichier SQLite | `./data/epsing.db` |
| `JWT_SECRET` | Secret JWT (min 32 caractères, idéalement 64+) | `abc123...` |
| `EPSI_REGISTRATION_CODE` | Code d'invitation partagé entre camarades | `EPSI-2025-PROMO-XYZ` |
| `NEXT_PUBLIC_APP_NAME` | Nom affiché | `Epsing` |
| `NODE_ENV` | Environnement (`development`/`production`) | `development` |

---

## Schéma BDD

```sql
-- Utilisateurs
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_active INTEGER NOT NULL DEFAULT 1
);

-- Semaines de vote
CREATE TABLE weeks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  iso_week INTEGER NOT NULL,
  voting_opens_at TEXT NOT NULL,   -- vendredi 00:00 Paris (UTC ISO)
  voting_closes_at TEXT NOT NULL,  -- dimanche 23:59:59 Paris (UTC ISO)
  status TEXT NOT NULL CHECK(status IN ('upcoming','open','closed','tallied')),
  tallied_at TEXT,
  UNIQUE(year, iso_week)
);

-- Bulletins de vote (1 par user/semaine)
CREATE TABLE votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_id INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, week_id)
);

-- Positions données dans un bulletin
CREATE TABLE vote_rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vote_id INTEGER NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  ranked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK(position > 0),
  UNIQUE(vote_id, ranked_user_id),
  UNIQUE(vote_id, position)
);

-- Scores agrégés après clôture
CREATE TABLE weekly_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_id INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,    -- moyenne × 100 (ex : 785 = 7.85 pts)
  rank INTEGER NOT NULL,
  vote_count INTEGER NOT NULL,
  UNIQUE(week_id, user_id)
);
```

---

## Algorithme de scoring

Soit **N** = nombre de joueurs actifs, **V** = nombre de votants valides.

**Points par bulletin** : le joueur à la position `p` reçoit `N + 1 - p` points.

**Score hebdo** = `SUM(points_reçus) / V`, multiplié par 100 et stocké en entier
(ex : moyenne 7.85 → `points = 785`).

**Tri final** (décroissant) :
1. Points moyens (descendant)
2. Nombre de fois dans le top 3 (descendant) — tie-break
3. Id utilisateur (ascendant) — tie-break final

**Classement général** = `SUM(weekly_scores.points)` sur toutes les semaines.

---

## Commandes

```bash
# Développement
npm run dev           # Serveur dev sur :3000

# Tests
npm run test          # Vitest (tests scoring)
npm run test:watch    # Mode watch

# Build
npm run build         # Build Next.js production
npm start             # Serveur production

# Outils dev (simulation du cycle de vote)
npm run dev:open-week   # Force l'ouverture du vote pour la semaine courante
npm run dev:close-week  # Clôture et calcule le classement de la semaine ouverte

# Vérification TypeScript
npm run lint          # tsc --noEmit
```

---

## Déploiement

### Option 1 — Vercel

```bash
vercel deploy
```

Ajoutez les variables d'environnement dans le dashboard Vercel.

> Note : SQLite n'est pas persistant sur Vercel sans volume. Préférez un VPS pour la prod.

### Option 2 — VPS avec Docker

```bash
docker build -t epsing .
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e JWT_SECRET=votre_secret_64_chars \
  -e EPSI_REGISTRATION_CODE=EPSI-2025-PROMO-XYZ \
  -e DATABASE_PATH=/app/data/epsing.db \
  epsing
```

Le fichier SQLite est persisté dans le volume `./data/`.

---

## Icônes PWA

Les icônes sont générées automatiquement via un script Canvas :

```bash
npm install -D canvas    # si pas encore installé
npx tsx scripts/generate-icons.ts
```

Pour des icônes personnalisées, remplacez les fichiers dans `public/icons/` :
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px
- `maskable-512.png` — 512×512px (safe zone intérieure 80%)
- `apple-touch-icon.png` — 180×180px

---

## Architecture PWA

- **Mode standalone** sur iOS (Safari) et Android (Chrome)
- **Service Worker** via next-pwa : NetworkFirst pour les API, CacheFirst pour les assets
- **Offline** : page `/offline` avec message, classement servi depuis le cache
- **Install prompt** : bannière automatique Android/Desktop, instructions manuelles iOS

---

## Journal d'execution

### 2026-05-04

- Verification de l'environnement local dans `/Applications/MAMP/htdocs/epsing`.
- `npm run dev` lance avec succes sur `http://localhost:3000` (env charge: `.env.local`).
- `npm run test` execute 9 tests Vitest, tous verts.
- `npm run build` termine sans warning ni erreur.
