# Promptopia · ciudad interactiva

Nueva versión disponible en http://localhost:3001 mientras el servidor permanezca abierto. La instancia anterior del puerto 3000 conserva su interfaz en memoria; para actualizarla es necesario reiniciarla. Las salas de ambos servidores son independientes.

## Cambios

- Motion: aparición de edificios, respuesta al pasar por las parcelas, transiciones del inspector y movimiento ambiental. Respeta la preferencia de movimiento reducido.
- Lucide React: controles de zoom, selección, taller y pasos de la experiencia.
- Escenario vectorial isométrico: isla, calles, jardines, bibliotecas, centrales solares, embarcadero, agua y plaza colectiva.
- Demostración interactiva en la entrada; permite construir y repetir sin crear una sala ni gastar créditos reales.
- Parcelas seleccionables mediante clic, toque y teclado. Inspector con propietario, rol, edificio, puntuación y créditos.
- Guía de tres pasos y acceso «Mi taller» para llegar al editor.

## Verificación

Comprobación de tipos y compilación de producción aprobadas. Cinco pruebas del motor aprobadas. Recorrido en navegador contra el puerto 3001: demo/repetición, zoom/centrado, ingreso de jugador, inicio desde presentador, prompt 4/4, construcción de jardín, sincronización e inspección con clic y teclado.

No se repitió el ensayo de 20 participantes en esta revisión visual. El intento de emular una pantalla móvil no cambió el ancho efectivo del navegador; la comprobación visual realizada corresponde a escritorio. Las reglas adaptables están incluidas, pero requieren comprobación en un teléfono real.
