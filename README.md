# Promptopia

MVP multijugador para aprender ingeniería de prompts en una charla por Google Meet: hasta 36 jugadores, 36 parcelas y una ciudad compartida. Next.js + TypeScript + Tailwind + Socket.IO. Interfaz en español, sin cuentas ni claves de IA.

## Ejecutar

Necesitas Node.js 22.15 o posterior y npm. Desde esta carpeta:

```sh
npm install
npm run dev
```

Abre http://localhost:3000. Si el puerto está ocupado: `PORT=3001 npm run dev`.

Para producción, usa **el servidor incluido**:

```sh
npm run build
npm start
```

No uses `next start`: el servidor incluido también aloja la sincronización. Un único proceso Node persistente, con WebSockets y HTTPS para acceso público; sin funciones serverless. El estado está en memoria: reiniciar el servidor elimina las salas. Comparte el enlace de tu despliegue por Meet. En una red local también puedes entrar por `http://IP-DEL-EQUIPO:3000`; localhost en otro dispositivo apunta a ese otro dispositivo. No se ha publicado ningún servicio con esta entrega.

## Probar en dos ventanas

1. En una pestaña, pulsa **Crear sala de presentador**. Copia la invitación o el código.
2. Abre otra ventana privada (o otro navegador), entra con nombre, código y rol. Cada jugador debe usar una pestaña independiente: su credencial se guarda en `sessionStorage`. Para simular más jugadores usa pestañas nuevas abiertas directamente con la URL, evitando duplicar una pestaña ya conectada (los navegadores pueden copiar su sesión).
3. Confirma que la misma parcela aparece en ambas vistas. El presentador inicia la sesión; no se admiten nuevos ingresos tras iniciar.
4. Como Urbanista, prueba: «Actúa como arquitecta. Diseña viviendas para 20 habitantes con un presupuesto máximo de 1000 créditos. Presenta la propuesta en una tabla con pasos y materiales». Debe obtener 4/4. Un prompt como «Quiero algo bonito para la ciudad» obtiene 0/4 y no permite construir.
5. Construye por 10 créditos y comprueba el edificio y el saldo en el tablero del presentador.
6. Abre el evento desde el presentador; aporta 5 créditos. La meta es 5 créditos por cada habitante en línea con saldo al abrirlo, así que participan todos; cada jugador aporta una vez por misión. Al completar «Iluminemos la plaza» el presentador puede abrir «Encendamos el faro».
7. Recarga la pestaña del jugador: conserva parcela, nombre, créditos y evaluación. Desconecta/reconecta su red: se muestra estado de conexión y recupera su identidad sin ocupar otra plaza.
8. Cierra la sesión desde el presentador: los jugadores ya no pueden evaluar, construir ni aportar. El reloj también la cierra a los 30 minutos.
9. Para una prueba de capacidad, llena las 36 plazas antes de iniciar: el ingreso 37 debe fallar. Una plaza desconectada queda reservada; el presentador puede liberarla desde el inspector de la parcela («Liberar parcela»). Para cambiar de sala, vuelve al inicio y usa «Cambiar de sala» si tu sesión expiró; abrir una pestaña privada nueva permite una sesión independiente.

## Verificaciones automatizadas

```sh
npm run typecheck
npm test
npm run build
```

Las pruebas cubren asignación única y límite de plazas, permisos, rúbrica (sinónimos, anti-trampa, criterios avanzados y pistas), historial, saldos, idempotencia, metas escaladas y misiones sucesivas, fases, +5 minutos, liberar parcela, datos de aprendizaje sin prompts, cierre y reconexión. La integración abre 36 clientes Socket.IO concurrentes contra un servidor real en un puerto local temporal y verifica difusión entre clientes y protección de credenciales.

## Alcance

Roles y edificios: ver «Ciudad 3D» más abajo (12 roles, según el distrito). La rúbrica busca cuatro criterios explícitos: rol, tarea contextual, restricción y formato; 3/4 permiten construir. Es una demostración por reglas, no una valoración semántica de la calidad ni una llamada a IA. Cada jugador empieza con 20 créditos; construir cuesta 10 y aportar cuesta 5. El presentador conserva el control de inicio, evento y cierre.

El código permite entrar, no administrar. Las credenciales privadas nunca se difunden a otros usuarios. No hay identidad verificada ni persistencia. El prompt completo y su feedback son privados para cada jugador; el tablero muestra solo resultado y edificio. La vista presentador está pensada para compartir pantalla; no requiere integración con la API de Meet.

## Aprendizaje y herramientas del presentador

- **Taller del jugador:** chips que se encienden mientras escribe (vista previa local; la puntuación oficial es la del servidor), fragmento detectado por criterio, historial privado de hasta 10 intentos con «Recuperar» y tres pistas que se desbloquean tras 1, 2 y 3 intentos (pregunta guía, plantilla, ejemplo antes/después).
- **Criterios avanzados:** audiencia/tono y criterio de éxito/ejemplo. No bloquean la construcción; dan estrellas visibles en la parcela. Tras construir se puede seguir mejorando el prompt para ganarlas.
- **Presentador:** fases guiadas con banner para todos, +5 minutos (máximo 60 en total), liberar parcela, panel «Aprendizaje en vivo» (cumplimiento por criterio, media primer → último intento, jugadores atascados: ≥3 intentos y <3/4; nunca ve los prompts) y resumen final para copiar o descargar en Markdown.

## Ciudad 3D (pack «Cartoon City Builder»)

La partida se ve en 3D con Three.js / React Three Fiber y los modelos low-poly del pack *Cartoon City Builder* de Other Ocean (Cubebrush, licencia básica). El botón 3D/2D cambia de vista; si el navegador no tiene WebGL o falla un modelo, se usa la isla SVG. La entrada mantiene la demo 2D, más ligera.

- **Modelos:** los originales viven en `assets-source/` (ignorado por git, nunca en `public/`). `npm run assets` (requiere Blender 4.2+) los convierte a `public/models/*.glb`: reenlaza texturas, las reduce a 512 px WebP y centra la base. Se usan los 94 modelos del pack (96 GLB con dos coches recoloreados), unos 4 MB en total; una prueba falla si alguno queda sin usar. **Revisa la licencia antes de publicar el despliegue o el repositorio:** los `.glb` se descargan al navegador.
- **Catálogo** (`lib/catalog.ts`): 12 roles (Urbanista, Ingeniero, Ecologista, Barista, Cocinero, Veterinaria, Movilidad, Hotelera, Comerciante, Peluquera, Empresaria, Fabricante), cada uno con reto, rúbrica de tema, pistas y dos niveles de edificio.
- **Distritos:** Centro, Little Tokyo, Barrio parisino, Granja e Industrial. El presentador lo elige en el lobby antes de que entre nadie; cambia los roles disponibles, algunos edificios y la decoración.
- **Nivel 2:** con 4/4 y al menos una estrella en el mismo prompt, el jugador mejora su edificio sin coste («Mejorar a…»). La parcela muestra un borde dorado.
- **Escala real y manzanas:** todos los modelos del pack se dibujan a una única escala, así que cada uno conserva su tamaño relativo (casas, hoteles, fábricas, coches y farolas como en los renders del pack). La ciudad es una cuadrícula de 9 × 7 losetas de carretera: nueve manzanas con 2 × 2 parcelas, una con la plaza y una manzana alargada al este reservada para la central eléctrica (48 m), que aparece a tamaño real cuando el primer Ingeniero mejora a nivel 2; hasta entonces es un solar con conos. En su parcela el Ingeniero conserva el edificio de nivel 1 con el borde dorado. En distritos sin Ingeniero esa manzana es un bosque. Solo se reducen los almacenes, que no caben en una parcela. Aceras con mobiliario según el distrito, semáforos o faroles en los cruces, vallas blancas en las viviendas y árboles en los jardines. La isla flota sobre un cielo cian con nubes, como en los renders.
- **Pantalla completa:** durante la partida la ciudad ocupa toda la pantalla; arriba quedan la sala, el tiempo y la fase, y abajo una barra abre como paneles flotantes «Mi taller» o «Mesa del presentador», «Misión», «Actividad» y «Cómo se juega» (Esc o ✕ para cerrar).
- **Monumentos:** calle comercial (Centro), torii y puente sobre un estanque (Little Tokyo), mercado y barbería (París), campos y silo (Granja), fábrica, torre de refrigeración y chimenea (Industrial).
- **Ciudad viva:** palomas desde 5 edificios; la misión 1 enciende las farolas de la plaza, trae el atardecer y llena las calles de coches; la misión 2 pone en marcha el tren. En la Granja pasean los animales. Al cerrar, la cámara orbita para la foto final.
- **Navegación 3D:** arrastrar gira 360°; clic derecho, Shift + arrastrar o dos dedos desplazan (sin salir de la ciudad); la rueda o el pellizco acercan hacia el cursor; las flechas desplazan y + / − acercan o alejan. Al tocar una parcela la cámara se desliza hasta ella; «Centrar» vuelve a la vista general.
- **Accesibilidad:** las 36 parcelas tienen botones accesibles por teclado y lector de pantalla; las animaciones respetan el movimiento reducido y el lienzo se pausa con la pestaña oculta.

Lee `docs/ARCHITECTURE.md` para decisiones, límites y plan incremental. Próximos pasos: ensayo con 36 dispositivos, fases guiadas, recuperación persistente y evaluación mediante IA opcional.

## Ciudad interactiva

La interfaz usa Motion para animaciones de aparición y selección, y Lucide React para iconos y controles. La entrada incluye una isla de demostración: «Construir demo» anima una biblioteca sin modificar ninguna sala. Durante la partida, las 36 parcelas del escenario reflejan el estado del servidor; se seleccionan con clic, toque o teclado (Tab y Enter/Espacio). El inspector muestra propietario, rol, edificio, puntuación y créditos. «Mi taller» lleva al editor del jugador. El zoom cuenta con controles de acercar, alejar y centrar. Las animaciones respetan la preferencia de movimiento reducido del dispositivo.

Tras cambiar el código, vuelve a compilar y reinicia el servidor de producción (`npm run build` y `npm start`). Para revisar otra versión sin detener una sala en curso, usa `PORT=3001 npm start` después de compilar. Las salas de servidores distintos son independientes.
