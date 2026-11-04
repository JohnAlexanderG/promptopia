'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import dynamic from 'next/dynamic';
import { buildingName } from '@/lib/catalog';
import CityScene from './city-scene';
import Journey from './journey';
import PromptWorkshop from './prompt-workshop';
import HostPanel from './host-panel';
import Sheet from './sheet';
import { Activity, Map as MapIcon, PenLine, Presentation, Sparkles } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { ROLES, DISTRICTS, STAGES, EVENTS, CONTRIBUTION, MAX_PLAYERS, type District, type Role, type Reply, type Snapshot, type Session, type Action } from '@/lib/types';

const STORAGE = 'promptopia-session-v1';
type Panel = 'main' | 'mission' | 'activity' | 'guide' | null;
const City3D = dynamic(() => import('./city-3d'), { ssr: false, loading: () => <div className="world world-loading" role="status">Cargando la ciudad 3D…</div> });
function supportsWebGL() { try { const canvas = document.createElement('canvas'); return !!(canvas.getContext('webgl2') || canvas.getContext('webgl')); } catch { return false; } }
const missing = (credits: number) => { const n = Math.ceil(credits / CONTRIBUTION); return n === 1 ? 'Falta 1 aporte' : `Faltan ${n} aportes`; };
export default function GameClient() {
  const socket = useRef<Socket | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState<Role>('urbanista');
  const [district, setDistrict] = useState<District>('centro');
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [panel, setPanel] = useState<Panel>('main');
  const close = useCallback(() => setPanel(null), []);
  const [prompt, setPrompt] = useState('');
  const [now, setNow] = useState(Date.now());
  const clockOffset = useRef(0);
  const savedSession = useRef<Session | null>(null);

  const receive = useCallback((data: Snapshot) => {
    clockOffset.current = data.room.serverNow - Date.now();
    setNow(Date.now());
    setSnapshot(data); savedSession.current = data.session;
    try { sessionStorage.setItem(STORAGE, JSON.stringify(data.session)); } catch { /* Current connection still works. */ }
  }, []);
  useEffect(() => {
    setCode(new URLSearchParams(window.location.search).get('sala')?.toUpperCase().slice(0, 6) ?? '');
    try { savedSession.current = JSON.parse(sessionStorage.getItem(STORAGE) || 'null'); } catch { savedSession.current = null; }
    const client = io({ autoConnect: false }); socket.current = client;
    client.on('room:state', receive);
    client.on('connect', () => {
      setConnected(true); setError('');
      if (!savedSession.current) { setReady(true); return; }
      client.timeout(8000).emit('room:action', { action: 'resume', session: savedSession.current }, (err: Error | null, reply: Reply) => {
        setReady(true);
        if (err) { setError('No se pudo recuperar la sesión. Reintenta o cambia de sala.'); return; }
        if (!reply?.ok) { setError(reply?.error ?? 'No se recibió la sesión.'); return; }
        receive(reply.data); setPrompt(reply.data.prompt);
      });
    });
    if (supportsWebGL()) setView('3d');
    client.on('room:kicked', () => {
      savedSession.current = null; setSnapshot(null); setPrompt('');
      try { sessionStorage.removeItem(STORAGE); } catch {}
      setError('El presentador liberó tu parcela. Puedes volver a entrar si la sala sigue en el lobby.');
    });
    client.on('disconnect', () => { setConnected(false); setReady(false); });
    client.on('connect_error', () => { setError('No hay conexión con el servidor. Intentando reconectar…'); setReady(true); });
    client.connect();
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(interval); client.disconnect(); socket.current = null; };
  }, [receive]);

  useEffect(() => {
    if (!connected || !/^[A-F0-9]{6}$/.test(code)) { setDistrict('centro'); return; }
    socket.current?.timeout(5000).emit('room:peek', code, (err: Error | null, reply: { ok: boolean; district?: District }) => {
      const next = !err && reply?.ok && reply.district && Object.hasOwn(DISTRICTS, reply.district) ? reply.district : 'centro';
      setDistrict(next); setRole(current => DISTRICTS[next].roles.includes(current) ? current : DISTRICTS[next].roles[0]);
    });
  }, [code, connected]);
  async function act(action: Action, extra: Record<string, unknown> = {}) {
    if (!socket.current?.connected || pending || !ready) return;
    setPending(true); setError(''); setNotice('');
    socket.current.timeout(8000).emit('room:action', { action, ...extra }, (err: Error | null, reply: Reply) => {
      setPending(false);
      if (err) { setError('No llegó la confirmación. El estado se recuperará al reconectar; puedes reintentar.'); return; }
      if (!reply?.ok) { setError(reply?.error ?? 'No se recibió la confirmación.'); return; }
      receive(reply.data);
      if (action === 'submit') setNotice('Evaluación guardada. Revisa los criterios debajo.');
    });
  }
  function reset() { try { sessionStorage.removeItem(STORAGE); } catch {} window.location.assign('/'); }
  async function copyInvite() {
    try { await navigator.clipboard.writeText(`${window.location.origin}/?sala=${snapshot!.room.code}`); setNotice('Enlace copiado. Compártelo por el chat de Meet.'); }
    catch { setNotice(`Comparte esta dirección y el código ${snapshot!.room.code}.`); }
  }
  const room = snapshot?.room;
  const host = snapshot?.session.kind === 'host';
  const me = room?.players.find(p => p.id === snapshot?.session.playerId);
  const seconds = room?.endsAt ? Math.max(0, Math.ceil((room.endsAt - now - clockOffset.current) / 1000)) : 1800;
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const built = room?.players.filter(p => p.building).length ?? 0;
  const disabled = !connected || !ready || pending;
  const onKick = host && room?.phase !== 'finished' ? (id: string) => void act('kick', { playerId: id }) : undefined;
  const eventDone = !!room?.event.active && room.event.progress >= room.event.goal;

  const toggle = (name: Panel) => setPanel(current => current === name ? null : name);
  const messages = <>{error && <div className="alert" role="alert">{error} <button className="text-button" onClick={reset}>Cambiar de sala</button></div>}{notice && <div className="notice" role="status">{notice}</div>}</>;

  if (!room) return <MotionConfig reducedMotion="user"><div className="shell">
    <header className="topbar"><a className="brand" href="/" aria-label="Promptopia, inicio"><span className="brand-icon">▦</span> promptopia<span className="brand-dot">.</span></a><div className="top-meta"><span className={`status-dot ${connected ? 'online' : ''}`} />{connected ? 'En línea' : 'Reconectando'}<span className="edition">LABORATORIO DE IDEAS / 01</span></div></header>
    {messages}
    <main className="landing">
      <section className="intro"><span className="eyebrow">UNA EXPERIENCIA PARA CONSTRUIR JUNTOS</span><h1>Tu próxima idea<br />puede ser <em>una ciudad.</em></h1><p>Tienes una parcela y 20 créditos. Escribe un buen prompt, desbloquea tu edificio y construye una ciudad con tu equipo.</p><div className="intro-facts"><span><b>{MAX_PLAYERS}</b> habitantes</span><span><b>30</b> minutos</span><span><b>01</b> ciudad compartida</span></div><CityScene preview /><p className="small-note">Explora la isla y prueba una construcción antes de entrar.</p></section>
      <section className="entry-card"><div className="entry-badge">TU AVENTURA EMPIEZA AQUÍ</div><span className="eyebrow">TU PARCELA TE ESPERA</span><h2>Entra a la ciudad</h2><p className="muted">Pide el código al presentador y elige tu papel.</p><form onSubmit={e => { e.preventDefault(); void act('join', { code: code.trim(), name: name.trim(), role }); }}><label htmlFor="code">Código de la sala</label><input id="code" placeholder="Ej. A1B2C3" value={code} maxLength={6} minLength={6} pattern="[A-Fa-f0-9]{6}" required onChange={e => setCode(e.target.value.toUpperCase())} className="code-input" autoComplete="off" /><label htmlFor="name">Tu nombre</label><input id="name" placeholder="¿Cómo te llamas?" value={name} minLength={2} maxLength={24} required onChange={e => setName(e.target.value)} autoComplete="given-name" /><label htmlFor="role">Tu rol en la ciudad</label><select id="role" value={role} onChange={e => setRole(e.target.value as Role)}>{DISTRICTS[district].roles.map(key => <option value={key} key={key}>{ROLES[key].icon} {ROLES[key].label} · {buildingName(district, key, 1)}</option>)}</select><button className="button primary full" disabled={disabled} type="submit">{pending ? 'Conectando…' : 'Encontrar mi parcela →'}</button></form><Journey /><div className="entry-divider">¿Vas a guiar la experiencia?</div><button className="button secondary full" disabled={disabled} onClick={() => void act('create')}>Crear sala de presentador</button><p className="small-note">Sin cuentas · Hasta {MAX_PLAYERS} jugadores · Evaluación por reglas</p></section>
    </main>
    <footer><span>PROMPTOPIA · APRENDEMOS CONSTRUYENDO</span><span>Las grandes ciudades empiezan con buenas preguntas.</span></footer>
  </div></MotionConfig>;

  // In a room the city fills the screen; everything else floats over it.
  const city = view === '3d' ? <City3D room={room} me={me} onKick={onKick} onWorkshop={() => setPanel('main')} fallback={<CityScene room={room} me={me} onKick={onKick} onWorkshop={() => setPanel('main')} />} /> : <CityScene room={room} me={me} onKick={onKick} onWorkshop={() => setPanel('main')} />;
  return <MotionConfig reducedMotion="user"><main className="stage">
    <div className="stage-city">{city}</div>
    <header className="hud">
      <div className="hud-card hud-main">
        <a className="brand" href="/" aria-label="Promptopia, inicio"><span className="brand-icon">▦</span></a>
        <div><span className="eyebrow">{host ? 'PRESENTADOR' : `HOLA, ${me?.name.toUpperCase()}`} · {DISTRICTS[room.district].label.toUpperCase()}</span><b>La ciudad de las ideas<span className="brand-dot">.</span></b></div>
        <span className={`phase ${room.phase}`}>{room.phase === 'lobby' ? 'EN EL LOBBY' : room.phase === 'playing' ? 'EN CONSTRUCCIÓN' : 'SESIÓN CERRADA'}</span>
        <span className="hud-stat"><b className={seconds < 60 ? 'urgent' : ''}>{room.phase === 'finished' ? 'Fin' : time}</b> tiempo</span>
        <span className="hud-stat"><b>{room.players.length}/{MAX_PLAYERS}</b> habitantes</span>
        <span className="hud-stat"><b>{built}/{MAX_PLAYERS}</b> edificios</span>
        {me && <span className="hud-stat"><b>◈ {me.credits}</b> créditos</span>}
      </div>
      <div className="hud-card hud-room">
        <span className={`status-dot ${connected ? 'online' : ''}`} title={connected ? 'En línea' : 'Reconectando'} />
        <span className="hud-code">SALA <b>{room.code}</b></span>
        <button onClick={copyInvite} className="text-button">Copiar invitación</button>
        <div className="view-toggle" role="group" aria-label="Vista de la ciudad"><button className={view === '3d' ? 'on' : ''} aria-pressed={view === '3d'} onClick={() => setView('3d')}>3D</button><button className={view === '2d' ? 'on' : ''} aria-pressed={view === '2d'} onClick={() => setView('2d')}>2D</button></div>
      </div>
    </header>
    <div className="hud-stage" role="status"><span>FASE {room.stage + 1}/{STAGES.length}</span><b>{STAGES[room.stage].label}</b><span className="hud-stage-tip">{STAGES[room.stage].prompt}</span></div>
    <div className="toasts">{messages}</div>
    <nav className="dock" aria-label="Paneles">
      <button className={panel === 'main' ? 'on' : ''} aria-pressed={panel === 'main'} onClick={() => toggle('main')}>{host ? <><Presentation size={17} /> Mesa del presentador</> : <><PenLine size={17} /> Mi taller</>}</button>
      <button className={panel === 'mission' ? 'on' : ''} aria-pressed={panel === 'mission'} onClick={() => toggle('mission')}><Sparkles size={17} /> Misión {room.event.active ? `${room.event.progress}/${room.event.goal}` : `${room.event.completed}/${EVENTS.length}`}</button>
      <button className={panel === 'activity' ? 'on' : ''} aria-pressed={panel === 'activity'} onClick={() => toggle('activity')}><Activity size={17} /> Actividad</button>
      <button className={panel === 'guide' ? 'on' : ''} aria-pressed={panel === 'guide'} onClick={() => toggle('guide')}><MapIcon size={17} /> Cómo se juega</button>
    </nav>
    <Sheet title={host ? 'Mesa del presentador' : 'Mi taller'} open={panel === 'main'} onClose={close}>
      {host ? <HostPanel room={room} insights={snapshot.insights!} disabled={disabled} act={(action, extra) => void act(action, extra)} /> : me && <PromptWorkshop room={room} me={me} snapshot={snapshot} prompt={prompt} setPrompt={setPrompt} disabled={disabled} act={(action, extra) => void act(action, extra)} />}
    </Sheet>
    <Sheet title="Misión colectiva" open={panel === 'mission'} onClose={close}>
      <section className="card event-card"><span className="eyebrow">MISIÓN COLECTIVA {Math.min(room.event.index + 1, EVENTS.length)}/{EVENTS.length}</span><h2>{EVENTS[room.event.index].title} <span>✳</span></h2><p className="muted">{room.event.active ? `Cada habitante aporta ${CONTRIBUTION} créditos una vez. La meta crece con la ciudad: ${room.event.goal} créditos.` : 'La meta depende de cuántos habitantes estén en línea: lo logramos solo si participamos todos.'}</p><div className="progress-label"><b>{room.event.progress} / {room.event.goal || '—'} ◈</b><span>{eventDone ? EVENTS[room.event.index].done : room.event.active ? missing(room.event.goal - room.event.progress) : 'Próximamente'}</span></div><progress value={room.event.progress} max={room.event.goal || 1} aria-label="Progreso del evento colectivo" />{me && <button className="button secondary full" disabled={disabled || !room.event.active || room.phase !== 'playing' || me.contributed || eventDone || me.credits < CONTRIBUTION} onClick={() => void act('contribute')}>{me.contributed ? '✓ Ya aportaste a esta misión' : `Aportar ${CONTRIBUTION} créditos ◈`}</button>}<p className="small-note">{room.event.completed ? `Misiones logradas: ${EVENTS.slice(0, room.event.completed).map(e => e.title).join(' · ')}.` : 'Un aporte por habitante y misión. El presentador abre cada evento.'}</p></section>
    </Sheet>
    <Sheet title="Así crece la ciudad" open={panel === 'activity'} onClose={close}>
      <section className="activity"><ul>{room.log.map((item, i) => <li key={`${i}-${item}`}><span>↗</span>{item}</li>)}</ul></section>
    </Sheet>
    <Sheet title="Cómo se juega" open={panel === 'guide'} onClose={close}>
      <Journey room={room} me={me} host={host} />
      <ol className="stages">{STAGES.map((stage, i) => <li key={stage.label} className={i === room.stage ? 'current' : i < room.stage ? 'past' : ''}>{stage.minutes} · {stage.label}<br /><small>{stage.prompt}</small></li>)}</ol>
    </Sheet>
  </main></MotionConfig>;
}
