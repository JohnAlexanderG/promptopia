import type { Evaluation } from './types';
import { ROLES, type Role } from './catalog';

// Pure module: shared by the server (official score) and the client (live preview).
const RULES = [
  { label: 'Define un rol', hint: 'Indica desde qué especialidad debe responder: «Actúa como arquitecta…».', test: (p: string) => p.match(/(actua como|eres una?|asume el (rol|papel) de|imagina que eres|en tu (rol|papel) de|como (experto|experta|especialista) en)\s+((una?|el|la)\s+)?[a-zñ]{3,}/) },
  { label: 'Tarea y contexto', hint: 'Pide diseñar el edificio de tu reto (verbo + edificio) para 20 habitantes.', test: (p: string, role: Role) => /\b(disena|propon|crea|planifica|elabora|define|describe)/.test(p) && /\b(20|veinte)\b/.test(p) ? p.match(ROLES[role].topic) : null },
  { label: 'Restricción concreta', hint: 'Añade un límite con número: «presupuesto máximo de 1000», «en menos de 200 palabras».', test: (p: string) => p.match(/(presupuesto|maximo|limite|no super\w*|sin superar|menos de|como mucho)[^.\n\d]{0,40}\d+/) ?? p.match(/\d+[^.\n\d]{0,25}(como maximo|de presupuesto|como limite)/) },
  { label: 'Formato de salida', hint: 'Pide una tabla, lista, pasos o JSON para poder revisar la respuesta.', test: (p: string) => p.match(/tabla|lista|json|pasos|vinetas|markdown|esquema|\d+ puntos/) },
  { label: 'Audiencia o tono', hint: 'Avanzado: indica para quién es y en qué tono: «para vecinos, en lenguaje sencillo».', advanced: true, test: (p: string) => p.match(/dirigid[oa] a|para (ninos|ninas|jovenes|adultos|mayores|vecinos|familias|estudiantes|personas)|publico|audiencia|tono \w+|lenguaje (sencillo|claro)/) },
  { label: 'Criterio de éxito o ejemplo', hint: 'Avanzado: explica cómo sabrás que es buena o da un ejemplo: «debe incluir al menos…».', advanced: true, test: (p: string) => p.match(/criterios? de exito|sabre que|por ejemplo|un ejemplo|debe incluir|incluye al menos|se considera (buena|exitos)/) },
];
// Fold case and accents one code unit at a time so match indices map back to the original text.
const fold = (text: string) => text.split('').map(c => c.toLowerCase().normalize('NFD')[0] ?? c).join('');
export function evaluate(prompt: string, role: Role): Evaluation {
  const p = fold(prompt);
  const checks = RULES.map(rule => {
    const found = rule.test(p, role);
    return { label: rule.label, hint: rule.hint, passed: !!found, ...(found ? { match: prompt.slice(found.index!, found.index! + found[0].length).trim() } : {}), ...(rule.advanced ? { advanced: true } : {}) };
  });
  return { score: checks.filter(c => c.passed && !c.advanced).length, bonus: checks.filter(c => c.passed && c.advanced).length, checks };
}
