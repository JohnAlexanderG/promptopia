# Promptopia · arquitectura y plan incremental

## Primera vertical
El presentador crea una sala y comparte el código. Hasta 20 jugadores ingresan con nombre y rol; cada uno recibe una parcela permanente. La vista del presentador no ocupa parcela. Una credencial privada en sessionStorage permite reconectar en la misma pestaña sin consumir otra plaza.

Next.js App Router + React + TypeScript + Tailwind 4 para las vistas. Servidor Node personalizado con Socket.IO en el mismo puerto; motor de juego independiente de React. No se necesita API de IA, cuenta ni base de datos.

## Autoridad y sincronización
Room: código, fase, fecha límite, 20 parcelas, jugadores, evento y registro. Player: id, nombre, rol, parcela, conexión, créditos, evaluación y construcción. Las credenciales se guardan separadas del estado público. El servidor calcula puntuación y gasto; el cliente no elige parcela, crédito ni resultado. Operaciones síncronas en un único proceso impiden dobles asignaciones y cobros. Construir y aportar son idempotentes.

Socket.IO confirma acciones y difunde instantáneas completas tras cada cambio. El cliente se suscribe antes de entrar y resincroniza al reconectar. Límite de frecuencia y tamaño de mensajes, misma procedencia y validación runtime. Solo el autor recibe su prompt y feedback.

## Mecánicas
Roles Urbanista, Ingeniero y Ecologista con retos y edificios diferentes. El presentador inicia 30 minutos, abre un evento y cierra la sesión. Rúbrica de cuatro reglas: rol, tarea contextual, restricción y formato. Con 3/4 se desbloquea una construcción que cuesta 10 de los 20 créditos iniciales. Es una evaluación didáctica por reglas, no semántica mediante IA. Cada jugador aporta 5 créditos una vez al evento, con meta de 50. El reloj del servidor determina el fin.

## Operación y límites
Estado volátil: reiniciar borra salas. Un único proceso Node persistente con WebSockets; no desplegar en funciones serverless ni varias réplicas. Para Meet, publicar detrás de HTTPS y compartir la URL. Meet solo transporta audio/pantalla, sin integración API. Código para entrar y credencial privada para administrar. Sin identidad verificada: no usar para evaluación formal. Desconectados conservan plaza; expulsión pendiente. Salas inactivas expiran a las dos horas.

## Plan incremental
1. **Esta entrega:** lobby, tablero sincronizado, credenciales/reconexión, roles, prompt/rúbrica, construcción, créditos, evento manual, reloj y cierre. Pruebas de dominio, 20 plazas concurrentes y transporte real.
2. **Ensayo de charla:** 20 dispositivos, incorporación y expulsión desde host, fases guiadas: 0–5 bienvenida, 5–10 prompts, 10–20 ciudad, 20–25 evento, 25–30 reflexión. Accesibilidad y métricas.
3. **Persistencia/despliegue:** PostgreSQL transaccional, recuperación, expiración persistida, límites por IP y observabilidad. Redis/adaptador compartido si se necesitan réplicas.
4. **Evaluación ampliada:** LLM mediante API del servidor, rúbrica versionada, cola, presupuesto, timeout y respaldo por reglas. Comparación de iteraciones y feedback revisable.
5. **Juego ampliado:** niveles, dependencias, eventos programados, colaboración, historial y exportación.
