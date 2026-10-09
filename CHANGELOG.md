# Historial de cambios

Historial completo desde que empezó el proyecto (8 de octubre de 2026), no solo desde que se publicó en GitHub.

Formato de versión: `AAAA.MM.DD-letra`, igual que el número que llevan los archivos en `index.html`; desde la 2.0, número de versión (2.0, 2.0.1, 2.1…). Las fechas son las reales: algunas versiones de la primera tarde llevan «2026.10.09» en el nombre pero se hicieron el 8.

## [2.1.6] - 2026-10-10
- El nombre es opcional: si no se escribe, se juega como «Anónimo» (también en el ranking). Ese nombre no se guarda, así que la próxima vez el campo aparece vacío.

## [2.1.5] - 2026-10-10
- Las ventanas de opciones y de cambiar el nombre se cierran con animación (la inversa a la de abrir), en vez de desaparecer de golpe.

## [2.1.4] - 2026-10-10
- Resultados (iPhone): la lista «Para repasar» queda centrada: a la misma distancia del texto de arriba y del de abajo, y cada palabra centrada dentro de su etiqueta.

## [2.1.3] - 2026-10-10
- Fuera de la lista los extranjerismos poco comunes o cuya separación en sílabas puede generar dudas: pizza, pizzería, zoo, ferry, curry, gamma, kappa, ballet, debut, boutique, rouge, beige y amateur; y un nombre propio que se había colado. Se quedan los de uso común y separación clara (robot, kilo, karaoke, búnker, cómic, chalet, carnet, currículum, déficit, álbum…).

## [2.1.2] - 2026-10-10
- Voz: una sílaba que es solo una vocal con tilde (la «é» de «a-é-re-o») ya no se lee «e acentuada»: se dice la vocal. Lo mismo en frases como «Lleva tilde en la sílaba: é».
- Fuera de la lista los anglicismos que conservan la forma inglesa (scooter, casting, camping, marketing, software, hockey, hobby, ketchup, iceberg, internet…) y nombres ingleses usados como palabra (newton, kelvin…): 26 palabras. Se quedan los adaptados al español (fútbol, líder, estrés, póster…).

## [2.1.1] - 2026-10-10
- Explicación animada: los botones (anterior, pausa / seguir, repetir, siguiente y saltar) usan iconos propios al estilo de los controles de reproducción de Windows 11, en vez de emojis (◀ ⏸ ↻ ▶ ⏭), que se veían mal sobre todo en iPhone. También la flecha de «¡Entendido! Siguiente».
- El resultado final (AGUDA / LLANA / ESDRÚJULA) es más grande y ocupa una franja propia, centrada entre las sílabas y el texto de abajo (en móvil quedaba arriba con mucho hueco debajo). En pantallas bajas la franja es más pequeña para no encoger el resto.

## [2.1] - 2026-10-09
- **Nivel 4 (🔥)**: solo palabras difíciles, sacadas de los niveles 1-3: con hiato (35 %), con diptongo o triptongo (35 %) y con grupos de consonantes complicados (30 %: examen, corrección, instante, transporte…). Puntuación ×2,5. El modo Mixto sigue mezclando los niveles 1-3.
- «Todo junto»: después de explicar un fallo en la sílaba tónica ya no se pregunta la clase de esa palabra (la explicación acaba de decirla): se pasa a la palabra siguiente. Nunca se vuelve a preguntar algo que una explicación acaba de contar.
- Móvil (iPhone): la explicación animada ya no se ve cortada por los lados. El ajuste de tamaño mide con las posiciones reales de cada elemento (en Safari la medida anterior fallaba) y se repite cuando la ventana ya está abierta.

## [2.0.8] - 2026-10-09
- iPhone / Safari (sin modo ligero): durante las transiciones entre menús las tarjetas ya no pierden el efecto de cristal (desenfoque) ni dejan ver la pantalla anterior a través. Safari apaga el desenfoque si se anima la opacidad de la pantalla que lo contiene; ahora se animan las propias tarjetas.

## [2.0.7] - 2026-10-09
- Móvil: al final de la explicación de tónica o clasificar ya no se corta nada (las píldoras de arriba, las etiquetas «antepenúltima / penúltima / última» y la insignia «ESDRÚJULA»). El tamaño se calcula con ese contenido final, y sílabas y píldoras van siempre en una fila: si no caben, se reduce todo un poco.

## [2.0.6] - 2026-10-09
- Se quita el botón 🔊 para repetir la palabra: no aportaba nada (la palabra ya se dice sola al aparecer).

## [2.0.5] - 2026-10-09
- Si un fallo termina la partida (muerte súbita, o la última vida en supervivencia), durante su explicación ya suena la música de «partida terminada», que sigue sin cortes en la pantalla de resultados.

## [2.0.4] - 2026-10-09
- **La voz carga más rápido y gasta mucha menos red.**
  - El fonemizador solo lleva el español (y el inglés, que usa con algunas palabras extranjeras): sus datos pasan de 18,1 MB a 0,95 MB. Comprobado con 419 textos: fonemas idénticos.
  - La voz se guarda en el dispositivo la primera vez (almacén del navegador): las siguientes visitas no la vuelven a descargar (solo ~0,2 MB) y funciona aunque no haya conexión. La web pide al navegador que no la borre si le falta espacio.
  - Primera visita: ~74 MB de descarga real (antes ~83 MB). Visitas siguientes: casi nada.

## [2.0.3] - 2026-10-09
- Fondo animado por defecto: «Letras» (letras y sílabas flotando). Quien ya hubiera elegido otro en Opciones lo conserva.

## [2.0.2] - 2026-10-09
- Logo: el triángulo de la sílaba tónica queda exactamente bajo la «o» de «dor».
- Botón de opciones: la rueda es un icono propio (SVG) en vez del emoji ⚙️, que en iOS no quedaba centrado en su círculo.

## [2.0.1] - 2026-10-09
- «Explicar los fallos» pasa a estar en **Siempre** por defecto: también en contrarreloj, muerte súbita y supervivencia se explica cada fallo (con el juego y el reloj en pausa). Quien ya lo hubiera cambiado en Opciones conserva su elección.

## [2.0] - 2026-10-09
Versión 2: el juego habla. Sustituye a la versión 1 publicada (que queda guardada en las copias de seguridad del proyecto).
- **Voz sintética en el propio dispositivo** (Piper, voz «Sharvard» en español de España), sin servidores ni conexión una vez cargada. Se descarga una vez al entrar (~105 MB: modelo de voz, fonemizador y motor ONNX) y queda en memoria; mientras tanto el juego funciona sin voz.
- **Pronuncia cada palabra nueva** (y el botón 🔊 la repite). La palabra se genera dentro de la frase «Esta era la palabra: …» y se recorta exactamente donde empieza, para que suene con entonación natural.
- **Explicación animada y narrada** al fallar: infografía paso a paso (dividir, buscar la tónica, contar desde el final…), con las sílabas dichas una a una, la tónica más lenta y algo más aguda, y controles ◀ ⏸ ↻ ▶. Si se desactiva, se muestra la explicación escrita de siempre.
- **«Explicar los fallos»** en Opciones: No · En práctica (por defecto) · Siempre. En «Siempre», en contrarreloj, muerte súbita y supervivencia el juego se pausa por completo (también el reloj) mientras se explica.
- La música baja con un fundido mientras habla la voz y vuelve después.
- Explicaciones revisadas: más claras («la «c» se junta con la vocal de detrás: «cil»», «la «s» no tiene vocal detrás y se queda en la sílaba de delante»), solo el dígrafo que se ha separado, letras dichas por su nombre («la letra ene»), y sin reglas de acentuación (terminaciones en n, s o vocal).
- Silabeo: «hu» + vocal empieza sílaba también tras vocal débil (chi-hua-hua).
- Resultados: «Otra actividad», «Ranking» y «Menú principal» (se quita «Otro modo», que repetía el menú).
- La primera palabra de cada partida se prepara mientras se configura: suena al instante.
- Cinta «v2.0» en el menú principal.

## [2.0-pruebas] - 2026-10-09
Cómo se llegó a la 2.0: se desarrolló en una copia aparte del juego («Silabeador 2», solo en local) y se fue probando de oído. En orden:
- **Arranque.** Piper (síntesis de voz local, de baja latencia) dentro del navegador, en un Web Worker con WebAssembly. Dos usos: decir cada palabra nueva y narrar una explicación animada al fallar en práctica, con un interruptor en Opciones. Todo se carga una vez al entrar y queda en memoria.
- **Voz única: Sharvard, mujer** (se probaron otras voces y se quitaron).
- **Música y voz sin pisarse:** la voz espera a que la música termine de bajar y la música no vuelve hasta que la voz acaba; fundidos más rápidos.
- **Ritmo de las explicaciones:** más pausas entre frases, entre pasos y en las enumeraciones; animación de cómo se divide de verdad («Pero se divide así»); no se pronuncia la división equivocada del alumno; volumen más alto; palabras un poco más lentas.
- **Controles de la explicación:** atrás / adelante (al usarlos deja de avanzar sola), pausa y repetir; ventana de tamaño fijo y sin cortes.
- **Opciones:** interruptor de «Pronunciar las palabras» y botón de opciones disponible en todos los menús (no durante la partida). Ventana de opciones sin scroll.
- **Sílabas dichas una a una:** se probó alargar las vocales en una sola tirada («neeegliiigeeente») y sonaba peor; se quedó la lectura con guion («di-», «ri-», «gen-», «te-»). Se ajustó la velocidad varias veces (primero más rápida, luego bastante más lenta), duración mínima para que no salgan cortísimas y la tónica más lenta, más fuerte y luego tres cuartos de tono más aguda.
- **Pronunciación de palabras sueltas.** Errores detectados de oído y corregidos: «traquea» (a final que sonaba e), «fortalecer» y «fisiología» (tónica equivocada: el juego pone la suya), «terrícola» → «tericola» y «capó» → «cápo» (la palabra sola suena peor que dentro de una frase), «complicidad», «proveniente», «observatorio», «ahogo», «genuino» (jota), «tapiz», «campiña», «contrarrestar» (r fuerte), «hostal», «hospitalidad».
- **La técnica definitiva para las palabras.** Se probaron varias frases portadoras («la, X», «esta es la palabra, "X", la», «Vamos a dividir la palabra X por sílabas»…) con cortes por energía, alargamientos artificiales del final y de la r, que metían artefactos o cortaban el final. Se sustituyó todo por la receta del profe: sintetizar **«Esta era la palabra: X»** y cortar justo donde termina «palabra», sin tocar el final. Para cortar exacto, el modelo de voz se amplió con una salida que da la duración de cada sonido.
- **Textos que se dicen:** letras por su nombre y con artículo («la letra ene», «la vocal i, y la vocal o»), sin huecos raros tras «Lleva tilde en la sílaba:», dígrafos explicados solo cuando tocan, explicación de «dó-cil» reescrita, repaso completo de todas las explicaciones (con y sin voz) y fuera las reglas de acentuación (terminaciones en n, s o vocal).
- **Clasificar y tónica:** el paso 1 ya no silabea en voz alta (se hace en el paso 2); las sílabas aparecen mientras se habla.
- **Otros:** retraso de la primera palabra eliminado, cinta «v2.0» (primero en la esquina de la ventana, luego en la tarjeta del menú principal, por encima de su borde), «Otro modo» fuera de resultados y selector «Explicar los fallos» (No · En práctica · Siempre).

## [2026.10.09-x] - 2026-10-09
- El juego ignora el ajuste de Windows «Mostrar animaciones» (`prefers-reduced-motion`) y se muestra siempre como fue diseñado, sin versión alternativa. Esto corrige que los avisos de juego («¡Velocidad luz!», «¡Qué rápido!», «+10») no se vieran en ordenadores con ese ajuste desactivado.

## [2026.10.09-v] - 2026-10-08
- Cortador: todos los botones de corte de una misma palabra tienen el mismo tamaño (el más pequeño que haga falta), para no distraer.
- Documentación del proyecto en GitHub (README) y este historial de cambios.

## [2026.10.09-u] - 2026-10-08
- Más separación entre el indicador de paso («Clase · paso 3 de 3») y el enunciado de la pregunta.

## [2026.10.09-t] - 2026-10-08
- Cortador: con ratón, las palabras largas caben en una sola fila de tijeras (cada botón se ajusta a su hueco). Con pantalla táctil se mantienen botones grandes, en dos alturas si hace falta.

## [2026.10.09-s] - 2026-10-08
- Tablero de juego de tamaño constante: no cambia entre dividir, tónica y clasificar, ni entre los pasos de «Todo junto».
- Móvil: los paneles aprovechan todo el alto disponible y reparten su contenido (inicio, modos, configuración, resultados y ranking).

## [2026.10.09-q] - 2026-10-08
- Móvil: la pantalla de dividir es más compacta y el botón «Comprobar» ya no queda cortado por las barras de Safari. «Borrar cortes» y «Comprobar» van en una fila, y si aun así no cabe, la palabra se reduce un poco.

## [2026.10.09-p] - 2026-10-08
- iPhone: la barra de Safari ya no tapa el botón «¡Empezar!».
- Móvil: las pantallas «¿Qué quieres practicar?» y «Partida terminada» caben sin scroll (actividades en 2×2, estadísticas en una fila, botones en rejilla). Si hiciera falta, se reducen solas hasta un 70 %.

## [2026.10.09-n] - 2026-10-08
- iPhone / Safari: corrige la vista cuando Safari muestra la página en una pantalla virtual más ancha que el teléfono (zoom de página por debajo del 100 %). La escala se compensa y se activan los estilos de móvil con la clase `html.movil`.
- Viewport con `minimum-scale=1` y márgenes para las zonas seguras (muesca y barras del iPhone).
- Los botones de corte usan medidas relativas al tamaño base de la página.

## [2026.10.09-l] - 2026-10-08
- Publicación en GitHub Pages.
- Explicación de errores en dos columnas (por qué | cómo) para que quepa sin scroll; si no cabe, se reduce hasta un 58 %.
- Cortador: al pulsar la tijera, el amarillo sube por la línea de corte con una animación rápida y suave (también con «reducir movimiento» activado), acompañada de un sonido «woosh» generado por código.

## [2026.10.09-e] - 2026-10-08
- Cortador rediseñado según el boceto del profe: cada hueco entre letras es un elemento de la propia palabra, con un botón-tijera debajo y una línea amarilla que sube y corta. La línea queda siempre exactamente entre sus dos letras (desviación medida: 0 px).
- Fondo por defecto: ondas de voz.

## [2026.10.09-a] - 2026-10-08
- Identidad visual propia, distinta de MetriKa: pizarra y tiza, paleta coral / menta / amarillo, tipografías Lilita One (títulos) y Andika (palabras, pensada para lectura infantil).
- Logo «Si·la·be·a·**dor**» con cada sílaba dando un saltito y la tónica resaltada.
- Fondos animados temáticos: letras y sílabas flotando, ondas de voz y golpes de voz.
- Música: la de práctica pasa a ser la antigua de contrarreloj, y la de muerte súbita la antigua de práctica.

## [2026.10.08] - 2026-10-08
Primera versión.
- **La idea:** un juego para practicar la clasificación en agudas, llanas y esdrújulas, la división en sílabas y la sílaba tónica, con explicaciones de los errores, usando el diccionario de Acentuador y el estilo de MetriKa / Redondeo como base, sin cuentas ni base de datos.
- **Silabeo fonético** por golpes de voz, no por la separación de final de renglón (ahu-mar, su-bra-yar), validado con las 53.430 palabras del diccionario.
- **Palabras:** el diccionario es muy grande y tiene muchas palabras raras, así que se cruza con una lista de frecuencias del español y se reparte en tres niveles, con 2.253, 3.187 y 3.784 palabras. Se conservan las formas con pronombre pegado (dímelo, dámelo, hazlo…), que son buenas para practicar la tónica.
- Cuatro actividades: clasificar (aguda, llana o esdrújula), dividir en sílabas, sílaba tónica y «Todo junto» (las tres seguidas sobre la misma palabra).
- Cuatro modos: contrarreloj (30/60/90/120 s), muerte súbita, supervivencia (3 vidas) y práctica.
- En práctica, cada error se explica: por qué está mal y cómo se hace, paso a paso.
- Opciones: música, efectos, fondo animado, modo ligero y escala fija. Ranking y ajustes guardados en el navegador, sin cuentas ni base de datos.
- Botones de clasificar en el orden esdrújula, llana, aguda.
- Cortador de sílabas pensado para tablet, móvil y pizarra digital: zonas claras y fáciles de pulsar entre letra y letra (y luego más finas, porque las primeras eran tan anchas que costaba leer la palabra).
- Cuenta atrás 3-2-1 desactivada hasta que haya un modo con base de datos.
- La música se reinicia al cambiar de modo, y se repite sin cortes cuando se sirve por http(s).
