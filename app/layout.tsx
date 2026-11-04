import type { Metadata } from 'next';
import './globals.css';
import { MAX_PLAYERS } from '@/lib/config';
export const metadata: Metadata = { title: 'Promptopia · Construyamos con ideas', description: `${MAX_PLAYERS} habitantes. Una ciudad. Mejores prompts.` };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
