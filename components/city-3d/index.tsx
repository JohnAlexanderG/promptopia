'use client';
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useReducedMotion } from 'motion/react';
import { ZoomIn, ZoomOut, LocateFixed, MousePointer2 } from 'lucide-react';
import { DISTRICTS, AMBIENT, ROADS, FENCE, modelFor } from '@/lib/catalog';
import { ROLES, MAX_PLAYERS, type Player, type RoomState } from '@/lib/types';
import PlotInspector from '../plot-inspector';
import CityWorld from './scene';
import { url } from './models';

// The camera orbits the middle of the city (between the plot blocks, the plaza and the power-plant block).
const TARGET: [number, number, number] = [24, 0, 26], HOME: [number, number, number] = [TARGET[0] + 185, 170, TARGET[2] + 185];
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
    const offset = c.object.position.clone().sub(c.target).multiplyScalar(factor);
    offset.setLength(Math.min(c.maxDistance, Math.max(c.minDistance, offset.length())));
    c.object.position.copy(c.target).add(offset); c.update();
  }
  function center() { const c = controls.current; if (c) { c.target.set(...TARGET); c.object.position.set(...HOME); c.update(); } setSelected(me?.plot ?? null); }
  const current = room.players.find(p => p.plot === selected);
  const built = room.players.filter(p => p.building).length;
  return <section className="world world-3d" aria-label={`Ciudad interactiva en 3D: ${district.label}`}>
    <div className="world-top"><span><span className="live-orb" />{district.label.toUpperCase()}</span><span>{built}/{MAX_PLAYERS} edificios</span></div>
    <div className="world-canvas">
      <Canvas shadows dpr={[1, 1.5]} frameloop={visible ? 'always' : 'never'} camera={{ position: HOME, fov: 30, near: 1, far: 1600 }} onPointerMissed={() => setSelected(null)} aria-hidden>
        <CityWorld room={room} me={me} selected={selected} hovered={hovered} onSelect={setSelected} onHover={setHovered} reduce={reduce} />
        <OrbitControls ref={controls} makeDefault target={TARGET} enablePan={false} minDistance={50} maxDistance={400} minPolarAngle={0.45} maxPolarAngle={1.15}
          minAzimuthAngle={finished ? -Infinity : 0} maxAzimuthAngle={finished ? Infinity : Math.PI / 2} autoRotate={finished && !reduce} autoRotateSpeed={0.5} />
      </Canvas>
      <ul className="sr-only" aria-label="Parcelas de la ciudad">{Array.from({ length: MAX_PLAYERS }, (_, i) => { const p = room.players.find(x => x.plot === i); return <li key={i}><button aria-pressed={selected === i} onFocus={() => setSelected(i)} onClick={() => setSelected(i)}>{`Parcela ${i + 1}: ${p ? `${p.name}, ${p.building ? `${p.building}${p.tier >= 2 ? ' nivel 2' : ''}` : `${ROLES[p.role].label}, por construir`}` : 'disponible'}`}</button></li>; })}</ul>
      <div className="world-controls"><span><MousePointer2 size={14} /> Arrastra para girar · toca una parcela</span><div>
        <button aria-label="Alejar ciudad" onClick={() => zoom(1.2)}><ZoomOut size={17} /></button>
        <button aria-label="Centrar ciudad" onClick={center}><LocateFixed size={17} /></button>
        <button aria-label="Acercar ciudad" onClick={() => zoom(1 / 1.2)}><ZoomIn size={17} /></button>
      </div></div>
    </div>
    <div className="plot-inspector"><PlotInspector selected={selected} current={current} me={me} onKick={onKick} onSelect={setSelected} onWorkshop={onWorkshop} reduce={reduce} /></div>
  </section>;
}
