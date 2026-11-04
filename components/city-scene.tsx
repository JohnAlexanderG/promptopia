'use client';
import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ZoomIn, ZoomOut, LocateFixed, MousePointer2, Hammer, Sparkles, RotateCcw } from 'lucide-react';
import PlotInspector from './plot-inspector';
import { ROLES, MAX_PLAYERS, type Player, type RoomState, type Role } from '@/lib/types';

function Tree({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}><ellipse cy="5" rx="12" ry="6" fill="#234d4130"/><path d="M0 4V-22" stroke="#85634a" strokeWidth="5"/><circle cy="-24" r="15" fill="#417e62"/><circle cx="-5" cy="-29" r="10" fill="#6cab77"/><circle cx="5" cy="-22" r="9" fill="#548f64"/></g>;
}
function Building({ role }: { role: Role }) {
  if (role === 'ecologista') return <g><path d="M-40 0L0-20 40 0 0 20Z" fill="#50764c"/><path d="M-34-4L-8-17 20-3-6 10Z" fill="#c4d884"/><path d="M-28-5L-7-15M-21 0L0-11M-14 5L7-7" stroke="#7ca15b" strokeWidth="4"/><Tree x={22} y={0} size={1.2}/><Tree x={-25} y={-16} size={.75}/><path d="M-8 4V-15L8-23 20-16V-2L8 5Z" fill="#9bd8d0" stroke="#e4f7dd" strokeWidth="2"/><path d="M-8-15L5-35 20-16 8-10Z" fill="#d4eeda"/></g>;
  if (role === 'ingeniero') return <g><path d="M-38 0L2-20 38 0 0 20Z" fill="#b9cbd1"/><path d="M-29-4V-16M7 13V-1M30 0V-14" stroke="#6b8390" strokeWidth="4"/><path d="M-40-23L1-44 39-23-2-2Z" fill="#3a668a" stroke="#b9e5ef" strokeWidth="2"/><path d="M-27-30L12-9M-14-37L25-16M-27-16L14-37M-14-9L27-30" stroke="#79a8c6" strokeWidth="1.5"/><path d="M24-28V-69" stroke="#dae9db" strokeWidth="4"/><circle cx="24" cy="-69" r="4" fill="#fff2ad"/><path d="M24-69L24-91M24-69L44-57M24-69L4-57" stroke="#fff9e4" strokeWidth="5" strokeLinecap="round"/></g>;
  return <g><path d="M-35-9L0 9 35-9V-48L0-66-35-48Z" fill="#efd7af"/><path d="M0 9L35-9V-48L0-30Z" fill="#c49d7e"/><path d="M-41-47L-4-80 41-48 0-27Z" fill="#cc785f"/><path d="M-4-80L0-50 41-48Z" fill="#aa594e"/><path d="M-41-47L0-27 0-33-41-53Z" fill="#f4b28c"/><path d="M-24-8V-29L-11-22V-1" fill="#477382"/><path d="M9-12V-28L20-34V-18Z" fill="#f9e6a0"/><path d="M25-20V-36L30-39V-23Z" fill="#567e8c"/><path d="M-30-36L-10-26" stroke="#fff1d7" strokeWidth="4"/></g>;
}
/** The island is a GRID × GRID isometric board (MAX_PLAYERS plots); STEP is the half-width of a plot diagonal. */
const GRID = Math.ceil(Math.sqrt(MAX_PLAYERS)), STEP = 52;
const demoPlayers: Player[] = [0, 3, 6, 9, 12, 14, 17].map((plot, i) => ({ id: `demo-${plot}`, plot, name: ['Ana','Bruno','Camila','Diego','Elena','Felipe','Gabriela'][i], role: (['urbanista','ingeniero','ecologista'] as Role[])[i % 3], connected: true, credits: 10, score: 4, bonus: i % 3, attempts: 2, tier: 1, building: 'Ejemplo', contributed: false }));
export default function CityScene({ room, me, preview = false, onKick, onWorkshop }: { room?: RoomState; me?: Player; preview?: boolean; onKick?: (playerId: string) => void; onWorkshop?: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [demoBuilt, setDemoBuilt] = useState(false);
  const reduce = useReducedMotion();
  const players = preview ? [...demoPlayers, ...(demoBuilt ? [{ ...demoPlayers[0], id: 'you', plot: 11, name: 'Tú' }] : [])] : room?.players ?? [];
  const current = players.find(p => p.plot === selected);
  const plaza = (room?.event.completed ?? 0) >= 1, beacon = (room?.event.completed ?? 0) >= 2;
  const activePlot = selected ?? me?.plot;
  return <section className={`world ${preview ? 'world-preview' : ''}`} aria-label={preview ? 'Demostración de la ciudad' : 'Ciudad interactiva'}>
    <div className="world-top"><span><span className="live-orb" />{preview ? 'EXPLORA PROMPTOPIA' : 'ISLA DE LAS IDEAS'}</span><span>{preview ? 'DEMO INTERACTIVA' : `${players.filter(p => p.building).length}/${MAX_PLAYERS} edificios`}</span></div>
    <svg className="world-svg" viewBox="0 0 900 640" aria-label={`Isla con ${MAX_PLAYERS} parcelas seleccionables`}>
      <defs><linearGradient id={preview ? 'sea-demo' : 'sea'} x2="0" y2="1"><stop stopColor="#b5dfe1"/><stop offset="1" stopColor="#7fbdc8"/></linearGradient><pattern id={preview ? 'waves-demo' : 'waves'} width="62" height="42" patternUnits="userSpaceOnUse"><path d="M10 22q10 7 20 0" fill="none" stroke="#e7ffff" strokeWidth="2" opacity=".22"/></pattern><filter id="building-shadow" x="-50%" y="-100%" width="200%" height="250%"><feDropShadow dx="0" dy="5" stdDeviation="3" floodOpacity=".12"/></filter></defs>
      <rect width="900" height="640" fill={`url(#${preview ? 'sea-demo' : 'sea'})`}/><rect width="900" height="640" fill={`url(#${preview ? 'waves-demo' : 'waves'})`}/>
      <motion.g animate={reduce ? {} : { x: [0, 15, 0] }} transition={{duration:12,repeat:Infinity}} opacity=".7"><path d="M75 100q-16-25 7-31 5-30 35-16 24-10 33 16 27 0 20 28Z" fill="white"/><path d="M712 92q-12-21 10-25 8-25 30-13 23-9 27 15 26 0 18 23Z" fill="white"/></motion.g>
      <g transform={`translate(${450-450*zoom} ${320-320*zoom}) scale(${zoom})`}>
        <ellipse cx="456" cy="362" rx="337" ry="180" fill="#3e7f8b" opacity=".16"/>
        <path d="M450 91L835 294 519 499 125 294V322L519 532 835 320V294" fill="#719574"/>
        <path d="M450 91L835 294 519 499 125 294Z" fill="#e8d7ae"/>
        <path d="M450 109L810 295 519 480 150 294Z" fill="#a9c98a"/>
        {Array.from({length:GRID+1},(_,r) => <path key={`r${r}`} d={`M${456-r*STEP} ${150+(r-1)*STEP/2}l${GRID*STEP} ${GRID*STEP/2}`} stroke="#e7ddb9" strokeWidth="10"/>)}
        {Array.from({length:GRID+1},(_,c) => <path key={`c${c}`} d={`M${456+c*STEP} ${150+(c-1)*STEP/2}l-${GRID*STEP} ${GRID*STEP/2}`} stroke="#e7ddb9" strokeWidth="10"/>)}
        {[{x:456,y:116},{x:747,y:293},{x:178,y:290},{x:515,y:454},{x:554,y:433},{x:600,y:412},{x:223,y:316}].map((p,i)=><Tree key={i} {...p} size={i%2 ? .8 : 1.1}/>)}
        {Array.from({length:MAX_PLAYERS}, (_, index) => { const col=index%GRID,row=Math.floor(index/GRID),x=456+(col-row)*STEP,y=150+(col+row)*STEP/2; const player=players.find(p=>p.plot===index); const mine=preview ? index===11 : me?.plot===index; const chosen=activePlot===index; return <g key={index} transform={`translate(${x} ${y}) scale(${STEP/70})`}>
          <motion.g role="button" tabIndex={0} aria-label={`Parcela ${index+1}: ${player ? `${player.name}, ${player.building ? ROLES[player.role].building : 'por construir'}` : 'disponible'}`} aria-pressed={chosen} onClick={()=>setSelected(index)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(index);}}} whileHover={reduce ? {} : { y:-5 }} className="iso-plot">
            <path d="M0-28L55 0 0 28-55 0Z" fill={chosen ? '#f9dc91' : mine ? '#e5e8a1' : player ? '#bbd596' : '#b6cd94'} stroke={chosen ? '#dd9a36' : mine ? '#fff9b7' : '#92b27c'} strokeWidth={mine||chosen ? 3 : 1}/>
            {player?.building ? <motion.g key={`${player.id}-built`} initial={reduce ? false : {opacity:0,y:-28,scale:.6}} animate={{opacity:1,y:0,scale:1}} transition={{type:'spring',stiffness:180,damping:15}} filter="url(#building-shadow)"><Building role={player.role}/></motion.g> : <g><path d="M-24 0L0-12 24 0 0 12Z" fill="none" stroke={player ? '#648357' : '#94af78'} strokeDasharray="4 3"/><path d="M0-8V7M-9-1H9" stroke={mine ? '#557445' : '#91aa76'} strokeWidth="2"/>{player && <g><path d="M-32-2V-33" stroke="#7a6650" strokeWidth="3"/><path d="M-31-33h22l-5 8 5 7h-22Z" fill={mine ? '#e9b755' : '#4f8c79'}/></g>}</g>}
            <text y="24" textAnchor="middle" fontSize="12" fill="#466047" fontWeight="700">{mine ? 'TU PARCELA' : String(index+1).padStart(2,'0')}{player?.bonus ? ` ${'★'.repeat(player.bonus)}` : ''}</text>
          </motion.g>
        </g>; })}
        <g transform="translate(676 377)"><path d="M-44 0L0-22 44 0 0 23Z" fill={plaza ? '#f6d470' : '#dcd4b5'} stroke="#f9ecc8" strokeWidth="3"/><ellipse cy="-1" rx="18" ry="9" fill="#89bfbe"/><path d="M0-2V-37" stroke="#ece8cd" strokeWidth="7"/><circle cy="-39" r="9" fill={plaza ? '#fff2a6' : '#b7d1c6'}/>{plaza && <motion.circle cy="-39" r="18" fill="none" stroke="#fff7bb" animate={reduce ? {} : {r:[14,28],opacity:[1,0]}} transition={{repeat:Infinity,duration:2}}/>}</g>
        <g transform="translate(410 466)"><path d="M-35 0L40 38 75 21 0-17Z" fill="#a88361"/><path d="M-22 7L13-10M-6 15L29-2M10 23L45 6M26 31L61 14" stroke="#c4a180" strokeWidth="2"/></g>
        <g transform="translate(232 432)" aria-label={beacon ? 'Segunda misión lograda' : 'Segunda misión pendiente'}><ellipse rx="30" ry="13" fill="#8d9a8c"/><ellipse cy="-3" rx="24" ry="9" fill="#b3bba8"/><path d="M-10-4L-7-62H7L10-4Z" fill="#f4efe1"/><path d="M-9-22H9M-8-42H8" stroke="#cc785f" strokeWidth="7"/><path d="M-11-62H11L8-74H-8Z" fill="#3a5a52"/><circle cy="-68" r="5" fill={beacon ? '#fff2a6' : '#c9d6cf'}/><path d="M-10-74L0-84 10-74Z" fill="#cc785f"/>{beacon && <motion.path d="M0-68L-70-92V-46Z" fill="#fff7bb" opacity=".45" animate={reduce ? {} : {opacity:[.15,.55,.15]}} transition={{repeat:Infinity,duration:3}}/>}</g>
      </g>
      <motion.g animate={reduce ? {} : {y:[0,-5,0],rotate:[-2,2,-2]}} transition={{duration:5,repeat:Infinity}} style={{transformOrigin:'735px 500px'}}><path d="M703 507h67l-14 13h-38Z" fill="#fff1c8"/><path d="M735 505v-47l-25 39h25" fill="#ef9a76" stroke="#f9ebc8" strokeWidth="2"/></motion.g>
      <text x="80" y="568" fill="#457f89" fontSize="12" letterSpacing="4">BAHÍA DE LAS POSIBILIDADES</text>
    </svg>
    <div className="world-controls"><span><MousePointer2 size={14}/> Toca una parcela para explorar</span><div><button aria-label="Alejar ciudad" disabled={zoom<=.85} onClick={()=>setZoom(z=>Math.max(.85,z-.15))}><ZoomOut size={17}/></button><button aria-label="Centrar ciudad" onClick={()=>{setZoom(1);setSelected(me?.plot??null);}}><LocateFixed size={17}/></button><button aria-label="Acercar ciudad" disabled={zoom>=1.3} onClick={()=>setZoom(z=>Math.min(1.3,z+.15))}><ZoomIn size={17}/></button></div></div>
    <AnimatePresence mode="wait"><motion.div key={`${selected}-${demoBuilt}`} className="plot-inspector" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
      {preview ? <><div className="inspector-icon"><Sparkles size={22}/></div><div><b>{demoBuilt ? '¡Tu primera idea ya tiene un lugar!' : 'Pruébalo: convierte una idea en un edificio'}</b><p>{selected!==null ? `Explorando parcela ${selected+1}. ` : ''}Esta es una demostración; la partida empieza al entrar a una sala.</p></div><button className="button primary" onClick={()=>{setDemoBuilt(v=>!v);setSelected(11);}}>{demoBuilt ? <RotateCcw size={16}/> : <Hammer size={16}/>} {demoBuilt ? 'Repetir' : 'Construir demo'}</button></> : <PlotInspector selected={selected} current={current} me={me} onKick={onKick} onSelect={setSelected} onWorkshop={onWorkshop} reduce={reduce}/>}
    </motion.div></AnimatePresence>
  </section>;
}
