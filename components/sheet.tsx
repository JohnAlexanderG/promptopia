'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

/** A panel floating over the full-screen city; Escape or the close button dismisses it. */
export default function Sheet({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open, onClose]);
  return <AnimatePresence>{open && <motion.aside ref={ref} tabIndex={-1} className="sheet" role="dialog" aria-label={title} initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }} transition={{ duration: 0.2 }}>
    <header><b>{title}</b><button className="sheet-close" aria-label={`Cerrar ${title.toLowerCase()}`} onClick={onClose}><X size={18} /></button></header>
    <div className="sheet-body">{children}</div>
  </motion.aside>}</AnimatePresence>;
}
