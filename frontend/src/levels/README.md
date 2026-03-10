# Cataleg De Nivells (Campanya)

Aquest directori conté els nivells predefinits de campanya en format JSON.

## Convencio De Noms

Els fitxers segueixen el patró:

`<dificultat>-level-<numero>.json`

Exemples:
- `easy-level-1.json`
- `normal-level-8.json`
- `hard-level-15.json`

## Estructura Esperada Del JSON

Cada fitxer ha de ser compatible amb el tipus `Level` definit a
`frontend/src/maze/maze_generator.ts`.

Camp clau:
- `id`, `number`, `difficulty`
- `width`, `height`
- `maze` (graella de cel·les amb parets)
- `memorizeTime`
- `starThresholds`
- `start`, `exit`

## Com S'utilitza

`frontend/src/App.tsx` importa aquest cataleg i el mapeja al diccionari
`savedLevels` per resoldre rutes de campanya (`/level/:difficulty/:number`).

Si falta un fitxer concret, l'aplicacio genera un nivell procedural de fallback.
