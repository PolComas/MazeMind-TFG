# MazeMind‑TFG

MazeMind és un joc per entrenar la memòria visoespacial. El joc mostra un laberint durant uns segons i després les parets es tornen invisibles perquè la persona hagi de recordar i reconstruir el camí.

## **Com executar el projecte**

### **Prerequisits**
- Node.js + npm instal·lats.
- Un projecte de Supabase amb les taules i polítiques configurades.

### **Configuració d’entorn (sense secrets)**
Crea `frontend/.env.local` i defineix:
- `VITE_SUPABASE_URL` — URL del teu projecte Supabase.
- `VITE_SUPABASE_ANON_KEY` — clau pública (anon) de Supabase.
- `VITE_API_BASE_URL` — opcional si afegeixes backend propi.
- `DATABASE_URL` — només si afegeixes un backend (no és necessari pel frontend).

### **Arrencada en desenvolupament**
```bash
cd frontend
npm install
npm run dev
```

### **Build i preview**
```bash
cd frontend
npm run build
npm run preview
```

## **Estructura del projecte**
- `frontend/` — Aplicació React (UI + lògica de joc + integració Supabase).
- `frontend/src/App.tsx` — Router i control de rutes SPA.
- `frontend/src/pages/` — Pantalles principals (Home, Levels, Game, Multiplayer, Settings, etc.).
- `frontend/src/components/` — Components reutilitzables i modals.
- `frontend/src/components/settings/` — UI de personalització i previews en temps real.
- `frontend/src/maze/` — Generació i anàlisi de laberints.
- `frontend/src/lib/` — Lògica de DDA, sincronització, multiplayer i Supabase.
- `frontend/src/context/` — Contextos d’usuari, configuració i idioma.
- `frontend/src/utils/` — Utilitats (progressos, settings, traduccions, etc.).

## **Mapa de lògica per funcionalitat**

### **Generació de laberints (IA / procedimental)**
- Generador i PRNG: `frontend/src/maze/maze_generator.ts`
- Anàlisi de dificultat (maze rating, mètriques): `frontend/src/maze/maze_stats.ts`
- Pantalla de laboratori/creació: `frontend/src/pages/MazeGeneratorScreen.tsx`

### **DDA (Adaptive Difficulty)**
- Algoritme i models: `frontend/src/lib/dda.ts`
- Registre d’intents i actualització d’habilitat: `level_attempts`, `user_skill_v2`, `level_catalog`

### **Multijugador (sense servidor propi)**
- Lògica principal: `frontend/src/lib/multiplayer.ts`
- Pantalles: `frontend/src/pages/MultiplayerScreen.tsx`, `frontend/src/pages/MultiplayerMatchScreen.tsx`
- Components específics: `frontend/src/components/multiplayer/*`

### **Accessibilitat (a11y)**
- Focus visible i reduced motion: `frontend/src/index.css`
- Atributs ARIA i rol de diàlegs: diversos components i modals
- Dreceres de teclat configurables: `frontend/src/components/settings/GameSettingsComponent.tsx`

### **UX, so i feedback**
- So d’interaccions: `frontend/src/audio/sound.ts`
- Microinteraccions a botons i hover: components UI

### **Idiomes i internacionalització**
- Traduccions: `frontend/src/utils/translations.ts`
- Context i persistència: `frontend/src/context/LanguageContext.tsx`

### **Gestió d’usuaris (guest / auth)**
- Autenticació Supabase: `frontend/src/lib/supabase.ts`
- Sessió i logout: `frontend/src/context/UserContext.tsx`
- Modal login/register: `frontend/src/components/AuthModal.tsx`
- Usuari guest: es guarda en localStorage, sense sincronitzar

### **Persistència i sincronització**
- Progrés local: `frontend/src/utils/progress.ts`, `frontend/src/utils/practiceProgress.ts`
- Sync amb Supabase: `frontend/src/lib/sync.ts`
- Carrega/sincronitza en login: `frontend/src/App.tsx`

### **Configuració visual i personalització**
- Tokens visuals per pantalla: `frontend/src/utils/settings.ts`
- Context i sincronització de settings: `frontend/src/context/SettingsContext.tsx`, `frontend/src/lib/cloudSettings.ts`
- UI de personalització: `frontend/src/pages/SettingsScreen.tsx`, `frontend/src/components/settings/*`