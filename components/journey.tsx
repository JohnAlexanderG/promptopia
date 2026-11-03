'use client';
import { PenLine, WandSparkles, Building2, Check, ArrowRight, Users, Flag } from 'lucide-react';
import type { Player, RoomState } from '@/lib/types';
export default function Journey({room,me,host=false}:{room?:RoomState;me?:Player;host?:boolean}) {
 const steps=host ? [{label:'Invita a tu equipo',detail:'Comparte el código de la sala',icon:Users},{label:'Inicia y acompaña',detail:'Cada prompt hace crecer la ciudad',icon:Flag},{label:'Enciende la plaza',detail:'Abre el desafío colectivo',icon:Building2}] : [{label:'Escribe tu idea',detail:'Un rol, un objetivo y un contexto',icon:PenLine},{label:'Mejora tu prompt',detail:'Cumple 3 de los 4 criterios',icon:WandSparkles},{label:'Construye tu lugar',detail:'Usa 10 créditos y mira el cambio',icon:Building2}];
 const active=host ? room?.event.active?2:room?.phase==='playing'?1:0 : me?.building?3:me?.score&&me.score>=3?2:me?.score?1:0;
 return <ol className="journey" aria-label="Cómo se juega">{steps.map((step,i)=><li key={step.label} className={active>i?'step-done':active===i?'step-active':''}><span className="step-icon">{active>i?<Check size={18}/>:<step.icon size={18}/>}</span><div><b><small>0{i+1}</small> {step.label}</b><p>{step.detail}</p></div>{i<2&&<ArrowRight className="step-arrow" size={16}/>}</li>)}</ol>;
}
