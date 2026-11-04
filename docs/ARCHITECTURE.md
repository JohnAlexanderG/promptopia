# Promptopia · arquitectura y plan incremental

## Primera vertical
El presentador crea una sala y comparte el código. Hasta 36 jugadores ingresan con nombre y rol; cada uno recibe una parcela permanente. La vista del presentador no ocupa parcela. Una credencial privada en sessionStorage permite reconectar en la misma pestaña sin consumir otra plaza.

Next.js App Router + React + TypeScript + Tailwind 4 para las vistas. Servidor Node personalizado con Socket.IO en el mismo puerto; motor de juego independiente de React. No se necesita API de IA, cuenta ni base de datos.

## Autoridad y sincronización
Room: código, fase, fecha límite, 36 parcelas (9 manzanas × 4), jugadores, evento y registro. Player: id, nombre, rol, parcela, conexión, créditos, evaluación y construcción. Las credenciales se guardan separadas del estado público. El servidor calcula puntuación y gasto; el cliente no elige parcela, crédito ni resultado. Operaciones síncronas en un único proceso impiden dobles asignaciones y cobros. Construir y aportar son idempotentes.

Socket.IO confirma acciones y difunde instantáneas completas tras cada cambio. El cliente se suscribe antes de entrar y resincroniza al reconectar. Límite de frecuencia y tamaño de mensajes, misma procedencia y validación runtime. Solo el autor recibe su prompt y feedback.

## Mecánicas
Roles Urbanista, Ingeniero y Ecologista con retos y edificios diferentes. El presentador inicia 30 minutos, abre un evento y cierra la sesión. Rúbrica de cuatro reglas: rol, tarea contextual, restricción y formato. Con 3/4 se desbloquea una construcción que cuesta 10 de los 20 créditos iniciales. Es una evaluación didáctica por reglas, no semántica mediante IA. Eventos sucesivos (plaza, faro): la meta es 5 créditos por habitante en línea con saldo al abrir; un aporte por jugador y misión. Rúbrica en `lib/rubric.ts`, módulo puro compartido por servidor y cliente, con dos criterios avanzados opcionales, pistas por rol e historial privado de intentos. El reloj del servidor determina el fin.

## Operación y límites
Estado volátil: reiniciar borra salas. Un único proceso Node persistente con WebSockets; no desplegar en funciones serverless ni varias réplicas. Para Meet, publicar detrás de HTTPS y compartir la URL. Meet solo transporta audio/pantalla, sin integración API. Código para entrar y credencial privada para administrar. Sin identidad verificada: no usar para evaluación formal. Desconectados conservan plaza; el presentador puede liberarla (revoca la credencial). El host recibe datos agregados de aprendizaje, nunca el texto de los prompts. Salas inactivas expiran a las dos horas.

## Plan incremental
1. **Esta entrega:** lobby, tablero sincronizado, credenciales/reconexión, roles, prompt/rúbrica, construcción, créditos, evento manual, reloj y cierre. Pruebas de dominio, 36 plazas concurrentes y transporte real.
2. **Ensayo de charla:** hecho: expulsión, fases guiadas, +5 min, panel de aprendizaje y resumen. Pendiente: ensayo con 36 dispositivos, incorporación tardía y accesibilidad.
3. **Persistencia/despliegue:** PostgreSQL transaccional, recuperación, expiración persistida, límites por IP y observabilidad. Redis/adaptador compartido si se necesitan réplicas.
4. **Evaluación ampliada:** LLM mediante API del servidor, rúbrica versionada, cola, presupuesto, timeout y respaldo por reglas. Comparación de iteraciones y feedback revisable.
4b. **Ciudad 3D:** hecho: escena React Three Fiber con modelos del pack *Cartoon City Builder* convertidos a GLB (`scripts/fbx2glb.py`), catálogo de 8 roles y 5 distritos en `lib/catalog.ts`, edificios de nivel 2 (acción `upgrade`), distrito elegido por el host (acción `district`, consulta `room:peek` para filtrar roles en el formulario) y decorado vivo según las misiones. Respaldo SVG sin WebGL.
5. **Juego ampliado:** niveles, dependencias, eventos programados, colaboración, historial y exportación.
