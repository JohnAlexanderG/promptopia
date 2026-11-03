'use client';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, CanvasTexture, Matrix4, Quaternion, SRGBColorSpace, Vector3, type BufferGeometry, type Group, type InstancedMesh, type Material, type Mesh } from 'three';

export const url = (id: string) => `/models/${id}.glb`;
// The city is a 9 × 5 grid of pack road tiles at native size; the odd/odd cells are blocks of 2 × 2 plots, one of them a park.
// The east column (i = 7) is one tall block reserved for the power plant, too big for a plot.
// WORLD is the one scale applied to every pack model, so buildings, cars and props keep the pack's relative sizes.
export const WORLD = 1, TILE_SCALE = WORLD, CELL = 22 * TILE_SCALE, PLOT = 12, COLS = 9, ROWS = 5;
/** Height of the asphalt (tiles are lowered so it sits just above the island) and of the verges/plot ground. */
export const ROAD_Y = 0.25, GROUND_Y = ROAD_Y + 0.43 * TILE_SCALE;
/** Column 3 stays at x = 0, so the plots, plaza and west landmarks keep their coordinates as the city grows east. */
export const cellCenter = (i: number, j: number): [number, number] => [(i - 3) * CELL, (j - (ROWS - 1) / 2) * CELL];
export const BLOCKS: [number, number][] = [[1, 1], [3, 1], [5, 1], [1, 3], [3, 3]], PARK: [number, number] = [5, 3];
/** Cells (7, 1)–(7, 3) merged into one block: the road between them is left out. */
export const RESERVED_CELL: [number, number] = [7, 2];
const SLOTS: [number, number][] = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
export const plotPosition = (index: number): [number, number] => {
  const [x, z] = cellCenter(...BLOCKS[Math.floor(index / 4)]), [sx, sz] = SLOTS[index % 4];
  // The visible block also includes the grass verges of the surrounding road tiles, so plots spread past the block tile.
  return [x + sx * 8, z + sz * 8];
};

/** A converted pack model at WORLD scale (× `scale`). `fit` only shrinks models whose footprint would exceed it. */
export function Model({ model, fit, scale = 1, ...props }: { model: string; fit?: number; scale?: number } & Omit<ThreeElements['group'], 'scale'>) {
  const { scene } = useGLTF(url(model));
  const clone = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse(o => { if ((o as Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return copy;
  }, [scene]);
  const factor = useMemo(() => {
    const base = WORLD * scale;
    if (!fit) return base;
    const size = new Box3().setFromObject(clone).getSize(new Vector3());
    return Math.min(base, fit / Math.max(size.x, size.z));
  }, [clone, fit, scale]);
  return <group {...props}><primitive object={clone} scale={factor} /></group>;
}

/** Springs a building up from the ground the first time it appears. */
export function Rise({ children, reduce }: { children: React.ReactNode; reduce: boolean }) {
  const ref = useRef<Group>(null), velocity = useRef(0);
  useLayoutEffect(() => { if (ref.current) ref.current.scale.setScalar(reduce ? 1 : 0.01); }, [reduce]);
  useFrame((_, delta) => {
    const group = ref.current; if (!group || reduce) return;
    const value = group.scale.x; if (Math.abs(1 - value) < 0.001 && Math.abs(velocity.current) < 0.001) return;
    velocity.current += (1 - value) * 180 * Math.min(delta, 0.05); velocity.current *= 0.82;
    group.scale.setScalar(Math.max(0.01, value + velocity.current * Math.min(delta, 0.05)));
  });
  return <group ref={ref}>{children}</group>;
}

/** A small always-facing text tag drawn into a canvas texture (cheaper than one DOM root per plot). */
export function Label({ text, position }: { text: string; position: [number, number, number] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')!, scale = 4;
    ctx.font = `700 ${9 * scale}px system-ui, sans-serif`;
    const width = Math.ceil(ctx.measureText(text).width + 14 * scale), height = 18 * scale;
    canvas.width = width; canvas.height = height;
    ctx.fillStyle = '#f6fff0dd'; ctx.beginPath(); ctx.roundRect(0, 0, width, height, 6 * scale); ctx.fill();
    ctx.font = `700 ${9 * scale}px system-ui, sans-serif`; ctx.fillStyle = '#466047'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2 + scale);
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace;
    return { map, aspect: width / height };
  }, [text]);
  useEffect(() => () => texture.map.dispose(), [texture]);
  return <sprite position={position} scale={[2.6 * texture.aspect, 2.6, 1]} renderOrder={10}><spriteMaterial map={texture.map} depthTest={false} transparent /></sprite>;
}

export type Placement = { position: [number, number, number]; rotation?: number; scale?: number };
/** Many copies of one model as instanced meshes: one draw call per mesh instead of one per copy. */
export function Scatter({ model, items, shadows = true }: { model: string; items: Placement[]; shadows?: boolean }) {
  const { scene } = useGLTF(url(model));
  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);
    const list: { geometry: BufferGeometry; material: Material | Material[]; matrix: Matrix4 }[] = [];
    scene.traverse(o => { const mesh = o as Mesh; if (mesh.isMesh) list.push({ geometry: mesh.geometry, material: mesh.material, matrix: mesh.matrixWorld.clone() }); });
    return list;
  }, [scene]);
  if (!items.length) return null;
  return <>{parts.map((part, i) => <ScatterPart key={`${i}-${items.length}`} {...part} items={items} shadows={shadows} />)}</>;
}
function ScatterPart({ geometry, material, matrix, items, shadows }: { geometry: BufferGeometry; material: Material | Material[]; matrix: Matrix4; items: Placement[]; shadows: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current; if (!mesh) return;
    const m = new Matrix4(), q = new Quaternion(), up = new Vector3(0, 1, 0), p = new Vector3(), k = new Vector3();
    items.forEach((it, i) => { mesh.setMatrixAt(i, m.compose(p.set(...it.position), q.setFromAxisAngle(up, it.rotation ?? 0), k.setScalar(it.scale ?? 1)).multiply(matrix)); });
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
  }, [items, matrix]);
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={shadows} receiveShadow />;
}
