---
theme: default
title: Prompt Engineering
info: Cómo hablarle a la IA para obtener exactamente lo que necesitamos
aspectRatio: 16/9
canvasWidth: 980
colorSchema: light
transition: slide-left
fonts:
  provider: none
exportFilename: Presentacion-Prompt-Engineering
download: /presentacion/Presentacion-Prompt-Engineering.pdf
routerMode: hash
layout: default
class: dark
---

<div class="absolute inset-0 grid grid-cols-[1.15fr_1fr] items-center pl-14 pr-10">
  <div v-motion :initial="{ opacity: 0, y: 24 }" :enter="{ opacity: 1, y: 0, transition: { duration: 700 } }">
    <div class="kicker">Reunión de equipo · Noviembre 2026</div>
    <h1 class="!text-7xl !leading-[0.95] !mb-6">Prompt<br><em class="font-normal" style="color: var(--gold)">Engineering</em></h1>
    <p class="text-lg max-w-[24rem]" style="color: #cfe3d8">Cómo hablarle a la IA para obtener exactamente lo que necesitamos</p>
    <div class="flex gap-2 mt-10">
      <span class="chip" style="background: rgba(255,255,255,.08)"><span class="dot bg-pgreen"></span>Rol</span>
      <span class="chip" style="background: rgba(255,255,255,.08)"><span class="dot bg-pteal"></span>Tarea</span>
      <span class="chip" style="background: rgba(255,255,255,.08)"><span class="dot bg-pcoral"></span>Restricción</span>
      <span class="chip" style="background: rgba(255,255,255,.08)"><span class="dot bg-pgold"></span>Formato</span>
    </div>
  </div>
  <div class="relative" v-motion :initial="{ opacity: 0, x: 40, rotate: 0 }" :enter="{ opacity: 1, x: 0, rotate: 3, transition: { duration: 900, delay: 200 } }">
    <div class="absolute -inset-6 rounded-[28px] rotate-[-6deg]" style="background: linear-gradient(135deg, var(--teal), var(--green)); opacity: .45"></div>
    <img src="/img/ciudad-final.jpg" alt="Ciudad construida en Promptopia" class="photo relative w-full" />
  </div>
</div>

<!--
Bienvenida. Hoy vamos a ver en 15 minutos qué es el prompt engineering, por qué importa y qué podemos construir con él. Al final lo practicamos jugando a Promptopia.
-->

---

<div class="kicker">01 · La base</div>

# ¿Qué es un prompt?

<p class="serif text-[2.1rem] leading-tight font-medium max-w-[46rem] !mt-2" style="color: var(--forest)">Es la <span v-mark="{ at: 1, color: '#E2674F', type: 'underline', strokeWidth: 4 }">instrucción</span> que le damos a la IA.</p>
<p class="text-lg muted mt-2">La IA no adivina: responde a lo que le pedimos y a cómo lo pedimos.</p>

<div class="relative grid grid-cols-3 gap-10 mt-10">
  <div class="absolute left-[12%] right-[12%] top-[1.6rem] border-t-2 border-dashed" style="border-color: var(--sage)"></div>
  <div class="relative text-center" v-click="2">
    <div class="icon-box bg-pgreen !w-13 !h-13 !text-2xl !rounded-full mx-auto ring-6 ring-[#f7f3ea]"><ph-chat-text-bold /></div>
    <div class="font-bold text-lg mt-3">Tu prompt</div>
    <div class="muted text-sm">Rol, tarea, límites y formato</div>
  </div>
  <div class="relative text-center" v-click="3">
    <div class="icon-box bg-pteal !w-13 !h-13 !text-2xl !rounded-full mx-auto ring-6 ring-[#f7f3ea]"><ph-sparkle-bold /></div>
    <div class="font-bold text-lg mt-3">IA</div>
    <div class="muted text-sm">ChatGPT, Claude, Gemini…</div>
  </div>
  <div class="relative text-center" v-click="4">
    <div class="icon-box bg-pcoral !w-13 !h-13 !text-2xl !rounded-full mx-auto ring-6 ring-[#f7f3ea]"><ph-file-text-bold /></div>
    <div class="font-bold text-lg mt-3">Resultado</div>
    <div class="muted text-sm">Correo, informe, tabla, plan…</div>
  </div>
</div>

<div v-click="5" class="absolute bottom-9 left-14 right-14 rounded-2xl px-6 py-3 flex items-center gap-3 text-white" style="background: var(--forest)">
  <ph-lightbulb-filament-duotone class="text-2xl" style="color: var(--gold)" />
  <span class="text-lg font-semibold">Mejor instrucción = mejor resultado, a la primera.</span>
</div>

<!--
Un prompt es simplemente la instrucción. La calidad del resultado depende casi siempre de la calidad de la instrucción. Prompt engineering es el hábito de escribir instrucciones claras.
-->

---

<div class="kicker">02 · La fórmula</div>

# La fórmula de las 4 piezas

<div class="grid grid-cols-4 gap-4">
  <div v-click class="rounded-2xl p-5 text-white flex flex-col min-h-[16.5rem] bg-pgreen">
    <div class="flex justify-between items-start"><span class="serif text-5xl font-semibold opacity-90">1</span><ph-user-circle-duotone class="text-3xl opacity-80" /></div>
    <div class="text-xl font-bold mt-3">Rol</div>
    <div class="opacity-85 text-sm mb-4">¿Quién debe ser la IA?</div>
    <div class="mt-auto rounded-lg px-3 py-2 text-sm italic" style="background: rgba(255,255,255,.14)">«Actúa como asesor comercial»</div>
  </div>
  <div v-click class="rounded-2xl p-5 text-white flex flex-col min-h-[16.5rem] bg-pteal">
    <div class="flex justify-between items-start"><span class="serif text-5xl font-semibold opacity-90">2</span><ph-target-duotone class="text-3xl opacity-80" /></div>
    <div class="text-xl font-bold mt-3">Tarea y contexto</div>
    <div class="opacity-85 text-sm mb-4">¿Qué hacer y para quién?</div>
    <div class="mt-auto rounded-lg px-3 py-2 text-sm italic" style="background: rgba(255,255,255,.14)">«Escribe una propuesta para un hotel de 40 habitaciones»</div>
  </div>
  <div v-click class="rounded-2xl p-5 text-white flex flex-col min-h-[16.5rem] bg-pcoral">
    <div class="flex justify-between items-start"><span class="serif text-5xl font-semibold opacity-90">3</span><ph-ruler-duotone class="text-3xl opacity-80" /></div>
    <div class="text-xl font-bold mt-3">Restricción</div>
    <div class="opacity-85 text-sm mb-4">¿Qué límites hay?</div>
    <div class="mt-auto rounded-lg px-3 py-2 text-sm italic" style="background: rgba(255,255,255,.16)">«Máximo 200 palabras, sin tecnicismos»</div>
  </div>
  <div v-click class="rounded-2xl p-5 flex flex-col min-h-[16.5rem] bg-pgold" style="color: #3d2c06">
    <div class="flex justify-between items-start"><span class="serif text-5xl font-semibold opacity-90">4</span><ph-table-duotone class="text-3xl opacity-80" /></div>
    <div class="text-xl font-bold mt-3">Formato</div>
    <div class="opacity-85 text-sm mb-4">¿Cómo lo quiero recibir?</div>
    <div class="mt-auto rounded-lg px-3 py-2 text-sm italic" style="background: rgba(255,255,255,.35)">«En una tabla con precio y plazo»</div>
  </div>
</div>

<div v-click class="flex items-center gap-3 mt-6 text-sm">
  <span class="font-bold" style="color: var(--forest)">Extras que suben el nivel:</span>
  <span class="chip bg-white border" style="border-color: var(--line)">audiencia y tono</span>
  <span class="chip bg-white border" style="border-color: var(--line)">criterio de éxito o un ejemplo de lo que esperas</span>
</div>

<!--
Esta es la idea central de la reunión. Cuatro piezas: rol, tarea con contexto, restricción y formato. Si tu prompt tiene las cuatro, el resultado mejora muchísimo. Los extras (tono, audiencia, criterio de éxito) lo pulen.
-->

---

<div class="kicker">02 · La fórmula</div>

# Antes y después

<div class="grid grid-cols-[1fr_1.35fr] gap-6 items-stretch">
  <div class="tile flex flex-col !bg-[#f3ece0] !shadow-none min-h-[17rem]">
    <div class="flex justify-between items-center">
      <span class="kicker !mb-0 !text-[#a8402c]">Antes</span>
      <span class="chip text-white bg-pcoral">0 / 4 piezas</span>
    </div>
    <p class="serif italic text-[1.7rem] leading-snug mt-6 flex-1 muted">«Quiero algo bonito para la ciudad»</p>
    <div class="flex items-center gap-2 text-sm muted"><ph-x-circle-duotone class="text-xl tx-coral" />Resultado: genérico, hay que repetir y corregir.</div>
  </div>
  <div v-click class="tile flex flex-col min-h-[17rem]" style="border: 2px solid var(--green)">
    <div class="flex justify-between items-center">
      <span class="kicker !mb-0 tx-green">Después</span>
      <span class="chip text-white bg-pgreen">4 / 4 piezas</span>
    </div>
    <p class="text-[1.2rem] leading-[1.9] mt-5 flex-1 font-medium">«<span class="hl hl-green">Actúa como arquitecta.</span> <span class="hl hl-teal">Diseña viviendas para 36 habitantes</span> <span class="hl hl-coral">con un presupuesto máximo de 1000 créditos.</span> <span class="hl hl-gold">Preséntalo en una tabla con pasos y materiales</span>»</p>
    <div class="flex items-center gap-2 text-sm"><ph-check-circle-duotone class="text-xl tx-green" />Resultado: concreto, útil y listo para usar.</div>
  </div>
</div>

<div v-after class="flex gap-4 mt-5 text-xs muted justify-end">
  <span class="flex items-center gap-1.5"><span class="dot bg-pgreen"></span>rol</span>
  <span class="flex items-center gap-1.5"><span class="dot bg-pteal"></span>tarea y contexto</span>
  <span class="flex items-center gap-1.5"><span class="dot bg-pcoral"></span>restricción</span>
  <span class="flex items-center gap-1.5"><span class="dot bg-pgold"></span>formato</span>
</div>

<!--
Mismo objetivo, dos prompts. El primero no tiene ninguna pieza; el segundo tiene las cuatro (señaladas por color). Este es exactamente el ejemplo que usa Promptopia: el primero obtiene 0/4 y el segundo 4/4.
-->

---

<div class="kicker">03 · En el día a día</div>

# Lo que podemos construir

<div class="grid grid-cols-3 gap-4">
  <div class="tile" v-motion :initial="{ opacity: 0, y: 16 }" :enter="{ opacity: 1, y: 0, transition: { delay: 0 } }">
    <div class="flex items-center gap-3"><span class="icon-box bg-pgreen"><ph-envelope-simple-duotone /></span><b class="text-[1.05rem]" style="color: var(--forest)">Correos y propuestas</b></div>
    <p class="text-sm muted italic mt-3 leading-snug">«Como ejecutivo de cuentas, redacta una propuesta de 150 palabras, tono cercano»</p>
  </div>
  <div class="tile" v-motion :initial="{ opacity: 0, y: 16 }" :enter="{ opacity: 1, y: 0, transition: { delay: 80 } }">
    <div class="flex items-center gap-3"><span class="icon-box bg-pteal"><ph-notebook-duotone /></span><b class="text-[1.05rem]" style="color: var(--forest)">Resúmenes de reuniones</b></div>
    <p class="text-sm muted italic mt-3 leading-snug">«Resume estas notas en 5 puntos y una tabla de tareas con responsable»</p>
  </div>
  <div class="tile" v-motion :initial="{ opacity: 0, y: 16 }" :enter="{ opacity: 1, y: 0, transition: { delay: 160 } }">
    <div class="flex items-center gap-3"><span class="icon-box bg-pcoral"><ph-megaphone-duotone /></span><b class="text-[1.05rem]" style="color: var(--forest)">Contenido para redes</b></div>
    <p class="text-sm muted italic mt-3 leading-snug">«Crea 3 posts de Instagram para lanzar el producto X a jóvenes, con hashtags»</p>
  </div>
  <div class="tile" v-motion :initial="{ opacity: 0, y: 16 }" :enter="{ opacity: 1, y: 0, transition: { delay: 240 } }">
    <div class="flex items-center gap-3"><span class="icon-box bg-pgold"><ph-kanban-duotone /></span><b class="text-[1.05rem]" style="color: var(--forest)">Planes de proyecto</b></div>
    <p class="text-sm muted italic mt-3 leading-snug">«Arma un plan de 4 semanas con hitos, responsables y riesgos»</p>
  </div>
  <div class="tile" v-motion :initial="{ opacity: 0, y: 16 }" :enter="{ opacity: 1, y: 0, transition: { delay: 320 } }">
    <div class="flex items-center gap-3"><span class="icon-box bg-psage"><ph-headset-duotone /></span><b class="text-[1.05rem]" style="color: var(--forest)">Atención al cliente</b></div>
    <p class="text-sm muted italic mt-3 leading-snug">«Escribe 10 respuestas a preguntas frecuentes, máximo 2 líneas cada una»</p>
  </div>
  <div class="tile" v-motion :initial="{ opacity: 0, y: 16 }" :enter="{ opacity: 1, y: 0, transition: { delay: 400 } }">
    <div class="flex items-center gap-3"><span class="icon-box bg-pslate"><ph-chart-bar-duotone /></span><b class="text-[1.05rem]" style="color: var(--forest)">Análisis de datos</b></div>
    <p class="text-sm muted italic mt-3 leading-snug">«Analiza estas ventas y dame 3 conclusiones y una tabla por mes»</p>
  </div>
</div>

<!--
Ejemplos del día a día. Cada tarjeta trae un prompt corto que ya aplica la fórmula. Pregunta al grupo: ¿cuál de estas tareas les quita más tiempo hoy?
-->

---

<div class="kicker">03 · En el día a día</div>

# Ejemplo: de una idea a un entregable

<div class="grid grid-cols-[1fr_1.15fr] gap-6 items-start">
  <div>
    <div class="flex items-center gap-2 mb-2 text-xs font-bold tracking-widest uppercase muted"><span class="icon-box !w-6 !h-6 !text-[0.6rem] !rounded-full" style="background: var(--forest)">Tú</span>El prompt</div>
    <div class="rounded-2xl rounded-tl-sm p-5 text-white text-[1.02rem] leading-relaxed" style="background: var(--forest)">«Actúa como coordinador de eventos. Organiza un taller interno de 2 horas sobre IA para 20 personas, con presupuesto de 300 USD. Entrégalo como agenda en tabla con hora, actividad y responsable, y una lista de materiales.»</div>
  </div>
  <div v-click>
    <div class="flex items-center gap-2 mb-2 text-xs font-bold tracking-widest uppercase muted"><span class="icon-box bg-pteal !w-6 !h-6 !text-sm !rounded-full"><ph-sparkle-fill /></span>Lo que recibimos</div>
    <div class="tile !p-0 overflow-hidden">
      <div class="flex items-center gap-1.5 px-4 py-2 border-b" style="border-color: var(--line); background: #f3ece0"><span class="dot bg-pcoral"></span><span class="dot bg-pgold"></span><span class="dot bg-pgreen"></span><span class="text-xs muted ml-2">Agenda · Taller de IA</span></div>
      <div class="px-4 pt-3 pb-3">
        <table class="agenda">
          <thead><tr><th>Hora</th><th>Actividad</th><th>Responsable</th></tr></thead>
          <tbody>
            <tr><td>9:00</td><td>Bienvenida y objetivos</td><td>Líder</td></tr>
            <tr><td>9:15</td><td>Qué es un buen prompt</td><td>Equipo</td></tr>
            <tr><td>9:45</td><td>Práctica: Promptopia</td><td>Todos</td></tr>
            <tr><td>10:30</td><td>Casos de nuestro trabajo</td><td>Equipo</td></tr>
            <tr><td>10:50</td><td>Cierre y próximos pasos</td><td>Líder</td></tr>
          </tbody>
        </table>
        <p class="italic muted text-xs mt-2.5 flex items-center gap-1.5"><ph-plus-circle-duotone class="tx-teal text-base" />lista de materiales y desglose del presupuesto</p>
      </div>
    </div>
  </div>
</div>

<!--
Un caso completo: con un solo prompt bien escrito obtenemos una agenda lista para usar. Fíjense que el prompt pide el formato (tabla) y por eso la respuesta llega ordenada.
-->

---
class: dark
---

<div class="kicker">04 · Práctica</div>

# Practiquemos: <em class="font-normal" style="color: var(--gold)">Promptopia</em>

<div class="grid grid-cols-[0.95fr_1.05fr] gap-12 items-center mt-6">
  <div class="flex flex-col gap-5">
    <div v-click class="flex items-center gap-4 border-b pb-4" style="border-color: rgba(255,255,255,.12)"><span class="serif text-6xl font-semibold w-28 shrink-0" style="color: var(--gold)">36</span><span class="text-base" style="color:#cfe3d8">jugadores como máximo, cada uno con un rol y una parcela</span></div>
    <div v-click class="flex items-center gap-4 border-b pb-4" style="border-color: rgba(255,255,255,.12)"><span class="serif text-6xl font-semibold w-28 shrink-0" style="color: var(--coral)">4/4</span><span class="text-base" style="color:#cfe3d8">piezas en tu prompt para construir tu edificio</span></div>
    <div v-click class="flex items-center gap-4"><span class="serif text-6xl font-semibold w-28 shrink-0" style="color: #8fd0c9">30</span><span class="text-base" style="color:#cfe3d8">minutos para levantar juntos una ciudad</span></div>
  </div>
  <div class="relative" v-motion :initial="{ opacity: 0, scale: 0.94 }" :enter="{ opacity: 1, scale: 1, transition: { duration: 700 } }">
    <div class="absolute -inset-3 rounded-[24px] rotate-[3deg]" style="background: linear-gradient(135deg, var(--gold), var(--coral)); opacity: .35"></div>
    <img src="/img/ciudad-final.jpg" alt="Isla de las ideas con 20 edificios construidos" class="photo relative w-full -rotate-1" />
  </div>
</div>

<!--
Ahora lo practicamos. Promptopia es un juego para hasta 36 personas: cada una recibe un rol y una parcela. Si tu prompt cumple al menos 3 de las 4 piezas, construyes tu edificio. Así se ve la ciudad al terminar.
-->

---

<div class="kicker">04 · Práctica</div>

# Cómo se juega

<div class="grid grid-cols-[auto_1fr_15rem] gap-8 items-start">
  <img src="/img/taller.jpg" alt="Taller del jugador con un prompt evaluado 4/4" class="photo h-[18rem] -rotate-2 mt-1" />
  <div class="relative flex flex-col gap-6 pt-1">
    <div class="absolute left-[1.25rem] top-6 bottom-6 w-0.5" style="background: var(--line)"></div>
    <div v-click class="relative flex gap-4 items-start"><span class="icon-box bg-pgreen !rounded-full !w-10 !h-10 !text-lg ring-4 ring-[#f7f3ea]"><ph-key-duotone /></span><div><b style="color: var(--forest)">1 · Entra con el código</b><p class="text-sm muted !my-0 leading-snug">Comparto el código de sala por Meet y entras desde tu navegador.</p></div></div>
    <div v-click class="relative flex gap-4 items-start"><span class="icon-box bg-pteal !rounded-full !w-10 !h-10 !text-lg ring-4 ring-[#f7f3ea]"><ph-pencil-simple-line-duotone /></span><div><b style="color: var(--forest)">2 · Escribe y mejora tu prompt</b><p class="text-sm muted !my-0 leading-snug">Las piezas se encienden al escribir; hay pistas si te atascas.</p></div></div>
    <div v-click class="relative flex gap-4 items-start"><span class="icon-box bg-pcoral !rounded-full !w-10 !h-10 !text-lg ring-4 ring-[#f7f3ea]"><ph-buildings-duotone /></span><div><b style="color: var(--forest)">3 · Construye tu edificio</b><p class="text-sm muted !my-0 leading-snug">Con 3 o 4 piezas gastas 10 créditos y aparece en la ciudad.</p></div></div>
    <div v-click class="relative flex gap-4 items-start"><span class="icon-box bg-pgold !rounded-full !w-10 !h-10 !text-lg ring-4 ring-[#f7f3ea]"><ph-users-three-duotone /></span><div><b style="color: var(--forest)">4 · Misión colectiva</b><p class="text-sm muted !my-0 leading-snug">Todos aportan 5 créditos para iluminar la plaza.</p></div></div>
  </div>
  <div v-after class="mt-6">
    <div class="kicker">Meta común</div>
    <img src="/img/mision.jpg" alt="Misión colectiva completada: 50 de 50 créditos" class="photo w-full object-cover object-top rotate-2" style="aspect-ratio: 300 / 180" />
  </div>
</div>

<!--
Cuatro pasos. Lo importante es el paso 2: mejorar el prompt hasta que tenga las piezas. Nadie ve el prompt de los demás, solo el edificio. Al final hacemos juntos la misión colectiva.
-->

---
class: dark
---

<div class="kicker">Cierre</div>

# Para llevarse

<div class="flex items-center gap-3 flex-wrap">
  <span class="chip bg-pgreen text-white !text-base !px-4 !py-2">Rol</span><span class="serif text-2xl opacity-50">+</span>
  <span class="chip bg-pteal text-white !text-base !px-4 !py-2">Tarea y contexto</span><span class="serif text-2xl opacity-50">+</span>
  <span class="chip bg-pcoral text-white !text-base !px-4 !py-2">Restricción</span><span class="serif text-2xl opacity-50">+</span>
  <span class="chip bg-pgold !text-base !px-4 !py-2" style="color:#3d2c06">Formato</span>
</div>

<div class="grid grid-cols-[1.3fr_1fr] gap-8 mt-16 items-end">
  <div>
    <div class="text-sm font-bold tracking-widest uppercase mb-4" style="color: var(--gold)">Próximos pasos</div>
    <div class="flex flex-col gap-3 text-lg">
      <div v-click class="flex items-center gap-3"><ph-check-circle-duotone class="text-2xl shrink-0" style="color: #8fd0c9" />Usar la fórmula en una tarea real esta semana</div>
      <div v-click class="flex items-center gap-3"><ph-check-circle-duotone class="text-2xl shrink-0" style="color: #8fd0c9" />Compartir los mejores prompts del equipo</div>
      <div v-click class="flex items-center gap-3"><ph-check-circle-duotone class="text-2xl shrink-0" style="color: #8fd0c9" />Elegir el primer caso para automatizar con IA</div>
    </div>
  </div>
  <p v-click class="serif italic text-[4.2rem] leading-none text-right font-medium">¿Preguntas?</p>
</div>

<!--
Resumen: si recuerdan algo, que sean las cuatro piezas. Proponer los próximos pasos y abrir espacio a preguntas.
-->
