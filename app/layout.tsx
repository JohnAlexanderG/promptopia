import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Promptopia · Construyamos con ideas', description: '20 habitantes. Una ciudad. Mejores prompts.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
