'use client';
import { ArrowRight, MapPin, UserMinus } from 'lucide-react';
import { ROLES, type Player } from '@/lib/types';

/** Details of the selected plot, shared by the 2D and 3D cities. */
export default function PlotInspector({ selected, current, me, onKick, onSelect, onWorkshop, reduce }: { selected: number | null; current?: Player; me?: Player; onKick?: (playerId: string) => void; onSelect: (plot: number | null) => void; onWorkshop?: () => void; reduce: boolean | null }) {
  return <>
    <div className="inspector-icon">{current ? <span aria-hidden>{ROLES[current.role].icon}</span> : <MapPin />}</div>
    <div><b>{selected === null ? 'Explora la ciudad de tu equipo' : `Parcela ${selected + 1} · ${current?.name ?? 'Disponible'}`}</b><p>{current ? `${ROLES[current.role].label} · ${current.building ?? 'Aún por construir'}${current.tier >= 2 ? ' (nivel 2)' : ''} · ${current.score}/4 criterios${current.bonus ? ` · ${'★'.repeat(current.bonus)}` : ''} · ${current.credits} créditos${onKick ? ` · ${current.attempts} intentos` : ''}` : 'Cada participante recibe una parcela al entrar. Selecciona una para conocer su historia.'}</p></div>
    {onKick && current && <button className="button secondary" onClick={() => { if (window.confirm(`¿Liberar la parcela de ${current.name}? Perderá su progreso.`)) { onKick(current.id); onSelect(null); } }}><UserMinus size={16} /> Liberar parcela</button>}
    {me && <button className="button primary" onClick={() => { onSelect(me.plot); if (onWorkshop) return onWorkshop(); document.getElementById('player-workshop')?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth', block: 'start' }); document.getElementById('prompt')?.focus({ preventScroll: true }); }}>Mi taller <ArrowRight size={16} /></button>}
  </>;
}
