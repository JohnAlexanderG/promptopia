'use client';
import { useMemo, useState } from 'react';
import { Lightbulb, Lock, History, RotateCcw, Star } from 'lucide-react';
import { evaluate } from '@/lib/rubric';
import { buildingName } from '@/lib/catalog';
import { ROLES, type Action, type Player, type RoomState, type Snapshot } from '@/lib/types';

type Props = { room: RoomState; me: Player; snapshot: Snapshot; prompt: string; setPrompt: (value: string) => void; disabled: boolean; act: (action: Action, extra?: Record<string, unknown>) => void };
export default function PromptWorkshop({ room, me, snapshot, prompt, setPrompt, disabled, act }: Props) {
  const [hintsOpen, setHintsOpen] = useState(0);
  const live = useMemo(() => evaluate(prompt, me.role), [prompt, me.role]);
  const playing = room.phase === 'playing';
  const [question, template, example] = ROLES[me.role].hints;
  const latest = snapshot.evaluation, canUpgrade = !!latest && latest.score === 4 && latest.bonus >= 1;
  const hints = [{ title: 'Pregunta guía', body: <p>{question}</p> }, { title: 'Plantilla', body: <p className="template">{template}</p> }, { title: 'Antes y después', body: <><p className="weak">✗ {example.weak}</p><p className="strong">✓ {example.strong}</p></> }];
  const stars = (count: number) => <span className="stars" aria-label={`${count} de 2 criterios avanzados`}>{[0, 1].map(i => <Star key={i} size={14} className={i < count ? 'on' : ''} />)}</span>;
  return <section className="card" id="player-workshop">
    <span className="eyebrow">TU TALLER / PARCELA {String(me.plot + 1).padStart(2, '0')}</span>
    <div className="workshop-title"><h2>{ROLES[me.role].label}</h2><span className="credits">◈ {me.credits}</span></div>
    <p className="challenge">{ROLES[me.role].challenge}</p>
    {room.phase === 'lobby' ? <div className="waiting"><span>◎</span><b>Tu lugar está reservado</b><p>Esperamos a que el presentador inicie. Mientras tanto, piensa en el rol, contexto, límites y formato de tu prompt.</p></div> : <>
      {me.building && <div className="success"><span>{ROLES[me.role].icon}</span><h3>¡Una idea hecha ciudad!</h3><p>Construiste: {me.building.toLowerCase()}{me.tier >= 2 ? ' (nivel 2)' : ''}. {me.bonus < 2 ? 'Reto avanzado: sigue mejorándolo para ganar estrellas.' : 'Conseguiste las dos estrellas avanzadas.'}</p>{stars(me.bonus)}
        {me.tier < 2 && playing && <div className="upgrade"><b>Nivel 2 · {buildingName(room.district, me.role, 2)}</b><p>{canUpgrade ? '¡Tu último prompt lo desbloquea!' : 'Consigue 4/4 y al menos una estrella en un mismo prompt.'}</p><button className="button primary full" disabled={disabled || !canUpgrade} onClick={() => act('upgrade')}>Mejorar a {buildingName(room.district, me.role, 2).toLowerCase()} ↑</button></div>}</div>}
      {playing && <>
        <label htmlFor="prompt">{me.building ? 'Reto avanzado' : 'Tu prompt'}</label>
        <textarea id="prompt" rows={7} placeholder="Actúa como… Diseña… Ten en cuenta… Presenta el resultado en…" value={prompt} maxLength={2000} onChange={e => setPrompt(e.target.value)} />
        <ul className="live-checks" aria-label="Criterios detectados mientras escribes">{live.checks.map(check => <li key={check.label} className={`${check.passed ? 'on' : ''} ${check.advanced ? 'advanced' : ''}`}>{check.advanced ? '★' : check.passed ? '✓' : '○'} {check.label}</li>)}</ul>
        <div className="editor-meta"><span>Vista previa en vivo · la evaluación oficial llega al enviar</span><span>{prompt.length}/2000</span></div>
        <button className="button primary full" disabled={disabled || prompt.trim().length < 20} onClick={() => act('submit', { prompt })}>Evaluar mi prompt →</button>
      </>}
      {snapshot.evaluation && <div className="evaluation"><h3>Tu evaluación <span>{snapshot.evaluation.score}/4 {stars(snapshot.evaluation.bonus)}</span></h3><p className="subtle">Evaluación del último envío; evalúa de nuevo si lo editas.</p>
        {snapshot.evaluation.checks.map(check => <div className={`criterion ${check.passed ? 'passed' : ''} ${check.advanced ? 'advanced' : ''}`} key={check.label}><b>{check.passed ? '✓' : check.advanced ? '☆' : '○'} {check.label}{check.advanced && <em> · avanzado</em>}</b>{check.passed ? check.match && <small>Detectado: «{check.match}»</small> : <small>{check.hint}</small>}</div>)}
        {!me.building && <button className="button secondary full" disabled={disabled || !playing || snapshot.evaluation.score < 3} onClick={() => act('build')}>Construir {buildingName(room.district, me.role, 1).toLowerCase()} · 10 ◈</button>}
      </div>}
      {playing && !me.building && <div className="hints"><h3><Lightbulb size={16} /> Pistas</h3>{hints.map((hint, i) => me.attempts > i ? <div key={hint.title} className="hint">{hintsOpen > i ? <><b>{hint.title}</b>{hint.body}</> : <button className="text-button" onClick={() => setHintsOpen(i + 1)}>Ver pista {i + 1}: {hint.title.toLowerCase()}</button>}</div> : <div key={hint.title} className="hint locked"><Lock size={13} /> Pista {i + 1} tras {i + 1} {i ? 'intentos' : 'intento'}</div>)}</div>}
      {snapshot.attempts.length > 0 && <div className="history"><h3><History size={16} /> Tus intentos</h3><ol>{snapshot.attempts.map((attempt, i) => <li key={attempt.at + '-' + i}><span>Intento {me.attempts - snapshot.attempts.length + i + 1}</span><b>{attempt.score}/4</b>{stars(attempt.bonus)}{playing && <button className="text-button" aria-label={`Recuperar intento ${i + 1}`} onClick={() => setPrompt(attempt.prompt)}><RotateCcw size={13} /> Recuperar</button>}</li>)}</ol></div>}
    </>}
    {room.phase === 'finished' && <p className="small-note">La sesión terminó. Tu ciudad queda disponible para verla.</p>}
  </section>;
}
