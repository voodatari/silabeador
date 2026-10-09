# Historial de cambios

Formato de versión: `AAAA.MM.DD-letra`, igual que el número que llevan los archivos en `index.html`.

## [2026.10.09-x] - 2026-10-09
- El juego ignora el ajuste de Windows «Mostrar animaciones» (`prefers-reduced-motion`) y se muestra siempre como fue diseñado, sin versión alternativa. Esto corrige que los avisos de juego («¡Velocidad luz!», «¡Qué rápido!», «+10») no se vieran en ordenadores con ese ajuste desactivado.

## [2026.10.09-v] - 2026-10-09
- Cortador: todos los botones de corte de una misma palabra tienen el mismo tamaño (el más pequeño que haga falta), para no distraer.

## [2026.10.09-u] - 2026-10-09
- Más separación entre el indicador de paso («Clase · paso 3 de 3») y el enunciado de la pregunta.

## [2026.10.09-t] - 2026-10-09
- Cortador: con ratón, las palabras largas caben en una sola fila de tijeras (cada botón se ajusta a su hueco). Con pantalla táctil se mantienen botones grandes, en dos alturas si hace falta.

## [2026.10.09-s] - 2026-10-09
- Tablero de juego de tamaño constante: no cambia entre dividir, tónica y clasificar, ni entre los pasos de «Todo junto».
- Móvil: los paneles aprovechan todo el alto disponible y reparten su contenido (inicio, modos, configuración, resultados y ranking).

## [2026.10.09-q] - 2026-10-09
- Móvil: la pantalla de dividir es más compacta y el botón «Comprobar» ya no queda cortado por las barras de Safari. «Borrar cortes» y «Comprobar» van en una fila, y si aun así no cabe, la palabra se reduce un poco.

## [2026.10.09-p] - 2026-10-09
- Móvil: las pantallas «¿Qué quieres practicar?» y «Partida terminada» caben sin scroll (actividades en 2×2, estadísticas en una fila, botones en rejilla). Si hiciera falta, se reducen solas hasta un 70 %.

## [2026.10.09-n] - 2026-10-09
- iPhone / Safari: corrige la vista cuando Safari muestra la página en una pantalla virtual más ancha que el teléfono (zoom de página por debajo del 100 %). La escala se compensa y se activan los estilos de móvil con la clase `html.movil`.
- Viewport con `minimum-scale=1` y márgenes para las zonas seguras (muesca y barras del iPhone).
- Los botones de corte usan medidas relativas al tamaño base de la página.

## [2026.10.09-l] - 2026-10-09
- Publicación en GitHub Pages.
- Explicación de errores en dos columnas (por qué | cómo) para que quepa sin scroll; si no cabe, se reduce hasta un 58 %.
- Cortador: al pulsar la tijera, el amarillo sube por la línea de corte con una animación rápida y suave (también con «reducir movimiento» activado), acompañada de un sonido «woosh» generado por código.

## [2026.10.09-e] - 2026-10-09
- Cortador rediseñado según el boceto del profe: cada hueco entre letras es un elemento de la propia palabra, con un botón-tijera debajo y una línea amarilla que sube y corta. La línea queda siempre exactamente entre sus dos letras (desviación medida: 0 px).
- Fondo por defecto: ondas de voz.

## [2026.10.09-a] - 2026-10-09
- Identidad visual propia, distinta de MetriKa: pizarra y tiza, paleta coral / menta / amarillo, tipografías Lilita One (títulos) y Andika (palabras, pensada para lectura infantil).
- Logo «Si·la·be·a·**dor**» con cada sílaba dando un saltito y la tónica resaltada.
- Fondos animados temáticos: letras y sílabas flotando, ondas de voz y golpes de voz.
- Música: la de práctica pasa a ser la antigua de contrarreloj, y la de muerte súbita la antigua de práctica.

## [2026.10.08] - 2026-10-08
Primera versión.
- Cuatro actividades: clasificar (aguda, llana o esdrújula), dividir en sílabas, sílaba tónica y «Todo junto» (las tres seguidas sobre la misma palabra).
- Cuatro modos: contrarreloj (30/60/90/120 s), muerte súbita, supervivencia (3 vidas) y práctica.
- En práctica, cada error se explica: por qué está mal y cómo se hace, paso a paso.
- Tres niveles de dificultad (o mixto), con 2.253, 3.187 y 3.784 palabras. Salen del diccionario de Acentuador, filtradas con una lista de frecuencias del español.
- Silabeo fonético por golpes de voz (ahu-mar, su-bra-yar), validado con las 53.430 palabras del diccionario.
- Opciones: música, efectos, fondo animado, modo ligero y escala fija. Ranking y ajustes guardados en el navegador, sin cuentas ni base de datos.
- Botones de clasificar en el orden esdrújula, llana, aguda.
- Cuenta atrás 3-2-1 desactivada hasta que haya un modo con base de datos.
- La música se reinicia al cambiar de modo, y se repite sin cortes cuando se sirve por http(s).
