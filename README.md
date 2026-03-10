# MazeMind‑TFG

MazeMind és un joc web per l'entrenament de la memòria visoespacial: el jugador memoritza un laberint, després el resol amb parets ocultes, i rep feedback de rendiment amb progressió, puntuació i adaptació de dificultat.

## Què inclou el MVP

- Campanya de nivells predefinits (`easy`, `normal`, `hard`).
- Modes pràctica (normal score-run, lliure i IA adaptativa).
- DDA heurístic explicable (no model de ML entrenat).
- Multijugador competitiu per rondes, sincronitzat via Supabase.
- Repte diari amb ratxa.
- Personalització visual, remapeig de tecles, i18n (`ca`, `es`, `en`) i millores d'accessibilitat.

## Stack tecnològic

- Frontend: React + TypeScript + Vite.
- Persistència i auth: Supabase (Auth + PostgREST + RLS).
- Render de joc: Canvas 2D.
- Àudio: `HTMLAudioElement` via `frontend/src/audio/sound.ts`.

## Execució local

### 1) Prerequisits

- Node.js 18+ i npm.
- Projecte Supabase operatiu.

### 2) Variables d'entorn del frontend

Crea `frontend/.env.local`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 3) Configuració de base de dades

Aplica SQL a Supabase SQL Editor:

- Esquema base: `BD/table_schemas.sql`
- Features: fitxers de `sql_querys/` segons necessitats del teu entorn
  - `dda_v2.sql`
  - `multiplayer.sql`
  - `multiplayer_fix.sql`
  - `multiplayer_fix_recursion.sql` (si tens errors de polítiques recursives)
  - `multiplayer_join_by_code.sql`
  - `language_preference.sql`
  - `daily_streak.sql`

### 4) Desenvolupament

```bash
cd frontend
npm install
npm run dev
```

### 5) Build de producció

```bash
cd frontend
npm run build
npm run preview
```

## Estructura del repositori

- `frontend/`: aplicació web.
- `frontend/src/App.tsx`: router SPA i orquestració de pantalles.
- `frontend/src/main.tsx`: entrypoint i providers globals.
- `frontend/src/pages/`: pantalles principals.
- `frontend/src/components/`: components reutilitzables i modals.
- `frontend/src/components/settings/`: editor de configuració + previews.
- `frontend/src/components/multiplayer/`: UI específica de multijugador.
- `frontend/src/maze/`: generació/anàlisi de laberints.
- `frontend/src/audio/`: gestió d'efectes i música.
- `frontend/src/lib/`: capa de domini (DDA, sync, multiplayer, Supabase, daily).
- `frontend/src/context/`: estat global (usuari, settings, idioma).
- `frontend/src/utils/`: utilitats (progress, settings, color, i18n, etc.).
- `frontend/src/levels/`: catàleg de nivells JSON (`README.md` intern).
- `sql_querys/`: scripts SQL de funcionalitats.
- `BD/`: esquema i taules.
- `scripts/`: scripts de manteniment (`README.md` intern).

## Mapa funcional ràpid

### Joc i generació procedural

- Generador DFS + PRNG: `frontend/src/maze/maze_generator.ts`
- Mètriques de laberint: `frontend/src/maze/maze_stats.ts`
- Pantalla de joc: `frontend/src/pages/LevelScreen.tsx`

### DDA (dificultat adaptativa)

- Lògica principal: `frontend/src/lib/dda.ts`
- Persistència relacionada: `level_attempts`, `user_skill_v2`, `level_catalog`
- SQL: `sql_querys/dda_v2.sql`
- Documentació: `dda.md`, `dda2.md`

### Multijugador

- Domini: `frontend/src/lib/multiplayer.ts`
- Pantalles: `frontend/src/pages/MultiplayerScreen.tsx`, `frontend/src/pages/MultiplayerMatchScreen.tsx`
- Components: `frontend/src/components/multiplayer/*`
- SQL: `sql_querys/multiplayer*.sql`

### Repte diari

- Lògica: `frontend/src/lib/dailyChallenge.ts`
- Pantalles: `frontend/src/pages/DailyChallengeScreen.tsx`
- Modal de resultat: `frontend/src/components/DailyCompletionModal.tsx`
- SQL: `sql_querys/daily_streak.sql`

### Accessibilitat i UX

- Focus trap: `frontend/src/utils/focusTrap.ts`
- Contrast checker: `frontend/src/components/settings/ContrastCheckerPanel.tsx`
- Keybindings: `frontend/src/components/settings/GameSettingsComponent.tsx`
- Informe: `UI_and_adaptability.md`

### Idioma i internacionalització

- Diccionari: `frontend/src/utils/translations.ts`
- Context d'idioma: `frontend/src/context/LanguageContext.tsx`
- Persistència cloud d'idioma: `frontend/src/lib/cloudSettings.ts`

## Usuaris i persistència

### Autenticació

- Email/password via Supabase.
- Guest/anònim via `signInAnonymously`.
- No hi ha OAuth en la implementació actual.

### Política de dades local vs núvol

- Campanya + best de pràctica: es carreguen des del núvol en login (`getCloudSnapshot`).
- Configuració visual/controls: fusió amb preferència dels valors cloud en conflicte.
- Idioma: local + cloud, sincronitzat per usuari autenticat.

### Multijugador i guest

- Guest pot crear/jugar partides privades per codi.
- Partides públiques obertes requereixen compte autenticat.

## Scripts útils

### Keepalive de Supabase

Fitxer: `scripts/supabase_keepalive.py`

Variables requerides:

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_PING_TABLE=...
```

Execució:

```bash
python3 scripts/supabase_keepalive.py
```

## Notes

- Si `npm run build` avisa de chunks grans a Vite, és un warning de bundle size, no un error de compilació.
- En entorns nous, comprova primer SQL + RLS abans de validar multijugador o DDA.
