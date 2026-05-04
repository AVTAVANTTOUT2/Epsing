## 1. Contexte produit

**Epsing** est une PWA mobile-first pour un groupe de camarades de promo (EPSI).  
Chaque semaine, les membres soumettent un **classement drag-and-drop** de tous les joueurs.  
À la clôture du vote (lundi), un algorithme calcule le **classement officiel**.

Nombre d'utilisateurs : 5–20 personnes.  
Usage principal : smartphone (Safari iOS + Chrome Android).  
Design reference : Apple Sport app, Strava, Letterboxd.  
**Aucun emoji dans l'UI** sauf podium (médailles).

---

## 2. Stack technique (ne pas dévier)

| Élément | Valeur |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript strict |
| Styling | **Tailwind CSS v4** (utility classes uniquement, pas de CSS inline) |
| Composants | **shadcn/ui** (Button, Card, Input, Dialog, Tabs, Badge, Separator) |
| Icônes | **lucide-react** uniquement |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Charts | **Recharts** |
| Font | **Inter** (variable, auto via `next/font/google`) |
| Dark mode | Classe `.dark` sur `<html>` — **dark par défaut** |

**Règle absolue** : toutes les classes sont des classes Tailwind v4.  
Pas de style inline, pas de modules CSS, pas de styled-components.

---

## 3. Design tokens (à importer dans Figma)

### 3.1 Palette — Mode sombre (défaut)

| Token Figma | Valeur HEX | Usage |
|---|---|---|
| `background` | `#191919` | Fond principal |
| `foreground` | `#F2F2F2` | Texte principal |
| `card` | `#262626` | Surfaces cards |
| `card-foreground` | `#F2F2F2` | Texte sur card |
| `primary` | `#8B5CF6` | Violet EPSI — CTA, actif, accent |
| `primary-foreground` | `#191919` | Texte sur primary |
| `secondary` | `#333333` | Fonds secondaires |
| `secondary-foreground` | `#F2F2F2` | Texte sur secondary |
| `muted` | `#333333` | Zones atténuées |
| `muted-foreground` | `#999999` | Labels, meta, subtitles |
| `border` | `rgba(255,255,255,0.10)` | Bordures |
| `input` | `rgba(255,255,255,0.12)` | Fond des inputs |
| `destructive` | `#EF4444` | Erreurs, suppression |
| `ring` | `#8B5CF6` | Focus ring |

### 3.2 Palette — Mode clair (secondaire)

| Token Figma | Valeur HEX |
|---|---|
| `background` | `#F9F9F9` |
| `foreground` | `#1F1F1F` |
| `card` | `#FFFFFF` |
| `primary` | `#6B3FA0` |
| `muted-foreground` | `#808080` |
| `border` | `#E5E5E5` |

### 3.3 Couleurs spéciales

| Token | HEX | Usage |
|---|---|---|
| `gold` | `#F59E0B` | 1er du podium, rang 1 |
| `silver` | `#9CA3AF` | 2e du podium |
| `bronze` | `#B45309` | 3e du podium |
| `success` | `#22C55E` | Progression positive, vote soumis |
| `warning` | `#F59E0B` | Faible participation |

### 3.4 Typographie

| Role | Font | Weight | Size | Line-height |
|---|---|---|---|---|
| Display (logo) | Inter | 900 (Black) | 32px | 1 |
| H1 page title | Inter | 700 (Bold) | 24px | 1.3 |
| H2 section | Inter | 600 (SemiBold) | 18px | 1.4 |
| H3 card title | Inter | 600 | 14px | 1.4 |
| Body | Inter | 400 (Regular) | 14px | 1.5 |
| Body medium | Inter | 500 | 14px | 1.5 |
| Body small | Inter | 400 | 12px | 1.5 |
| Label | Inter | 500 | 12px | 1 |
| Stat number | Inter | 900 | 32px | 1 |
| Tabular | Inter | 700 | 14px | 1 — `font-variant-numeric: tabular-nums` |

### 3.5 Radius

| Token | Valeur |
|---|---|
| `sm` | 4px |
| `md` | 8px |
| `base` | 12px |
| `lg` | 14px |
| `xl` | 18px |
| `2xl` | 24px |
| `full` | 9999px |

### 3.6 Spacing

Base 4px. Utiliser multiples : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

### 3.7 Shadows (dark mode)

```
card-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)
elevated-shadow: 0 4px 16px rgba(0,0,0,0.5)
```

---

## 4. Layout global

### Mobile (< 768px) — priorité absolue

```
┌─────────────────────────┐
│ Page header (h1 + meta) │  px-4, pt-6, pb-2
│                         │
│ Page content            │  px-4, flex-1, overflow-y-auto
│                         │
│                         │
│ ─────────────────────── │
│ Bottom Nav (56px fixed) │  safe-area-inset-bottom
└─────────────────────────┘
```

- Viewport : `width=device-width, initial-scale=1, viewport-fit=cover`
- Le contenu a un padding-bottom pour ne pas être masqué par la Bottom Nav
- `max-w-lg mx-auto` sur tous les contenus de page

### Desktop (≥ 768px)

```
┌──────────┬────────────────────────────┐
│          │ Page header               │
│ Sidebar  │                           │
│  (256px) │ Page content              │
│          │                           │
└──────────┴────────────────────────────┘
```

- Sidebar fixe à gauche, contenu scrollable à droite
- Pas de Bottom Nav sur desktop

---

## 5. Composants à designer

### 5.1 Bottom Navigation

**Fichier** : `src/components/BottomNav.tsx`

4 onglets fixes :

| Tab | Icône lucide | Route |
|---|---|---|
| Vote | `Vote` | `/vote` |
| Classement | `Trophy` | `/classement` |
| Stats | `LineChart` | `/stats` |
| Profil | `User` | `/profil` |

États :
- **Default** : icône `muted-foreground`, label 10px
- **Active** : icône + label `primary`, barre 2px en bas de la largeur de l'icône
- Touch target : 56px minimum hauteur

```
bg: background/95 + backdrop-blur-sm
border-top: 1px solid border
padding-bottom: env(safe-area-inset-bottom)
```

### 5.2 Sidebar Desktop

Même items que Bottom Nav, affichage vertical.  
Logo "Epsing" en haut (font-black, primary).  
Item actif : `bg-primary/10 text-primary rounded-lg`.

### 5.3 PlayerAvatar

**Fichier** : `src/components/PlayerAvatar.tsx`  
**Props** : `username: string`, `size: 'sm'|'md'|'lg'`

Cercle plein avec 2 initiales du username. La couleur de fond est déterminée de façon **déterministe** par le hash du username (palette de 10 couleurs). Texte blanc.

| Size | Diamètre | Font size |
|---|---|---|
| `sm` | 28px | 11px |
| `md` | 36px | 13px |
| `lg` | 48px | 16px |

### 5.4 PodiumCard

**Fichier** : `src/components/PodiumCard.tsx`  
**Props** : `player: { userId, username, points, rank }`, `rank: 1|2|3`

Card cliquable (→ `/stats?userId=X`).

| Rang | Médaille | Bordure accent | Fond teinté |
|---|---|---|---|
| 1 | 🥇 | `gold/40` | `gold/5` |
| 2 | 🥈 | `silver/40` | `silver/5` |
| 3 | 🥉 | `bronze/40` | `bronze/5` |

Contenu : médaille + avatar (lg) + username (tronqué 80px) + points formatés `X.XX pts`.  
Hover : `scale(1.02)` transition.

### 5.5 PlayerRow (liste rangée 4+)

Ligne dans une card scrollable pour les joueurs hors podium.

```
[rank#] [Avatar sm] [Username flex-1] [badge delta ↑/↓] [pts tabular]
```

- `rank` : 24px wide, bold, muted-foreground
- delta ↑ : text-success, ↓ : text-destructive
- Touch target : 44px min hauteur
- Hover : `bg-accent`
- Cliquable → `/stats?userId=X`

### 5.6 RankingDnd (drag & drop)

**Fichier** : `src/components/RankingDnd.tsx`

Liste de cartes réorganisables.  
Chaque carte :

```
[rank# badge] [Avatar md] [Username flex-1] [GripVertical handle]
```

- Hauteur min : **56px**
- Handle à droite (icône `GripVertical`, 18px, muted-foreground)
- État dragging : `opacity-80 scale-[1.02] shadow-lg z-50`
- Top 3 : numéro coloré (gold/silver/bronze), autres : muted
- Activation : PointerSensor distance 8px, TouchSensor delay 200ms
- `border border-border rounded-xl bg-card`

### 5.7 WeekSelector

**Fichier** : `src/components/WeekSelector.tsx`

```
[< ChevronLeft] [Label centré 140px min] [ChevronRight >]
```

Boutons ghost 32px. Label : `Sem. 18 · 2026` ou `Mai 2026`.  
Disabled state sur `canPrev`/`canNext`.

### 5.8 Charts (Recharts)

**Fichier** : `src/components/ProgressionChart.tsx`

#### RankChart (LineChart)

- Axe Y **inversé** (1 en haut, N en bas)
- Ligne violette primary (`#8B5CF6`), dots ronds
- Grille subtile `rgba(255,255,255,0.08)`
- Tooltip dark glass : `bg #262626, border rgba(255,255,255,0.15), radius 8px`
- Format tooltip : `Rang X`
- Hauteur : 200px
- XAxis : labels des semaines (font 10px muted)

#### PointsChart (BarChart)

- Barres violettes, `radius [4,4,0,0]`
- Pas de grille verticale
- Tooltip : `X.XX pts moy.`
- Hauteur : 160px

### 5.9 InstallPwaPrompt

Bannière flottante fixe bas de page (au-dessus de la Bottom Nav).  
- Icône `Download` dans un cercle `primary/10`
- Titre + description + bouton "Installer" (Android) ou instructions texte (iOS)
- Bouton X pour dismiss
- `bg-card border border-primary/30 rounded-xl shadow-xl`
- Max-w 384px sur desktop, pleine largeur sur mobile (margins 16px)

---

## 6. Pages

### 6.1 `/login`

**Composants** : Card centrée max-w-sm

```
Logo "Epsing" (font-black primary, 40px)
Title: "Connexion"
Description: sous-titre grisé

Form:
  Input "Pseudo" (type=text, autocomplete=username)
  Input "Mot de passe" (type=password)
  Error state (bg-destructive/10, text-destructive, rounded-md)
  Button "Se connecter" (full width, primary)

Footer: "Pas encore de compte ? S'inscrire" (lien)
```

**API** : `POST /api/auth/login` → `{ username, password }`  
**Redirect** : `/vote` si succès

### 6.2 `/register`

**Composants** : Card centrée max-w-sm

```
Logo "Epsing"
Title: "Créer un compte"

Form:
  Input "Pseudo" (3-20 chars, regex [a-zA-Z0-9_-])
  Helper text sous input (12px muted)
  Input "Mot de passe" (min 8 chars)
  Helper text
  Input "Code EPSI" (password + toggle eye visible/masqué)
  Error state
  Button "Créer mon compte"

Footer: "Déjà un compte ? Se connecter"
```

**API** : `POST /api/auth/register` → `{ username, password, epsiCode }`  
**Champ epsiCode** : toggle `Eye`/`EyeOff` lucide, bouton absolument positionné à droite

### 6.3 `/vote` — Page principale

#### État A : `status = 'upcoming'`

```
Header: "Vote" + "Semaine X · YYYY"

Card centrée:
  Title: "Vote pas encore ouvert"
  Countdown: [JJ] [HH] [MM] [SS] — chiffres énormes (tabular, primary)
  Subtitle: "Vendredi 00:00 (heure de Paris)"
```

Countdown en temps réel (setInterval 1s côté client).

#### État B : `status = 'open'`

```
Header: "Vote" + meta semaine

[si hasVoted] Badge "Modifiable" + "Tu peux modifier jusqu'à dimanche 23:59"
[si vote soumis avec succès] Banner success vert

Instruction: "Glisse les joueurs pour établir ton classement."

RankingDnd (liste de toutes les N cartes joueurs)

[Sticky bottom] Button "Soumettre mon classement" / "Mettre à jour mon vote"
  → disabled si orderedIds.length !== N
  → position: sticky, bottom calc(env(safe-area-inset-bottom) + 72px) sur mobile
```

**API** :
- `GET /api/vote/current` → `{ week, hasVoted, ballot }`
- `GET /api/users` → `{ users: [{ id, username }] }`
- `POST /api/vote` → `{ weekId, rankings: [{ userId, position }] }`

#### État C : `status = 'closed'`

```
Card centrée:
  "Le vote est fermé"
  "Le classement sera publié dès la clôture du décompte."
```

### 6.4 `/classement`

```
Header: "Classement"

Tabs: [Semaine] [Mois] [Général]
  → pleine largeur sur mobile
```

#### Tab Semaine

```
Row: WeekSelector + Badge "Faible participation" (si < 3 votants)

[si données]
  Podium: grid 3 colonnes [2e][1er][3e] (le 1er au centre, plus grand)
  Liste: PlayerRow pour rangs 4+

[si vide]
  EmptyState card
```

**API** : `GET /api/ranking/week?year=YYYY&week=WW`

Réponse :
```json
{
  "week": { "id", "year", "isoWeek", "status", "label" },
  "players": [{ "userId", "username", "points", "rank", "voteCount" }],
  "lowParticipation": boolean
}
```

Affichage points : `(points / 100).toFixed(2)` → `"7.85 pts"`

#### Tab Mois

Même layout que Semaine mais :
- WeekSelector navigue par mois (`Mai 2026`, `Avr. 2026`…)
- Compteur `X sem.` en haut à droite
- Points = cumul brut (pas de division), affiché sans ".XX"

**API** : `GET /api/ranking/month?year=YYYY&month=M`

#### Tab Général

Même layout, pas de sélecteur.  
Subtitle : `X semaines comptabilisées`.

**API** : `GET /api/ranking/general`

### 6.5 `/stats`

Accessible aussi via `/stats?userId=X` pour voir les stats d'un autre joueur.  
Si pas de `userId` en param → stats du user connecté (`GET /api/auth/me` pour récupérer son id).

```
Header: "Stats"

Section: Profil du joueur
  [Avatar lg] [Username bold 18px] [X semaines]

Section: Métriques clés — grid 3 colonnes
  Card: "X" + "Meilleur rang"
  Card: "X.X" + "Rang moyen"
  Card: "X" + "Sem. jouées"

Section: Filtre période
  Boutons pill: [4 sem.] [3 mois] [6 mois] [Tout]
  → actif = primary, inactif = secondary

[si history.length > 0]
  Card: "Évolution du rang"
    RankChart (LineChart, axe Y inversé)
    Caption: "Axe inversé — 1er en haut" (10px, centré, muted)

  Card: "Points par semaine"
    PointsChart (BarChart)

  Card: "Historique" (table)
    Rows: [Label semaine] [Badge "Faible part." si voteCount<3] [pts] [#rang]
    → ordre antéchronologique

[si history.length === 0]
  EmptyState card

```

**API** : `GET /api/stats/{userId}?period=4w|3m|6m|all`

Réponse :
```json
{
  "userId": 1,
  "username": "alice",
  "bestRank": 1,
  "avgRank": 1.5,
  "weekCount": 8,
  "history": [
    { "year": 2026, "isoWeek": 15, "label": "Sem. 15 · 2026",
      "points": 285, "rank": 2, "voteCount": 5 }
  ]
}
```

Affichage points dans chart : `points / 100` (float).

### 6.6 `/profil`

```
Header: "Profil"

Card utilisateur:
  [Avatar lg] [Username bold] [Membre depuis DD mois YYYY]

Actions list (boutons pleine largeur, espacés):
  Button outline: "Changer mon mot de passe"
  Card info PWA: titre + description + Badge "PWA disponible"
  Button destructive: "Déconnexion"

Dialog (Modal) "Changer le mot de passe":
  Input "Mot de passe actuel"
  Input "Nouveau mot de passe"
  Input "Confirmer"
  Error state / Success state
  Button "Mettre à jour"

InstallPwaPrompt (flottant)
```

**API** :
- `GET /api/auth/me` → `{ user: { id, username, createdAt, isActive } }`
- `POST /api/auth/change-password` → `{ currentPassword, newPassword }`
- `POST /api/auth/logout` → clear cookie, redirect `/login`

---

## 7. États & micro-interactions

### Loaders

Spinner centré dans la zone de contenu :
```
div.h-6.w-6.animate-spin.rounded-full.border-2.border-primary.border-t-transparent
```

### Empty states

Card centrée `p-8 text-center` avec message `text-muted-foreground`.

### Error states

```
div.rounded-md.bg-destructive/10.px-3.py-2.text-sm.text-destructive
```

### Success states

```
div.rounded-lg.bg-green-500/10.px-3.py-2
p.text-sm.text-green-500.font-medium
```

### Transitions & animations

- Toutes les transitions : `transition-colors duration-150` ou `transition-all duration-200`
- Hover sur cards cliquables : `hover:bg-accent`
- Hover sur PodiumCard : `hover:scale-[1.02]`
- Drag active : `scale-[1.02] opacity-80 shadow-lg`
- Pas de Framer Motion — uniquement Tailwind transitions

---

## 8. Responsive breakpoints

| Breakpoint | Valeur Tailwind | Comportement |
|---|---|---|
| Mobile | `< 768px` | Bottom Nav, layout 1 colonne, padding 16px |
| Desktop | `md: ≥ 768px` | Sidebar 256px, pas de Bottom Nav |

---

## 9. PWA & Safe areas

```css
/* iOS safe area */
padding-bottom: env(safe-area-inset-bottom);

/* Sticky button vote */
bottom: calc(env(safe-area-inset-bottom) + 72px);  /* mobile */
bottom: 24px;  /* md: desktop */
```

Status bar iOS : `black-translucent` → le header de l'OS est transparent.  
Background de la page remonte sous la status bar — prévoir `pt-safe` (safe-area-inset-top).

---

## 10. Connexion Cursor (wiring backend)

> Cette section est pour Cursor, pas pour Figma.

### Conventions de données

Tous les appels API retournent :
```ts
{ ok: true, data: T } | { ok: false, error: string, code: string }
```

### Auth

Session via cookie `epsing_session` (httpOnly, géré automatiquement par le browser).  
Pas besoin d'envoyer de header Authorization.

### Format des points

Les points sont stockés `× 100` dans la DB (entiers).  
**Toujours diviser par 100** avant affichage : `(points / 100).toFixed(2)`.  
Exception classement mensuel/général : afficher `points` brut (cumul de semaines).

### Paramètres optionnels

| Route | Paramètres | Défaut |
|---|---|---|
| `GET /api/ranking/week` | `?year=&week=` | Dernière semaine tallied |
| `GET /api/ranking/month` | `?year=&month=` | Mois courant |
| `GET /api/stats/[userId]` | `?period=4w\|3m\|6m\|all` | `all` |

### Erreurs communes

| Code | HTTP | Cause |
|---|---|---|
| `UNAUTHORIZED` | 401 | Cookie absent ou expiré → redirect `/login` |
| `VOTING_CLOSED` | 422 | Tentative de vote hors période ouverte |
| `INVALID_BALLOT` | 422 | Bulletin incomplet ou invalide |
| `USERNAME_TAKEN` | 409 | Pseudo déjà pris à l'inscription |
| `INVALID_EPSI_CODE` | 403 | Code d'invitation incorrect |
| `RATE_LIMITED` | 429 | Trop de tentatives login/register |

### Fichiers existants à ne pas remplacer

```
src/lib/db.ts          — singleton SQLite
src/lib/auth.ts        — JWT sign/verify/getSession
src/lib/scoring.ts     — algorithme de scoring (testé)
src/lib/week.ts        — helpers timezone Paris
src/lib/cron.ts        — cron de clôture automatique
src/lib/migrations.ts  — schéma BDD
src/lib/env.ts         — validation env vars
src/instrumentation.ts — boot migrations + cron
src/proxy.ts           — middleware auth Next.js 16
src/types.ts           — types partagés
src/app/api/**         — toutes les routes API
```

### Fichiers à remplacer par le nouveau frontend Figma

```
src/app/(auth)/login/page.tsx
src/app/(auth)/register/page.tsx
src/app/(app)/layout.tsx
src/app/(app)/vote/page.tsx
src/app/(app)/classement/page.tsx
src/app/(app)/stats/page.tsx
src/app/(app)/profil/page.tsx
src/components/BottomNav.tsx
src/components/RankingDnd.tsx
src/components/PodiumCard.tsx
src/components/PlayerAvatar.tsx
src/components/ProgressionChart.tsx
src/components/WeekSelector.tsx
src/components/InstallPwaPrompt.tsx
src/app/globals.css
```

---

## 11. Checklist de livraison Figma → Cursor

- [ ] Toutes les pages en dark mode (classe `.dark` sur `<html>`)
- [ ] Toutes les pages responsive (mobile first, breakpoint `md:`)
- [ ] Bottom Nav mobile / Sidebar desktop
- [ ] Touch targets ≥ 44px (min 56px pour les cards drag)
- [ ] Tous les états : loading, empty, error, success
- [ ] `'use client'` uniquement sur composants interactifs (forms, dnd, charts)
- [ ] Pas de `console.log` dans le code livré
- [ ] Pas de `any` TypeScript
- [ ] Toutes les chaînes UI en **français**
- [ ] Accessibilité : `aria-label` sur boutons icônes, focus visible

---

## 12. Inspiration visuelle

- **Densité** : compacte, chaque ligne compte, pas d'espace vide
- **Typographie** : hiérarchie forte (stat numbers géants, labels petits)
- **Couleurs** : quasi monochrome anthracite + un seul accent violet vif
- **Cards** : légèrement surélevées avec border subtil, pas d'ombres portées agressives
- **Podium** : la seule zone avec de la couleur chaude (or/argent/bronze)
- **Charts** : dark glass tooltips, lignes fines, axes minimalistes

References visuelles : Strava Dark, Letterboxd, Apple Fitness app (iOS 17 dark mode).
