const pptxgen = require("pptxgenjs");
const path = require("path");
const { applyTheme } = require("/Users/johnalexanderg/.claude/skills/synced/2dcf02ae-af35-4996-b354-3ac2677fe9cc_7de3ddb5-98e3-4109-b915-53d9bde5d492/pptx/scripts/apply_theme.js");

const IMG = path.join(__dirname, "img");
const OUT = "/Users/johnalexanderg/Documents/Codex/2026-10-30/referenced-chatgpt-conversation-this-is-an/outputs/Presentacion-Prompt-Engineering.pptx";

const THEME = {
  name: "Promptopia",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1B2B24", lt1: "FFFFFF", dk2: "1F4D3A", lt2: "EAF4EE",
    accent1: "2E6B4F", accent2: "E2674F", accent3: "4FA3AB", accent4: "E9B23C",
    accent5: "7A9A8A", accent6: "5B6B63", hlink: "2E6B4F", folHlink: "4FA3AB",
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Prompt Engineering";
const C = pres.SchemeColor;

// ---------- Layouts ----------
pres.defineSlideMaster({
  title: "PORTADA",
  background: { color: HEX.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 1.3, w: 5.2, h: 1.6, fontFace: THEME.headFontFace, fontSize: 40, bold: true, color: C.background1, valign: "bottom", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.5, y: 3.05, w: 5.0, h: 1.0, fontSize: 18, color: C.background2, valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENIDO",
  background: { color: HEX.lt1 },
  slideNumber: { x: 9.1, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: C.accent6, align: "right" },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 9.0, h: 0.8, fontFace: THEME.headFontFace, fontSize: 32, bold: true, color: C.text2, valign: "middle", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CIERRE",
  background: { color: HEX.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.4, w: 9.0, h: 0.8, fontFace: THEME.headFontFace, fontSize: 36, bold: true, color: C.background1, valign: "middle", margin: 0 }, text: "" } },
  ],
});

// ---------- Helpers ----------
const shadow = () => ({ type: "outer", color: "1B2B24", opacity: 0.12, blur: 8, offset: 2, angle: 90 });
function card(slide, x, y, w, h, fill, name) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { type: "none" }, shadow: shadow(), objectName: name });
}
function circleNum(slide, x, y, d, n, fill, txt, name) {
  slide.addText(String(n), { shape: pres.shapes.OVAL, x, y, w: d, h: d, fill: { color: fill }, color: txt, fontSize: Math.round(d * 30), bold: true, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: name });
}

// ---------- 1. Portada ----------
pres.addSection({ title: "Introducción" });
let s = pres.addSlide({ masterName: "PORTADA", sectionTitle: "Introducción" });
s.addText("Prompt Engineering", { placeholder: "title" });
s.addText("Cómo hablarle a la IA para obtener exactamente lo que necesitamos", { placeholder: "body" });
s.addText("Reunión de equipo · Noviembre 2026", { x: 0.5, y: 4.7, w: 5, h: 0.4, fontSize: 12, color: C.accent5, margin: 0, isTextBox: true, objectName: "Fecha" });
s.addImage({ path: path.join(IMG, "ciudad-final.jpg"), x: 5.85, y: 1.15, w: 3.75, h: 3.75 * 390 / 547, shadow: shadow(), altText: "Ciudad construida en Promptopia", objectName: "Imagen ciudad" });
s.addNotes("Bienvenida. Hoy vamos a ver en 15 minutos qué es el prompt engineering, por qué importa y qué podemos construir con él. Al final lo practicamos jugando a Promptopia.");

// ---------- 2. ¿Qué es un prompt? ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Introducción" });
s.addText("¿Qué es un prompt?", { placeholder: "title" });
s.addText([
  { text: "Es la instrucción que le damos a la IA.", options: { bold: true, breakLine: true } },
  { text: "La IA no adivina: responde a lo que le pedimos y a cómo lo pedimos." },
], { x: 0.5, y: 1.35, w: 9, h: 0.9, fontSize: 18, color: C.text1, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true, objectName: "Definición" });
const flow = [["Tu prompt", "Rol, tarea, límites y formato", HEX.lt2, C.text2], ["IA", "ChatGPT, Claude, Gemini…", HEX.accent3, C.background1], ["Resultado", "Correo, informe, tabla, plan…", HEX.accent1, C.background1]];
flow.forEach(([t, d, fill, col], i) => {
  const x = 0.5 + i * 3.15;
  card(s, x, 2.55, 2.7, 1.5, fill, "Paso " + t);
  s.addText([{ text: t, options: { fontSize: 22, bold: true, breakLine: true } }, { text: d, options: { fontSize: 14 } }], { x: x + 0.2, y: 2.55, w: 2.3, h: 1.5, color: col, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: "Texto " + t });
  if (i < 2) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.78, y: 3.1, w: 0.32, h: 0.4, fill: { color: HEX.accent5 }, line: { type: "none" }, objectName: "Flecha " + i });
});
s.addText("Mejor instrucción = mejor resultado, a la primera.", { x: 0.5, y: 4.45, w: 9, h: 0.45, fontSize: 18, italic: true, color: C.accent2, bold: true, margin: 0, isTextBox: true, objectName: "Idea clave" });
s.addNotes("Un prompt es simplemente la instrucción. La calidad del resultado depende casi siempre de la calidad de la instrucción. Prompt engineering es el hábito de escribir instrucciones claras.");

// ---------- 3. La fórmula ----------
pres.addSection({ title: "La fórmula" });
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "La fórmula" });
s.addText("La fórmula de las 4 piezas", { placeholder: "title" });
const pieces = [
  ["Rol", "¿Quién debe ser la IA?", "«Actúa como asesor comercial»", HEX.accent1],
  ["Tarea y contexto", "¿Qué hacer y para quién?", "«Escribe una propuesta para un hotel de 40 habitaciones»", HEX.accent3],
  ["Restricción", "¿Qué límites hay?", "«Máximo 200 palabras, sin tecnicismos»", HEX.accent2],
  ["Formato", "¿Cómo lo quiero recibir?", "«En una tabla con precio y plazo»", HEX.accent4],
];
pieces.forEach(([t, q, ex, col], i) => {
  const x = 0.5 + i * 2.33;
  card(s, x, 1.35, 2.1, 2.95, HEX.lt2, "Tarjeta " + t);
  circleNum(s, x + 0.2, 1.55, 0.55, i + 1, col, HEX.lt1, "Número " + t);
  s.addText(t, { x: x + 0.2, y: 2.2, w: 1.75, h: 0.55, fontSize: 16, valign: "top", bold: true, color: C.text2, margin: 0, isTextBox: true, objectName: "Título " + t });
  s.addText(q, { x: x + 0.2, y: 2.8, w: 1.75, h: 0.45, fontSize: 14, color: C.text1, margin: 0, valign: "top", isTextBox: true, objectName: "Pregunta " + t });
  s.addText(ex, { x: x + 0.2, y: 3.3, w: 1.75, h: 0.95, fontSize: 13, italic: true, color: C.accent6, margin: 0, valign: "top", isTextBox: true, objectName: "Ejemplo " + t });
});
s.addText([
  { text: "Extras que suben el nivel: ", options: { bold: true, color: C.text2 } },
  { text: "audiencia y tono · criterio de éxito o un ejemplo de lo que esperas", options: { color: C.text1 } },
], { x: 0.5, y: 4.55, w: 9, h: 0.45, fontSize: 15, margin: 0, isTextBox: true, objectName: "Extras" });
s.addNotes("Esta es la idea central de la reunión. Cuatro piezas: rol, tarea con contexto, restricción y formato. Si tu prompt tiene las cuatro, el resultado mejora muchísimo. Los extras (tono, audiencia, criterio de éxito) lo pulen.");

// ---------- 4. Antes / Después ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "La fórmula" });
s.addText("Antes y después", { placeholder: "title" });
card(s, 0.5, 1.35, 4.3, 3.2, "FBE6E2", "Tarjeta antes");
s.addText("ANTES · 0 de 4 piezas", { x: 0.75, y: 1.55, w: 3.8, h: 0.4, fontSize: 14, bold: true, color: C.accent2, charSpacing: 1, margin: 0, isTextBox: true, objectName: "Etiqueta antes" });
s.addText("«Quiero algo bonito para la ciudad»", { x: 0.75, y: 2.05, w: 3.8, h: 1.2, fontSize: 22, italic: true, color: C.text1, margin: 0, valign: "top", isTextBox: true, objectName: "Prompt antes" });
s.addText("Resultado: genérico, hay que repetir y corregir.", { x: 0.75, y: 3.75, w: 3.8, h: 0.6, fontSize: 14, color: C.accent6, margin: 0, valign: "top", isTextBox: true, objectName: "Resultado antes" });
s.addShape(pres.shapes.RIGHT_ARROW, { x: 4.88, y: 2.75, w: 0.24, h: 0.4, fill: { color: HEX.accent5 }, line: { type: "none" }, objectName: "Flecha antes-después" });
card(s, 5.2, 1.35, 4.3, 3.2, HEX.lt2, "Tarjeta después");
s.addText("DESPUÉS · 4 de 4 piezas", { x: 5.45, y: 1.55, w: 3.8, h: 0.4, fontSize: 14, bold: true, color: C.accent1, charSpacing: 1, margin: 0, isTextBox: true, objectName: "Etiqueta después" });
s.addText([
  { text: "«Actúa como arquitecta. ", options: { color: C.accent1, bold: true } },
  { text: "Diseña viviendas para 20 habitantes ", options: { color: C.accent3, bold: true } },
  { text: "con un presupuesto máximo de 1000 créditos. ", options: { color: C.accent2, bold: true } },
  { text: "Preséntalo en una tabla con pasos y materiales»", options: { color: "B7861F", bold: true } },
], { x: 5.45, y: 2.05, w: 3.8, h: 1.65, fontSize: 16, margin: 0, valign: "top", isTextBox: true, objectName: "Prompt después" });
s.addText("Resultado: concreto, útil y listo para usar.", { x: 5.45, y: 3.75, w: 3.8, h: 0.6, fontSize: 14, color: C.accent6, margin: 0, valign: "top", isTextBox: true, objectName: "Resultado después" });
s.addText("Colores: rol · tarea y contexto · restricción · formato", { x: 5.2, y: 4.7, w: 4.3, h: 0.35, fontSize: 11, color: C.accent6, margin: 0, isTextBox: true, objectName: "Leyenda" });
s.addNotes("Mismo objetivo, dos prompts. El primero no tiene ninguna pieza; el segundo tiene las cuatro (señaladas por color). Este es exactamente el ejemplo que usa Promptopia: el primero obtiene 0/4 y el segundo 4/4.");

// ---------- 5. Lo que podemos construir ----------
pres.addSection({ title: "Qué podemos construir" });
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Qué podemos construir" });
s.addText("Lo que podemos construir", { placeholder: "title" });
const uses = [
  ["Correos y propuestas", "«Como ejecutivo de cuentas, redacta una propuesta de 150 palabras, tono cercano»", HEX.accent1],
  ["Resúmenes de reuniones", "«Resume estas notas en 5 puntos y una tabla de tareas con responsable»", HEX.accent3],
  ["Contenido para redes", "«Crea 3 posts de Instagram para lanzar el producto X a jóvenes, con hashtags»", HEX.accent2],
  ["Planes de proyecto", "«Arma un plan de 4 semanas con hitos, responsables y riesgos»", HEX.accent4],
  ["Atención al cliente", "«Escribe 10 respuestas a preguntas frecuentes, máximo 2 líneas cada una»", HEX.accent5],
  ["Análisis de datos", "«Analiza estas ventas y dame 3 conclusiones y una tabla por mes»", HEX.accent6],
];
uses.forEach(([t, ex, col], i) => {
  const x = 0.5 + (i % 3) * 3.07, y = 1.3 + Math.floor(i / 3) * 1.95;
  card(s, x, y, 2.86, 1.75, HEX.lt2, "Tarjeta " + t);
  s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.24, w: 0.26, h: 0.26, fill: { color: col }, line: { type: "none" }, objectName: "Punto " + t });
  s.addText(t, { x: x + 0.56, y: y + 0.17, w: 2.15, h: 0.4, fontSize: 16, bold: true, color: C.text2, margin: 0, valign: "middle", isTextBox: true, objectName: "Título " + t });
  s.addText(ex, { x: x + 0.2, y: y + 0.65, w: 2.5, h: 1.0, fontSize: 13, italic: true, color: C.text1, margin: 0, valign: "top", isTextBox: true, objectName: "Ejemplo " + t });
});
s.addNotes("Ejemplos del día a día. Cada tarjeta trae un prompt corto que ya aplica la fórmula. Pregunta al grupo: ¿cuál de estas tareas les quita más tiempo hoy?");

// ---------- 6. Ejemplo completo ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Qué podemos construir" });
s.addText("Ejemplo: de una idea a un entregable", { placeholder: "title" });
card(s, 0.5, 1.3, 4.3, 3.7, HEX.dk2, "Tarjeta prompt");
s.addText("EL PROMPT", { x: 0.75, y: 1.5, w: 3.8, h: 0.35, fontSize: 13, bold: true, color: C.accent4, charSpacing: 1, margin: 0, isTextBox: true, objectName: "Etiqueta prompt" });
s.addText("«Actúa como coordinador de eventos. Organiza un taller interno de 2 horas sobre IA para 20 personas, con presupuesto de 300 USD. Entrégalo como agenda en tabla con hora, actividad y responsable, y una lista de materiales.»", { x: 0.75, y: 1.95, w: 3.8, h: 2.9, fontSize: 16, italic: true, color: C.background1, margin: 0, valign: "top", isTextBox: true, objectName: "Texto prompt" });
s.addShape(pres.shapes.RIGHT_ARROW, { x: 4.88, y: 2.95, w: 0.24, h: 0.4, fill: { color: HEX.accent5 }, line: { type: "none" }, objectName: "Flecha ejemplo" });
s.addText("LO QUE RECIBIMOS", { x: 5.2, y: 1.3, w: 4.3, h: 0.35, fontSize: 13, bold: true, color: C.accent1, charSpacing: 1, margin: 0, isTextBox: true, objectName: "Etiqueta resultado" });
const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.lt1, fill: { color: HEX.accent1 } } });
s.addTable([
  [hdr("Hora"), hdr("Actividad"), hdr("Responsable")],
  ["9:00", "Bienvenida y objetivos", "Líder"],
  ["9:15", "Qué es un buen prompt", "Equipo"],
  ["9:45", "Práctica: Promptopia", "Todos"],
  ["10:30", "Casos de nuestro trabajo", "Equipo"],
  ["10:50", "Cierre y próximos pasos", "Líder"],
], { x: 5.2, y: 1.75, w: 4.3, colW: [0.8, 2.2, 1.3], fontSize: 12, color: HEX.dk1, rowH: 0.36, border: { type: "solid", pt: 0.5, color: "C9DDD1" }, fill: { color: HEX.lt1 }, valign: "middle", objectName: "Tabla resultado" });
s.addText("+ lista de materiales y desglose del presupuesto", { x: 5.2, y: 4.1, w: 4.3, h: 0.4, fontSize: 13, italic: true, color: C.accent6, margin: 0, isTextBox: true, objectName: "Nota resultado" });
s.addNotes("Un caso completo: con un solo prompt bien escrito obtenemos una agenda lista para usar. Fíjense que el prompt pide el formato (tabla) y por eso la respuesta llega ordenada.");

// ---------- 7. Promptopia ----------
pres.addSection({ title: "Práctica" });
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Práctica" });
s.addText("Practiquemos: Promptopia", { placeholder: "title" });
const facts = [
  ["20", "jugadores, cada uno con un rol y una parcela"],
  ["4/4", "piezas en tu prompt para construir tu edificio"],
  ["30", "minutos para levantar juntos una ciudad"],
];
facts.forEach(([n, d], i) => {
  const y = 1.35 + i * 1.15;
  s.addText(n, { x: 0.5, y, w: 1.3, h: 0.9, fontSize: 40, bold: true, color: C.accent2, fontFace: THEME.headFontFace, margin: 0, valign: "middle", isTextBox: true, objectName: "Cifra " + i });
  s.addText(d, { x: 1.9, y, w: 2.6, h: 0.9, fontSize: 16, color: C.text1, margin: 0, valign: "middle", isTextBox: true, objectName: "Detalle " + i });
});
s.addImage({ path: path.join(IMG, "ciudad-final.jpg"), x: 4.85, y: 1.35, w: 4.65, h: 4.65 * 390 / 547, shadow: shadow(), altText: "Isla de las ideas con 20 edificios construidos", objectName: "Imagen ciudad final" });
s.addNotes("Ahora lo practicamos. Promptopia es un juego para 20 personas: cada una recibe un rol y una parcela. Si tu prompt cumple al menos 3 de las 4 piezas, construyes tu edificio. Así se ve la ciudad al terminar.");

// ---------- 8. Cómo se juega ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Práctica" });
s.addText("Cómo se juega", { placeholder: "title" });
s.addImage({ path: path.join(IMG, "taller.jpg"), x: 0.5, y: 1.25, w: 3.85 * 273 / 717, h: 3.85, shadow: shadow(), altText: "Taller del jugador con un prompt evaluado 4/4", objectName: "Imagen taller" });
const steps = [
  ["Entra con el código", "Comparto el código de sala por Meet y entras desde tu navegador."],
  ["Escribe y mejora tu prompt", "Las piezas se encienden al escribir; hay pistas si te atascas."],
  ["Construye tu edificio", "Con 3 o 4 piezas gastas 10 créditos y aparece en la ciudad."],
  ["Misión colectiva", "Todos aportan 5 créditos para iluminar la plaza."],
];
steps.forEach(([t, d], i) => {
  const y = 1.3 + i * 0.95;
  circleNum(s, 2.35, y + 0.05, 0.5, i + 1, HEX.accent1, HEX.lt1, "Paso " + (i + 1));
  s.addText(t, { x: 3.05, y, w: 3.4, h: 0.35, fontSize: 16, bold: true, color: C.text2, margin: 0, isTextBox: true, objectName: "Título paso " + (i + 1) });
  s.addText(d, { x: 3.05, y: y + 0.35, w: 3.4, h: 0.5, fontSize: 13, color: C.text1, margin: 0, valign: "top", isTextBox: true, objectName: "Detalle paso " + (i + 1) });
});
s.addImage({ path: path.join(IMG, "mision.jpg"), x: 6.75, y: 2.2, w: 2.75, h: 2.75 * 217 / 300, shadow: shadow(), altText: "Misión colectiva completada: 50 de 50 créditos", objectName: "Imagen misión" });
s.addText("Meta común", { x: 6.75, y: 1.75, w: 2.75, h: 0.35, fontSize: 14, bold: true, color: C.accent2, margin: 0, isTextBox: true, objectName: "Etiqueta misión" });
s.addNotes("Cuatro pasos. Lo importante es el paso 2: mejorar el prompt hasta que tenga las piezas. Nadie ve el prompt de los demás, solo el edificio. Al final hacemos juntos la misión colectiva.");

// ---------- 9. Cierre ----------
pres.addSection({ title: "Cierre" });
s = pres.addSlide({ masterName: "CIERRE", sectionTitle: "Cierre" });
s.addText("Para llevarse", { placeholder: "title" });
const recap = [["Rol", HEX.accent1], ["Tarea y contexto", HEX.accent3], ["Restricción", HEX.accent2], ["Formato", HEX.accent4]];
recap.forEach(([t, col], i) => {
  const x = 0.5 + i * 2.3;
  circleNum(s, x, 1.45, 0.6, i + 1, col, HEX.lt1, "Recordatorio " + t);
  s.addText(t, { x: x + 0.72, y: 1.45, w: 1.5, h: 0.6, fontSize: 16, bold: true, color: C.background1, margin: 0, valign: "middle", isTextBox: true, objectName: "Texto " + t });
});
s.addText("Próximos pasos", { x: 0.5, y: 2.5, w: 5, h: 0.4, fontSize: 20, bold: true, color: C.accent4, margin: 0, isTextBox: true, objectName: "Título próximos pasos" });
s.addText([
  { text: "Usar la fórmula en una tarea real esta semana", options: { bullet: true, breakLine: true } },
  { text: "Compartir los mejores prompts del equipo", options: { bullet: true, breakLine: true } },
  { text: "Elegir el primer caso para automatizar con IA", options: { bullet: true } },
], { x: 0.5, y: 2.95, w: 5.4, h: 1.5, fontSize: 16, color: C.background1, paraSpaceAfter: 8, margin: 0, valign: "top", isTextBox: true, objectName: "Lista próximos pasos" });
s.addText("¿Preguntas?", { x: 6.2, y: 3.0, w: 3.3, h: 1.0, fontSize: 36, bold: true, italic: true, fontFace: THEME.headFontFace, color: C.background1, align: "right", margin: 0, isTextBox: true, objectName: "Preguntas" });
s.addNotes("Resumen: si recuerdan algo, que sean las cuatro piezas. Proponer los próximos pasos y abrir espacio a preguntas.");

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("OK", OUT);
})();
