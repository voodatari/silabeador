# Silabeador

Juego de aula para practicar la **división en sílabas** (por golpes de voz), la **sílaba tónica** y la **clasificación de palabras en agudas, llanas y esdrújulas**. Está pensado para jugarse en tablet, móvil o pizarra digital, y también en el ordenador.

**Jugar:** https://voodatari.github.io/silabeador/

No necesita cuentas ni base de datos: el ranking, el nombre y los ajustes se guardan solo en el navegador de cada dispositivo.

## Actividades

| Actividad | Qué se hace |
|---|---|
| Clasificar | Decidir si la palabra es esdrújula, llana o aguda. |
| Dividir en sílabas | Cortar la palabra pulsando los botones-tijera entre las letras. |
| Sílaba tónica | Tocar la sílaba que suena más fuerte. |
| Todo junto | Las tres seguidas sobre la misma palabra: sílabas, tónica y clase. |

## Modos

- **Contrarreloj** (30, 60, 90 o 120 s): todos los aciertos posibles en el tiempo elegido.
- **Muerte súbita:** sin tiempo; un error y se acaba.
- **Supervivencia:** tres vidas y un reloj por pregunta que se acelera.
- **Práctica:** sin presión. Cuando se falla se abre una explicación que cuenta por qué está mal y cómo se hace, paso a paso.

Hay tres **niveles** (más frecuentes y cortas → menos habituales y largas) y un modo mixto. La puntuación se multiplica por 1, 1,5 o 2 según el nivel de la palabra.

## Silabeo

El silabeo es **fonético**: divide por golpes de voz, no por la separación de final de renglón. Por eso *ahumar* es «ahu-mar» y *subrayar* es «su-bra-yar». El motor ([silabeo.js](silabeo.js)) aplica estas reglas:

- Una consonante entre vocales se une a la vocal siguiente. Dos consonantes se reparten, salvo los grupos inseparables (pr, pl, br, bl, tr, dr, cr, cl, fr, fl, gr, gl).
- ch, ll y rr son un solo sonido; la u de qu y gu no suena.
- Diptongos y triptongos no se separan; los hiatos sí (dos vocales abiertas, o í / ú con tilde junto a otra vocal).
- La h entre vocales no impide el diptongo.
- La sílaba tónica la marca la tilde; sin tilde, las palabras terminadas en vocal, n o s son llanas y las demás son agudas.

Cada vez que el alumno falla en práctica, la ventana de explicación ([explicacion.js](explicacion.js)) se construye con la regla concreta que se aplica a esa palabra.

## Las palabras

Salen del diccionario `es_ec` (Hunspell, ortografía de Ecuador) del proyecto Acentuador. Se quitan nombres propios, siglas, formas muy raras y palabras no adecuadas para el aula, y se cruzan con la lista de frecuencias de [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (Hermit Dave, a partir de OpenSubtitles 2018, licencia CC BY-SA 4.0). El nivel de cada palabra depende de su frecuencia y de su número de sílabas:

| Nivel | Frecuencia | Sílabas | Palabras |
|---|---|---|---|
| 1 | entre las 6.000 más usadas | hasta 3 | 2.253 |
| 2 | entre las 16.000 más usadas | hasta 4 | 3.187 |
| 3 | entre las 32.000 más usadas | hasta 5 | 3.784 |

El motor se validó con las 53.430 palabras del diccionario: solo 48 tienen algún aviso (casi todas tildes diacríticas como *cómo*, *té* o *más*). La lista final está en [palabras.js](palabras.js), generado automáticamente. Las herramientas que lo generan (`generar-palabras.js`, `validar-diccionario.js`, `probar-silabeo.js`) y las listas de exclusión viven en la carpeta `herramientas/` del proyecto local y no se publican.

## Interfaz

- Estilo de pizarra y tiza; tipografías Lilita One y Andika (Google Fonts).
- **Fondos animados:** ondas de voz (por defecto), letras y sílabas flotando, golpes de voz o ninguno.
- **Modo ligero:** quita el desenfoque en equipos modestos (se activa solo si lo detecta).
- **Escala fija:** el juego se ve igual con cualquier escala de Windows. En móvil compensa el zoom de página de Safari en iPhone.
- Todo el CSS está en `rem`, por eso escala entero a la vez.
- Música en bucle sin cortes y efectos de sonido; el «woosh» del corte se genera por código.

## Estructura

```
index.html        página única
style.css         estilos (pizarra, móvil, modo ligero)
app.js            navegación, partidas, modos y ranking local
silabeo.js        motor de sílabas, tónica y clasificación
palabras.js       palabras por nivel (generado)
explicacion.js    ventana de explicación de errores
fondo.js          fondos animados
sonido.js         música y efectos
ajustes.js        ventana de opciones
efectos.js        avisos, diálogos, confeti y utilidades
escala.js         escala fija y compensación en móvil
rendimiento.js    modo ligero
bucle.js          música en bucle sin cortes
music/            pistas y efectos
CHANGELOG.md      historial de cambios
```

## Probar en local

Los navegadores no dejan leer el audio de un `index.html` abierto con doble clic, y la música tiene un pequeño hueco al repetirse. Para probarlo bien hay que servirlo por http, por ejemplo con `npx serve` o `python -m http.server` desde esta carpeta.

## Créditos

Hecho por profe Dani. Lista de frecuencias: FrequencyWords (CC BY-SA 4.0).
