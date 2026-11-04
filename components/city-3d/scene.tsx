'use client';
import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { DISTRICTS, AMBIENT, ROADS, FENCE, PATCHES, RESERVED, modelFor, buildingName } from '@/lib/catalog';
import { MAX_PLAYERS, type Player, type RoomState } from '@/lib/types';
import { Model, Rise, Label, Scatter, WORLD, PLOT, CELL, COLS, ROWS, TILE_SCALE, ROAD_Y, GROUND_Y, PARK, RESERVED_CELL, cellCenter, plotPosition, type Placement } from './models';

const ISLAND = { x: 8, z: 20, width: 250, depth: 204 }, TRACK_Z = -70, R = Math.PI / 2;
const TILE_Y = ROAD_Y - 2 * TILE_SCALE, PLOT_TOP = GROUND_Y + 0.3;

// Road network: every cell on an even row or column; the odd/odd cells are blocks, and the reserved cell joins two of them.
const isRoad = (i: number, j: number) => i >= 0 && i < COLS && j >= 0 && j < ROWS && (i % 2 === 0 || j % 2 === 0) && !(i === RESERVED_CELL[0] && j === RESERVED_CELL[1]);
/** Picks the pack tile and Y rotation for a cell from its open sides (tiles face north = -z before rotating). */
function tileFor(n: boolean, e: boolean, s: boolean, w: boolean): [string, number] {
  const count = +n + +e + +s + +w;
  if (count === 4) return [ROADS.cross, 0];
  if (count === 3) return [ROADS.tee, !e ? 0 : !n ? R : !w ? Math.PI : -R];
  if (count === 2 && n && s) return [ROADS.straight, 0];
  if (count === 2 && e && w) return [ROADS.straight, R];
  if (count === 2) return [ROADS.corner, n && w ? 0 : w && s ? R : s && e ? Math.PI : -R];
  return [ROADS.end, s ? 0 : e ? R : n ? Math.PI : -R];
}
const CITY = (() => {
  const tiles = new Map<string, Placement[]>(), straights: { x: number; z: number; horizontal: boolean }[] = [], crossings: [number, number][] = [];
  const add = (model: string, item: Placement) => tiles.set(model, [...(tiles.get(model) ?? []), item]);
  for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) {
    const [x, z] = cellCenter(i, j);
    if (!isRoad(i, j)) { add(ROADS.grass, { position: [x, TILE_Y, z], scale: TILE_SCALE }); continue; }
    const open = [isRoad(i, j - 1), isRoad(i + 1, j), isRoad(i, j + 1), isRoad(i - 1, j)] as const;
    const [model, rotation] = tileFor(...open);
    add(model, { position: [x, TILE_Y, z], rotation, scale: TILE_SCALE });
    if (model === ROADS.straight) straights.push({ x, z, horizontal: rotation !== 0 });
    if (model === ROADS.cross && i > 0 && i < COLS - 1 && j > 0 && j < ROWS - 1) crossings.push([x, z]);
  }
  return { tiles: [...tiles], straights, crossings };
})();
const DECOR_SPOTS: [number, number][] = [-104, -88, -72, -56, -40, -24, -8, 8, 24, 40, 56, 72, 88, 104].flatMap(x => [[x, -61], [x + 6, 106]] as [number, number][]);
// Trees and benches around the plaza block, like the parks in the pack renders.
const PARK_ITEMS: [string, number, number, number][] = [['city_tree', -13, -13, 0], ['city_tree', 13, -13, 1], ['city_tree', -13, 13, 2], ['city_tree', 13, 13, 3], ['city_tree', 0, -14, 1], ['city_tree', -14, 0, 2], ['city_bench', -10, -4, R], ['city_bench', 10, 4, -R], ['city_bench', 4, 13, Math.PI]];
const GARDEN = [[-1, 1], [1, -1], [1, 1], [-1, -1]];
/** One model, or a cols × rows patch of it (fields), centred on its group. */
function Patch({ model, cols = 1, rows = cols, rotation = 0, fit }: { model: string; cols?: number; rows?: number; rotation?: number; fit?: number }) {
  const step = 5.2 * WORLD;
  if (cols === 1 && rows === 1) return <Model model={model} fit={fit} rotation={[0, rotation, 0]} />;
  return <group rotation={[0, rotation, 0]}>{Array.from({ length: cols * rows }, (_, k) => <Model key={k} model={model} position={[((k % cols) - (cols - 1) / 2) * step, 0, (Math.floor(k / cols) - (rows - 1) / 2) * step]} />)}</group>;
}
type Props = { room: RoomState; me?: Player; selected: number | null; hovered: number | null; onSelect: (plot: number) => void; onHover: (plot: number | null) => void; reduce: boolean };

export default function CityWorld({ room, me, selected, hovered, onSelect, onHover, reduce }: Props) {
  const district = DISTRICTS[room.district];
  const plaza = room.event.completed >= 1, train = room.event.completed >= 2;
  const built = room.players.filter(p => p.building).length;
  const street = useMemo(() => {
    const byModel = new Map<string, Placement[]>();
    const add = (model: string, item: Placement) => byModel.set(model, [...(byModel.get(model) ?? []), item]);
    CITY.straights.forEach(({ x, z, horizontal }, k) => {
      const side = k % 2 ? 1 : -1, along = ((k % 3) - 1) * 5, verge = 6.4;
      add(district.street[k % district.street.length], horizontal ? { position: [x + along, GROUND_Y, z + side * verge], rotation: side > 0 ? Math.PI : 0, scale: WORLD } : { position: [x + side * verge, GROUND_Y, z + along], rotation: side > 0 ? -R : R, scale: WORLD });
    });
    CITY.crossings.forEach(([x, z]) => add(district.corner, { position: [x + 6.4, GROUND_Y, z + 6.4], rotation: Math.PI / 4, scale: WORLD }));
    return [...byModel];
  }, [district]);
  const fences = useMemo(() => {
    // White picket fences around homes, open at the front (+z) so the house has a gate.
    const panels: Placement[][] = FENCE.panels.map(() => []), posts: Placement[] = [], h = PLOT / 2 - 0.3, step = 0.8 * WORLD;
    let n = 0;
    for (const p of room.players) {
      if (p.role !== 'urbanista' || !p.building) continue;
      const [x, z] = plotPosition(p.plot);
      for (let t = -h + step / 2; t < h; t += step) {
        panels[n++ % 3].push({ position: [x + t, PLOT_TOP, z - h], scale: WORLD }, { position: [x - h, PLOT_TOP, z + t], rotation: R, scale: WORLD }, { position: [x + h, PLOT_TOP, z + t], rotation: R, scale: WORLD });
        if (Math.abs(t) > 1.6) panels[n++ % 3].push({ position: [x + t, PLOT_TOP, z + h], scale: WORLD });
      }
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) posts.push({ position: [x + sx * h, PLOT_TOP, z + sz * h], scale: WORLD });
    }
    return { panels, posts };
  }, [room.players]);
  return <>
    <color attach="background" args={[plaza ? '#f6c98f' : '#43cff2']} />
    <hemisphereLight args={['#fffaf0', '#7fa98a', plaza ? 0.75 : 1.15]} />
    <directionalLight position={[110, 160, 70]} intensity={plaza ? 1.4 : 2.1} color={plaza ? '#ffc58f' : '#fff4e0'} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005}
      shadow-camera-left={-150} shadow-camera-right={150} shadow-camera-top={160} shadow-camera-bottom={-160} shadow-camera-far={450} />
    <Island ground={district.ground} />
    <Clouds reduce={reduce} />
    <Suspense fallback={null}>
      {CITY.tiles.map(([model, items]) => <Scatter key={model} model={model} items={items} />)}
    </Suspense>
    {Array.from({ length: MAX_PLAYERS }, (_, index) => <Plot key={index} index={index} player={room.players.find(p => p.plot === index)} mine={me?.plot === index} selected={selected === index} hovered={hovered === index} district={room.district} onSelect={onSelect} onHover={onHover} reduce={reduce} />)}
    <Suspense fallback={null}>
      {street.map(([model, items]) => <Scatter key={model} model={model} items={items} />)}
      {FENCE.panels.map((model, i) => <Scatter key={model} model={model} items={fences.panels[i]} />)}
      <Scatter model={FENCE.post} items={fences.posts} />
      {DECOR_SPOTS.map(([x, z], i) => <Model key={i} model={district.decor[i % district.decor.length]} position={[x, 0.2, z]} rotation={[0, (i % 4) * R, 0]} />)}
      {district.landmarks.map(l => <group key={`${l.model}-${l.at}`} position={[l.at[0], l.at[0] > cellCenter(0, 0)[0] - CELL / 2 ? GROUND_Y : 0.2, l.at[1]]}>
        {l.pond && <mesh position={[0, 0.03, 0]} rotation={[-R, 0, 0]} receiveShadow><circleGeometry args={[l.pond, 40]} /><meshStandardMaterial color="#7fbcc8" /></mesh>}
        <Patch model={l.model} cols={l.grid?.[0] ?? 1} rows={l.grid?.[1] ?? 1} rotation={l.rotation} />
      </group>)}
      <PowerBlock room={room} onSelect={onSelect} reduce={reduce} />
      <Plaza lit={plaza} pigeons={built >= 5} reduce={reduce} />
      <Rail moving={train && !reduce} />
      <Traffic cars={plaza ? 4 : 1} reduce={reduce} />
      {room.district === 'granja' && <Animals reduce={reduce} />}
    </Suspense>
  </>;
}

function Island({ ground }: { ground: string }) {
  const { x, z, width, depth } = ISLAND;
  return <group position={[x, 0, z]}>
    {/* A floating slab like the pack renders: green turf over a band of earth, sky all around. */}
    <mesh position={[0, -3.2, 0]}><boxGeometry args={[width, 6, depth]} /><meshStandardMaterial color="#7b5432" /></mesh>
    <mesh position={[0, 0, 0]} receiveShadow><boxGeometry args={[width, 0.4, depth]} /><meshStandardMaterial color={ground} /></mesh>
  </group>;
}

function Plot({ index, player, mine, selected, hovered, district, onSelect, onHover, reduce }: { index: number; player?: Player; mine: boolean; selected: boolean; hovered: boolean; district: RoomState['district']; onSelect: (plot: number) => void; onHover: (plot: number | null) => void; reduce: boolean }) {
  const [x, z] = plotPosition(index);
  // The reserved role keeps its level-1 building here; its upgrade rises on the reserved block.
  const model = player && modelFor(district, player.role, player.role === RESERVED ? 1 : player.tier);
  const color = selected ? '#f9dc91' : mine ? '#eef0a0' : hovered ? '#b9ea8e' : player ? '#86d059' : '#a3dc78';
  return <group position={[x, 0, z]}>
    <mesh position={[0, GROUND_Y + 0.15, 0]} receiveShadow onClick={e => { e.stopPropagation(); onSelect(index); }} onPointerOver={e => { e.stopPropagation(); onHover(index); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { onHover(null); document.body.style.cursor = ''; }}>
      <boxGeometry args={[PLOT, 0.3, PLOT]} /><meshStandardMaterial color={color} emissive={selected ? '#c58a1c' : '#000'} emissiveIntensity={selected ? 0.6 : 0} />
    </mesh>
    {player?.tier === 2 && <mesh position={[0, GROUND_Y + 0.14, 0]}><boxGeometry args={[PLOT + 0.8, 0.26, PLOT + 0.8]} /><meshStandardMaterial color="#e3b341" /></mesh>}
    {player?.building ? <Suspense fallback={null}><Rise key={`${player.id}-${player.tier}`} reduce={reduce}>
      {/* Real pack size; only buildings wider than the plot (the warehouses) are shrunk to fit. Gardens grow with the level. */}
      <group position={[0, PLOT_TOP, 0]}><Patch model={model!} cols={PATCHES[model!] ?? 1} fit={PLOT} /></group>
      {GARDEN.slice(0, player.tier >= 2 ? 3 : 1).map(([sx, sz], i) => <Model key={i} model={DISTRICTS[district].garden} scale={0.8} position={[sx * 4.8, PLOT_TOP, sz * 4.8]} rotation={[0, i, 0]} />)}
    </Rise></Suspense>
      : player && <group position={[-3.5, PLOT_TOP, -3.5]}><mesh position={[0, 2, 0]} castShadow><cylinderGeometry args={[0.12, 0.12, 4]} /><meshStandardMaterial color="#7a6650" /></mesh><mesh position={[0.9, 3.4, 0]} castShadow><boxGeometry args={[1.8, 1.1, 0.1]} /><meshStandardMaterial color={mine ? '#e9b755' : '#4f8c79'} /></mesh></group>}
    <Label position={[0, PLOT_TOP + 1.2, PLOT / 2 + 0.4]} text={`${mine ? 'TU PARCELA' : String(index + 1).padStart(2, '0')}${player?.bonus ? ` ${'★'.repeat(player.bonus)}` : ''}`} />
  </group>;
}

/** The reserved east block: a building site until an Ingeniero upgrades, then the power plant at real size. */
function PowerBlock({ room, onSelect, reduce }: { room: RoomState; onSelect: (plot: number) => void; reduce: boolean }) {
  const [x, z] = cellCenter(...RESERVED_CELL), district = DISTRICTS[room.district];
  const owners = room.players.filter(p => p.role === RESERVED && p.tier >= 2);
  const name = buildingName(room.district, RESERVED, 2);
  if (!district.roles.includes(RESERVED)) {
    // Districts without the role get a small wood instead.
    const trees = Array.from({ length: 12 }, (_, k) => ({ model: district.decor[k % district.decor.length], at: [((k % 3) - 1) * 9 + (k % 2) * 2, (Math.floor(k / 3) - 1.5) * 14] as const }));
    return <group position={[x, GROUND_Y, z]}>{trees.map(({ model, at }, k) => <Model key={k} model={model} position={[at[0], 0, at[1]]} rotation={[0, k, 0]} />)}</group>;
  }
  const select = owners.length ? () => onSelect(owners[0].plot) : undefined;
  return <group position={[x, 0, z]}>
    <mesh position={[0, GROUND_Y + 0.12, 0]} receiveShadow onClick={select && (e => { e.stopPropagation(); select(); })}>
      <boxGeometry args={[30, 0.24, 52]} /><meshStandardMaterial color={owners.length ? '#9fa79a' : '#c9a66b'} />
    </mesh>
    {owners.length ? <Suspense fallback={null}><Rise key={owners[0].id} reduce={reduce}><group position={[0, GROUND_Y + 0.24, 0]}><Model model={modelFor(room.district, RESERVED, 2)} rotation={[0, Math.PI / 2, 0]} /></group></Rise></Suspense>
      : <Scatter model="city_road_cone" items={[[-13, -24], [13, -24], [-13, 24], [13, 24], [0, -24], [0, 24]].map(([cx, cz]) => ({ position: [cx, GROUND_Y + 0.24, cz] as [number, number, number], scale: WORLD }))} />}
    <Label position={[0, GROUND_Y + (owners.length ? 33 : 2), 0]} text={owners.length ? `${name.toUpperCase()} · ${owners[0].name}${owners.length > 1 ? ` +${owners.length - 1}` : ''}` : `RESERVADA · ${name.toUpperCase()}`} />
  </group>;
}

function Plaza({ lit, pigeons, reduce }: { lit: boolean; pigeons: boolean; reduce: boolean }) {
  const [px, pz] = cellCenter(...PARK);
  // Hedges ring the square except on the west, where the road comes in.
  const hedges = useMemo(() => Array.from({ length: 30 }, (_, k) => R * 0.25 + k * (Math.PI * 1.75) / 29).map(a => ({ position: [Math.cos(a) * 10.6, GROUND_Y, Math.sin(a) * 10.6] as [number, number, number], rotation: -a + R, scale: WORLD })), []);
  return <group position={[px, 0, pz]}>
    <mesh position={[0, GROUND_Y + 0.05, 0]} receiveShadow><cylinderGeometry args={[11.2, 11.2, 0.1, 48]} /><meshStandardMaterial color={lit ? '#f6d470' : '#e7dcc0'} /></mesh>
    <Model model="city_fountain" scale={1.6} position={[0, GROUND_Y + 0.1, 0]} />
    {PARK_ITEMS.map(([model, x, z, rotation], i) => <Model key={i} model={model} position={[x, GROUND_Y, z]} rotation={[0, rotation, 0]} />)}
    <Scatter model="city_hedge" items={hedges} />
    {[[-6.5, -6.5], [6.5, -6.5], [-6.5, 6.5], [6.5, 6.5]].map(([x, z], i) => <group key={i} position={[x, GROUND_Y, z]}>
      <Model model="city_lamp_post" />
      {lit && <><mesh position={[0, 4, 0]}><sphereGeometry args={[0.45]} /><meshStandardMaterial color="#fff2a6" emissive="#ffd860" emissiveIntensity={2} /></mesh><pointLight position={[0, 4.3, 0]} color="#ffd27a" intensity={70} distance={20} /></>}
    </group>)}
    {pigeons && [0, 1, 2, 3, 4, 5].map(i => <Hop key={i} phase={i} reduce={reduce} position={[Math.cos(i) * 5, GROUND_Y + 0.1, Math.sin(i * 1.7) * 5]}><Model model={AMBIENT.pigeons[i % 2]} rotation={[0, i, 0]} /></Hop>)}
  </group>;
}

function Hop({ children, phase, reduce, position }: { children: React.ReactNode; phase: number; reduce: boolean; position: [number, number, number] }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => { if (ref.current && !reduce) ref.current.position.y = position[1] + Math.max(0, Math.sin(clock.elapsedTime * 4 + phase * 2)) * 0.4; });
  return <group ref={ref} position={position}>{children}</group>;
}

const TRACK = Array.from({ length: 11 }, (_, k) => ISLAND.x + (k - 5) * CELL);
function Rail({ moving }: { moving: boolean }) {
  const ref = useRef<Group>(null);
  const [west, east] = [TRACK[1], TRACK[TRACK.length - 2]], span = east - west;
  useFrame((_, delta) => { if (ref.current && moving) ref.current.position.x = ((ref.current.position.x - west + delta * 12) % span) + west; });
  const tracks = useMemo(() => TRACK.slice(1, -1).map(x => ({ position: [x, TILE_Y, 0] as [number, number, number], rotation: R, scale: TILE_SCALE })), []);
  // Station platforms close both ends of the line.
  const ends = useMemo(() => [{ position: [TRACK[0], TILE_Y, 0] as [number, number, number], rotation: -R, scale: TILE_SCALE }, { position: [TRACK[TRACK.length - 1], TILE_Y, 0] as [number, number, number], rotation: R, scale: TILE_SCALE }], []);
  return <group position={[0, 0, TRACK_Z]}>
    <Scatter model="city_train_track" items={tracks} />
    <Scatter model="city_train_track_end" items={ends} />
    <group ref={ref} position={[west + 10, ROAD_Y + 0.3, 0]}><Model model="city_train" rotation={[0, R, 0]} /></group>
  </group>;
}

function Traffic({ cars, reduce }: { cars: number; reduce: boolean }) {
  // One lane per vehicle on the east–west roads; each loops along x. The middle road ends at the reserved block.
  const [west, east, middle] = [cellCenter(0, 0)[0], cellCenter(COLS - 1, 0)[0], cellCenter(RESERVED_CELL[0] - 1, 0)[0]];
  const lanes: { model: string; z: number; dir: 1 | -1; offset: number; from: number; to: number }[] = [
    { model: 'city_school_bus', z: -2 * CELL + 1.35, dir: 1, offset: 0, from: west, to: east }, { model: 'city_car', z: 4 * CELL - 1.35, dir: -1, offset: 40, from: west, to: east },
    { model: 'city_car_blue', z: -1.35, dir: -1, offset: 100, from: west, to: middle }, { model: 'city_car_orange', z: 1.35, dir: 1, offset: 60, from: west, to: middle },
  ];
  return <>{lanes.slice(0, cars).map(lane => <Vehicle key={lane.model} {...lane} reduce={reduce} />)}</>;
}
function Vehicle({ model, z, dir, offset, from, to, reduce }: { model: string; z: number; dir: 1 | -1; offset: number; from: number; to: number; reduce: boolean }) {
  const ref = useRef<Group>(null), span = to - from, at = (u: number) => dir > 0 ? from + (u % span) : to - (u % span);
  useFrame(({ clock }) => { if (ref.current && !reduce) ref.current.position.x = at(clock.elapsedTime * 9 + offset); });
  return <group ref={ref} position={[at(offset), ROAD_Y, z]}><Model model={model} rotation={[0, dir * R, 0]} /></group>;
}

function Animals({ reduce }: { reduce: boolean }) {
  // Small herds of each animal grazing on the south meadow.
  return <>{Array.from({ length: 18 }, (_, k) => <Wander key={k} phase={k} reduce={reduce} origin={[-70 + (k % 6) * 26 + (k % 3) * 3, 0.2, 68 + Math.floor(k / 6) * 3.5]}><Model model={AMBIENT.animals[k % AMBIENT.animals.length]} /></Wander>)}</>;
}
function Wander({ children, phase, reduce, origin }: { children: React.ReactNode; phase: number; reduce: boolean; origin: [number, number, number] }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || reduce) return;
    const t = clock.elapsedTime * 0.25 + phase * 1.3;
    ref.current.position.x = origin[0] + Math.sin(t) * 5; ref.current.rotation.y = Math.cos(t) > 0 ? R : -R;
  });
  return <group ref={ref} position={origin}>{children}</group>;
}

// Behind the island as seen from the default camera (which looks towards -x, -z).
const CLOUDS: [number, number, number, number][] = [[-30, 30, -150, 1.8], [90, 26, -120, 1.4], [-160, 28, 50, 1.5], [-190, 40, -140, 1.3], [150, 34, -20, 1.2], [-110, 36, 150, 1.1]];
/** Puffy low-poly clouds drifting around the island. */
function Clouds({ reduce }: { reduce: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => { if (ref.current && !reduce) ref.current.rotation.y += delta * 0.01; });
  return <group ref={ref}>{CLOUDS.map(([x, y, z, s], i) => <group key={i} position={[x, y, z]} scale={s}>
    {[[0, 0, 0, 9], [-9, -2, 2, 7], [9, -2, -1, 7.5], [4, 4, 1, 6.5], [-4, 3, -2, 6]].map(([cx, cy, cz, r], k) => <mesh key={k} position={[cx, cy, cz]}><icosahedronGeometry args={[r, 1]} /><meshStandardMaterial color="#ffffff" flatShading /></mesh>)}
  </group>)}</group>;
}
