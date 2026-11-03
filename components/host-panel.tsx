'use client';
import { useState } from 'react';
import { ChevronRight, TimerReset, Download, Copy, TriangleAlert } from 'lucide-react';
import { buildingName } from '@/lib/catalog';
import { DISTRICTS, STAGES, EVENTS, CONTRIBUTION, type District, type Action, type Insights, type RoomState } from '@/lib/types';

type Props = { room: RoomState; insights: Insights; disabled: boolean; act: (action: Action, extra?: Record<string, unknown>) => void };
function summary(room: RoomState, insights: Insights) {
  const byRole = DISTRICTS[room.district].roles.map(key => `- ${buildingName(room.district, key, 1)}: ${room.players.filter(p => p.role === key && p.building).length} (nivel 2: ${room.players.filter(p => p.role === key && p.tier >= 2).length})`);
  const improved = [...insights.criteria].sort((a, b) => (b.passed - b.first) - (a.passed - a.first))[0];
  return [`# Promptopia · sala ${room.code} · ${DISTRICTS[room.district].label}`, '', `- Habitantes: ${room.players.length}`, `- Construcciones: ${room.players.filter(p => p.building).length}`, ...byRole,
    `- Estrellas avanzadas: ${room.players.reduce((sum, p) => sum + p.bonus, 0)}`, '', '## Aprendizaje', '',
    `- Intentos evaluados: ${insights.attempts}`, `- Puntuación media del primer intento: ${insights.firstAverage}/4`, `- Puntuación media del último intento: ${insights.lastAverage}/4`,
    ...(improved && improved.passed > improved.first ? [`- Criterio que más mejoró: ${improved.label} (${improved.first} → ${improved.passed} jugadores)`] : []),
    ...insights.criteria.map(c => `- ${c.label}: ${c.passed}/${room.players.length}`), '', '## Misión colectiva', '',
    ...EVENTS.map((event, i) => `- ${event.title}: ${room.event.completed > i ? 'lograda' : 'pendiente'}`), ''].join('\n');
}
export default function HostPanel({ room, insights, disabled, act }: Props) {
  const [notice, setNotice] = useState('');
  const { event } = room;
  const last = event.index === EVENTS.length - 1, done = event.active && event.progress >= event.goal;
  const eventLabel = !event.active ? `Abrir evento: ${EVENTS[0].title} ✳` : !done ? `Evento abierto · ${(n => n === 1 ? 'falta 1 aporte' : `faltan ${n} aportes`)(Math.ceil((event.goal - event.progress) / CONTRIBUTION))}` : last ? 'Todos los eventos logrados' : `Abrir evento: ${EVENTS[event.index + 1].title} ✳`;
  const remaining = room.endsAt ? room.endsAt - room.serverNow : 0;
  async function copy() { try { await navigator.clipboard.writeText(summary(room, insights)); setNotice('Resumen copiado.'); } catch { setNotice('No se pudo copiar; usa «Descargar».'); } }
  function download() {
    const url = URL.createObjectURL(new Blob([summary(room, insights)], { type: 'text/markdown' }));
    Object.assign(document.createElement('a'), { href: url, download: `promptopia-${room.code}.md` }).click(); URL.revokeObjectURL(url);
  }
  const players = room.players.filter(p => p.attempts).length;
  return <section className="card"><span className="eyebrow">LA MESA DEL PRESENTADOR</span>
    <h2>{room.phase === 'lobby' ? 'Reúne a tu equipo' : room.phase === 'finished' ? 'Lo que construimos' : 'Guía la experiencia'}</h2>
    <p className="muted">{room.phase === 'lobby' ? 'Comparte la invitación en Meet. Cuando estén listos, inicia el reloj de 30 minutos.' : room.phase === 'finished' ? `${room.players.filter(p => p.building).length} construcciones y ${event.completed} de ${EVENTS.length} misiones colectivas. Invita a compartir cómo mejoraron sus prompts.` : 'Comparte este tablero en Meet. Avanza las fases y abre los eventos cuando la ciudad tome forma.'}</p>
    {room.phase === 'lobby' && <div className="districts" role="radiogroup" aria-label="Distrito de la isla"><b>Distrito de la isla</b>{(Object.keys(DISTRICTS) as District[]).map(key => <button key={key} role="radio" aria-checked={room.district === key} className={room.district === key ? 'on' : ''} disabled={disabled || room.players.length > 0} onClick={() => act('district', { district: key })}><b>{DISTRICTS[key].label}</b><span>{DISTRICTS[key].description} {DISTRICTS[key].roles.length} roles.</span></button>)}{room.players.length > 0 && <p className="subtle">El distrito queda fijo cuando entra el primer jugador.</p>}</div>}
    {room.phase === 'lobby' && <button className="button primary full" disabled={disabled || !room.players.length} onClick={() => act('start')}>Iniciar sesión · 30 min →</button>}
    {room.phase === 'playing' && <>
      <button className="button primary full" disabled={disabled || (event.active && (!done || last))} onClick={() => act('event')}>{eventLabel}</button>
      <div className="button-row"><button className="button secondary" disabled={disabled || remaining <= 0} onClick={() => act('extend')}><TimerReset size={16} /> +5 min</button><button className="button secondary" disabled={disabled} onClick={() => { if (window.confirm('¿Cerrar la sesión para todos? Ya no podrán construir.')) act('finish'); }}>Cerrar sesión</button></div>
    </>}
    {room.phase !== 'finished' && <div className="guide"><b>Guion de la sesión</b><ol className="stages">{STAGES.map((stage, i) => <li key={stage.label} className={i === room.stage ? 'current' : i < room.stage ? 'past' : ''}>{stage.minutes} · {stage.label}</li>)}</ol>
      <button className="button secondary full" disabled={disabled || room.stage >= STAGES.length - 1} onClick={() => act('stage')}>{room.stage < STAGES.length - 1 ? <>Siguiente fase: {STAGES[room.stage + 1].label} <ChevronRight size={16} /></> : 'Última fase'}</button></div>}
    {room.phase !== 'lobby' && <div className="insights"><b>Aprendizaje en vivo</b><p className="subtle">{players ? `${players} jugadores evaluados · ${insights.attempts} intentos · media ${insights.firstAverage} → ${insights.lastAverage}/4` : 'Aún no hay prompts evaluados.'}</p>
      {insights.criteria.map(c => <div className="insight-bar" key={c.label}><span>{c.label}</span><meter min={0} max={Math.max(1, room.players.length)} value={c.passed} /><b>{c.passed}/{room.players.length}</b></div>)}
      {insights.stuck.length > 0 && <p className="stuck"><TriangleAlert size={14} /> Necesitan ayuda: {insights.stuck.join(', ')}</p>}</div>}
    {room.phase === 'finished' && <div className="button-row"><button className="button secondary" onClick={copy}><Copy size={16} /> Copiar resumen</button><button className="button primary" onClick={download}><Download size={16} /> Descargar .md</button></div>}
    {notice && <p className="small-note" role="status">{notice}</p>}
  </section>;
}
