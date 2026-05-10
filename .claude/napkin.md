# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-05-10] `Read` tool puede renderizar mal caracteres Unicode especiales como `￿`**
   Do instead: Usar `cat -A` vía Bash para verificar los bytes reales antes de editar si el valor parece vacío o sospechoso.

## Shell & Command Reliability

## Domain Behavior Guardrails
1. **[2026-05-10] EpisodePlayer: `isWatched` vivía en el mismo `useEffect` que fetchAnime con deps `[id]`**
   Do instead: Separar el fetch de progreso en su propio `useEffect` con deps `[id, episodeNumber, currentUser?.uid]` y hacer `setIsWatched(false)` al inicio para evitar estado stale entre episodios del mismo anime.

2. **[2026-05-10] Firestore prefix search con `documentId()` ya usa `￿` correctamente en userService.js**
   Do instead: Verificar con `cat -A` antes de editar — el Read tool lo mostraba como string vacío pero los bytes eran correctos.

## User Directives
