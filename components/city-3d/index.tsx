'use client';
import { Component, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useReducedMotion } from 'motion/react';
import { ZoomIn, ZoomOut, LocateFixed, MousePointer2 } from 'lucide-react';
import { DISTRICTS, AMBIENT, ROADS, FENCE, modelFor } from '@/lib/catalog';
import { ROLES, MAX_PLAYERS, type Player, type RoomState } from '@/lib/types';
import PlotInspector from '../plot-inspector';
import CityWorld from './scene';
import { url, plotPosition, cellCenter, COLS, ROWS } from './models';

// The camera orbits the middle of the city (between the plot blocks, the plaza and the power-plant block).
const TARGET: [number, number, number] = [24, 0, 26], HOME: [number, number, number] = [TARGET[0] + 185, 170, TARGET[2] + 185];
/** The camera target stays over the city, so panning never drifts off the island. */
const [MIN_X, MAX_X, MIN_Z, MAX_Z] = [cellCenter(0, 0)[0], cellCenter(COLS - 1, 0)[0], cellCenter(0, 0)[1], cellCenter(0, ROWS - 1)[1]];
/** Flying to a plot gets at least this close, keeping the current viewing angle. */
const FOCUS_DISTANCE = 150;
type Flight = { target: Vector3; position: Vector3 } | null;
type Props = { room: RoomState; me?: Player; onKick?: (playerId: string) => void; onWorkshop?: () => void; fallback: ReactNode };

/** Falls back to the 2D city if WebGL or a model fails at runtime. */
class Guard extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export default function City3D(props: Props) { return <Guard fallback={props.fallback}><City {...props} /></Guard>; }

function City({ room, me, onKick, onWorkshop }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const reduce = !!useReducedMotion();
  const controls = useRef<OrbitControlsImpl>(null);
  const flight = useRef<Flight>(null);
  const district = DISTRICTS[room.district], finished = room.phase === 'finished';
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    // Warm the cache with everything this district can show, so new buildings appear without a pause.
    const ids = district.roles.flatMap(role => [modelFor(room.district, role, 1), modelFor(room.district, role, 2)]);
    for (const id of new Set([...ids, ...district.decor, ...district.street, district.corner, ...district.landmarks.map(l => l.model), ...Object.values(ROADS), ...FENCE.panels, FENCE.post, ...Object.values(AMBIENT).flat()])) useGLTF.preload(url(id));
  }, [room.district, district]);
  function zoom(factor: number) {
    const c = controls.current; if (!c) return;
    flight.current = null;
    const offset = c.object.position.clone().sub(c.target).multiplyScalar(factor);
    offset.setLength(Math.min(c.maxDistance, Math.max(c.minDistance, offset.length())));
    c.object.position.copy(c.target).add(offset); c.update();
  }
  /** Moves camera and target together along the ground, relative to where the camera looks. */
  function pan(right: number, forward: number) {
    const c = controls.current; if (!c) return;
    flight.current = null;
    const look = c.target.clone().sub(c.object.position).setY(0).normalize(), side = new Vector3(-look.z, 0, look.x);
    const step = c.object.position.distanceTo(c.target) * 0.12, move = side.multiplyScalar(right * step).add(look.multiplyScalar(forward * step));
    c.target.add(move); c.object.position.add(move); c.update();
  }
  /** Glides to a plot (or home) keeping the viewing angle; jumps when the user prefers reduced motion. */
  function fly(target: Vector3, distance?: number, position?: Vector3) {
    const c = controls.current; if (!c) return;
    const offset = c.object.position.clone().sub(c.target);
    if (distance) offset.setLength(Math.min(offset.length(), distance));
    const goal = { target, position: position ?? target.clone().add(offset) };
    if (reduce) { c.target.copy(goal.target); c.object.position.copy(goal.position); c.update(); flight.current = null; }
    else flight.current = goal;
  }
  function select(plot: number | null) {
    setSelected(plot);
    if (plot !== null) { const [x, z] = plotPosition(plot); fly(new Vector3(x, 0, z), FOCUS_DISTANCE); }
  }
  /** Back to the overview of the whole city; the player's own plot stays highlighted. */
  function center() { fly(new Vector3(...TARGET), undefined, new Vector3(...HOME)); setSelected(me?.plot ?? null); }
  useEffect(() => {
    // Arrow keys pan, + and − zoom, unless the user is typing.
    function onKey(e: KeyboardEvent) {
      const typing = e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]');
      if (e.altKey || e.ctrlKey || e.metaKey || typing) return;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
      if (moves[e.key]) { e.preventDefault(); pan(...moves[e.key]); }
      else if (e.key === '+' || e.key === '=') zoom(1 / 1.2);
      else if (e.key === '-' || e.key === '_') zoom(1.2);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const current = room.players.find(p => p.plot === selected);
  const built = room.players.filter(p => p.building).length;
  return <section className="world world-3d" aria-label={`Ciudad interactiva en 3D: ${district.label}`}>
    <div className="world-top"><span><span className="live-orb" />{district.label.toUpperCase()}</span><span>{built}/{MAX_PLAYERS} edificios</span></div>
    <div className="world-canvas">
      <Canvas shadows dpr={[1, 1.5]} frameloop={visible ? 'always' : 'never'} camera={{ position: HOME, fov: 30, near: 1, far: 1600 }} onPointerMissed={() => setSelected(null)} aria-hidden>
        <CityWorld room={room} me={me} selected={selected} hovered={hovered} onSelect={select} onHover={setHovered} reduce={reduce} />
        <OrbitControls ref={controls} makeDefault target={TARGET} screenSpacePanning={false} zoomToCursor minDistance={50} maxDistance={400} minPolarAngle={0.45} maxPolarAngle={1.15}
          autoRotate={finished && !reduce} autoRotateSpeed={0.5} onStart={() => { flight.current = null; }} onChange={() => clampTarget(controls.current)} />
        <CameraRig controls={controls} flight={flight} />
      </Canvas>
      <ul className="sr-only" aria-label="Parcelas de la ciudad">{Array.from({ length: MAX_PLAYERS }, (_, i) => { const p = room.players.find(x => x.plot === i); return <li key={i}><button aria-pressed={selected === i} onFocus={() => select(i)} onClick={() => select(i)}>{`Parcela ${i + 1}: ${p ? `${p.name}, ${p.building ? `${p.building}${p.tier >= 2 ? ' nivel 2' : ''}` : `${ROLES[p.role].label}, por construir`}` : 'disponible'}`}</button></li>; })}</ul>
      <div className="world-controls"><span><MousePointer2 size={14} /> Arrastra para girar · clic derecho o Shift para mover · toca una parcela</span><div>
        <button aria-label="Alejar ciudad" onClick={() => zoom(1.2)}><ZoomOut size={17} /></button>
        <button aria-label="Centrar ciudad" onClick={center}><LocateFixed size={17} /></button>
        <button aria-label="Acercar ciudad" onClick={() => zoom(1 / 1.2)}><ZoomIn size={17} /></button>
      </div></div>
    </div>
    <div className="plot-inspector"><PlotInspector selected={selected} current={current} me={me} onKick={onKick} onSelect={select} onWorkshop={onWorkshop} reduce={reduce} /></div>
  </section>;
}

function clampTarget(c: OrbitControlsImpl | null) {
  if (!c) return;
  const t = c.target, x = Math.min(MAX_X, Math.max(MIN_X, t.x)), z = Math.min(MAX_Z, Math.max(MIN_Z, t.z));
  if (x === t.x && z === t.z && t.y === 0) return;
  const shift = new Vector3(x - t.x, -t.y, z - t.z);
  t.add(shift); c.object.position.add(shift);
}
/** Eases the camera toward a pending flight; any user gesture cancels it (OrbitControls onStart). */
function CameraRig({ controls, flight }: { controls: RefObject<OrbitControlsImpl | null>; flight: RefObject<Flight> }) {
  useFrame((_, delta) => {
    const c = controls.current, goal = flight.current;
    if (!c || !goal) return;
    const k = 1 - Math.exp(-delta * 5);
    c.target.lerp(goal.target, k); c.object.position.lerp(goal.position, k); c.update();
    if (c.target.distanceTo(goal.target) < 0.2 && c.object.position.distanceTo(goal.position) < 0.2) flight.current = null;
  });
  return null;
}
