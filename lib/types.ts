import type { Role, District } from './catalog';
export { ROLES, DISTRICTS, type Role, type District } from './catalog';
export const STAGES = [
  { label: 'Bienvenida y roles', minutes: '00–05', prompt: 'Revisa tu reto y piensa: ¿quién debería responder a tu pregunta?' },
  { label: 'Anatomía de un prompt', minutes: '05–10', prompt: 'Un buen prompt tiene rol, tarea con contexto, una restricción y un formato.' },
  { label: 'Construir la ciudad', minutes: '10–20', prompt: 'Escribe, evalúa y mejora tu prompt hasta desbloquear tu edificio.' },
  { label: 'Desafío colectivo', minutes: '20–25', prompt: 'Aporta créditos al evento: la ciudad solo lo logra si participamos todos.' },
  { label: 'Reflexión compartida', minutes: '25–30', prompt: '¿Qué cambio en tu prompt mejoró más el resultado? Compártelo en Meet.' },
] as const;
export const EVENTS = [
  { title: 'Iluminemos la plaza', done: '¡Plaza iluminada!' },
  { title: 'Pongamos en marcha el tren', done: '¡El tren ya recorre la ciudad!' },
] as const;
export const CONTRIBUTION = 5;
/** Room capacity: one plot per player (9 blocks × 4 plots). */
export { MAX_PLAYERS, MAX_PLAYERS_WORDS } from './config';
export type Check = { label: string; passed: boolean; hint: string; match?: string; advanced?: boolean };
export type Evaluation = { score: number; bonus: number; checks: Check[] };
export type Attempt = { prompt: string; score: number; bonus: number; at: number };
export type Player = { id: string; name: string; role: Role; plot: number; connected: boolean; credits: number; score: number; bonus: number; attempts: number; tier: number; building: string | null; contributed: boolean };
export type GameEvent = { index: number; active: boolean; progress: number; goal: number; completed: number };
export type RoomState = { code: string; phase: 'lobby' | 'playing' | 'finished'; district: District; stage: number; endsAt: number | null; players: Player[]; event: GameEvent; log: string[]; serverNow: number };
export type Insights = { criteria: { label: string; first: number; passed: number }[]; scores: number[]; attempts: number; stuck: string[]; firstAverage: number; lastAverage: number };
export type Session = { code: string; token: string; kind: 'host' | 'player'; playerId?: string };
export type Snapshot = { room: RoomState; session: Session; prompt: string; evaluation: Evaluation | null; attempts: Attempt[]; insights?: Insights };
export type Reply = { ok: true; data: Snapshot } | { ok: false; error: string };
export type Action = 'create' | 'join' | 'resume' | 'start' | 'submit' | 'build' | 'event' | 'contribute' | 'finish' | 'stage' | 'extend' | 'kick' | 'upgrade' | 'district';
