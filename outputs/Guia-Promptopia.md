# Promptopia

MVP multijugador para aprender ingeniería de prompts en una charla por Google Meet: 20 jugadores, 20 parcelas y una ciudad compartida. Next.js + TypeScript + Tailwind + Socket.IO. Interfaz en español, sin cuentas ni claves de IA.

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
4. Como Urbanista, prueba: «Actúa como arquitecta. Diseña una biblioteca para 20 habitantes con un presupuesto máximo de 1000 créditos. Presenta la propuesta en una tabla con pasos y materiales». Debe obtener 4/4. Un prompt como «Quiero algo bonito para la ciudad» obtiene 0/4 y no permite construir.
5. Construye por 10 créditos y comprueba el edificio y el saldo en el tablero del presentador.
6. Abre el evento desde el presentador; aporta 5 créditos. La barra se sincroniza; cada jugador aporta una sola vez. Con 10 aportes se ilumina la plaza. Puedes ensayar con 2 personas, pero completar la meta requiere 10.
7. Recarga la pestaña del jugador: conserva parcela, nombre, créditos y evaluación. Desconecta/reconecta su red: se muestra estado de conexión y recupera su identidad sin ocupar otra plaza.
8. Cierra la sesión desde el presentador: los jugadores ya no pueden evaluar, construir ni aportar. El reloj también la cierra a los 30 minutos.
9. Para una prueba de capacidad, llena las 20 plazas antes de iniciar: el ingreso 21 debe fallar. No existe aún expulsión; una plaza desconectada queda reservada. Para cambiar de sala, vuelve al inicio y usa «Cambiar de sala» si tu sesión expiró; abrir una pestaña privada nueva permite una sesión independiente.

## Verificaciones automatizadas

```sh
npm run typecheck
npm test
npm run build
```

Las pruebas cubren asignación única y límite de plazas, permisos, rúbrica, saldos, idempotencia, meta colectiva, cierre y reconexión. La integración abre 20 clientes Socket.IO concurrentes contra un servidor real en un puerto local temporal y verifica difusión entre clientes y protección de credenciales.

## Alcance

Roles: Urbanista/biblioteca, Ingeniero/central solar y Ecologista/jardín. La rúbrica busca cuatro criterios explícitos: rol, tarea contextual, restricción y formato; 3/4 permiten construir. Es una demostración por reglas, no una valoración semántica de la calidad ni una llamada a IA. Cada jugador empieza con 20 créditos; construir cuesta 10 y aportar cuesta 5. El presentador conserva el control de inicio, evento y cierre.

El código permite entrar, no administrar. Las credenciales privadas nunca se difunden a otros usuarios. No hay identidad verificada ni persistencia. El prompt completo y su feedback son privados para cada jugador; el tablero muestra solo resultado y edificio. La vista presentador está pensada para compartir pantalla; no requiere integración con la API de Meet.

Lee `docs/ARCHITECTURE.md` para decisiones, límites y plan incremental. Próximos pasos: ensayo con 20 dispositivos, fases guiadas, recuperación persistente y evaluación mediante IA opcional.

## Ciudad interactiva

La interfaz usa Motion para animaciones de aparición y selección, y Lucide React para iconos y controles. La entrada incluye una isla de demostración: «Construir demo» anima una biblioteca sin modificar ninguna sala. Durante la partida, las 20 parcelas del escenario reflejan el estado del servidor; se seleccionan con clic, toque o teclado (Tab y Enter/Espacio). El inspector muestra propietario, rol, edificio, puntuación y créditos. «Mi taller» lleva al editor del jugador. El zoom cuenta con controles de acercar, alejar y centrar. Las animaciones respetan la preferencia de movimiento reducido del dispositivo.

Tras cambiar el código, vuelve a compilar y reinicia el servidor de producción (`npm run build` y `npm start`). Para revisar otra versión sin detener una sala en curso, usa `PORT=3001 npm start` después de compilar. Las salas de servidores distintos son independientes.
