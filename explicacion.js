/* =========================================================
   Explicación del error · modo práctica
   Al fallar se abre una ventana que cuenta:
   - por qué la respuesta elegida no vale (según el error cometido)
   - cómo se hace, paso a paso, con las sílabas y la tónica marcadas
   Explicacion.mostrar({ tipo, palabra, elegida }) devuelve una promesa que
   se resuelve al cerrarla.
     tipo 'clasificar' → elegida: 'aguda' | 'llana' | 'esdrujula'
     tipo 'silabas'    → elegida: [posiciones de los cortes del alumno]
     tipo 'tonica'     → elegida: índice de la sílaba elegida
   ========================================================= */
window.Explicacion = (function () {

    var TITULOS = ['¡Casi! Vamos a verlo', '¡Uy! Repasemos esta', '¡No pasa nada! Aprendamos'];
    var NOMBRE = { aguda: 'aguda', llana: 'llana', esdrujula: 'esdrújula' };
    var ORDINAL = { 1: 'última', 2: 'penúltima', 3: 'antepenúltima' };
    var DEFINICION = {
        aguda: 'la sílaba tónica es la <b>última</b>',
        llana: 'la sílaba tónica es la <b>penúltima</b>',
        esdrujula: 'la sílaba tónica es la <b>antepenúltima</b>'
    };
    var TRUCO = '<b>Truco:</b> di la palabra como si llamaras a alguien desde lejos y alarga cada sílaba. ' +
        'La que suena más fuerte y se alarga sola es la <b>tónica</b>.';

    function b(t) { return '<b>' + esc(t) + '</b>'; }
    function sil(t) { return '<b>«' + esc(t) + '»</b>'; }
    function malo(t) { return '<b class="ex-mal">' + esc(t) + '</b>'; }

    /* sílabas en fichas, con la tónica resaltada (si se pide) */
    function fichas(A, marcarTonica, extraClase) {
        return '<span class="ex-sils">' + A.silabas.map(function (s, i) {
            var cl = 'ex-sil' + (marcarTonica && i === A.tonica ? ' tonica' : '') + (extraClase && extraClase(i) ? ' ' + extraClase(i) : '');
            return (i ? '<span class="ex-guion">-</span>' : '') + '<span class="' + cl + '">' + esc(s) + '</span>';
        }).join('') + '</span>';
    }

    /* las tres últimas sílabas con su nombre: última, penúltima, antepenúltima */
    function posiciones(A) {
        var n = A.silabas.length;
        return '<div class="ex-pos">' + A.silabas.map(function (s, i) {
            var p = n - i;
            return '<div class="ex-pos-col' + (i === A.tonica ? ' tonica' : '') + '">' +
                '<span class="ex-pos-sil">' + esc(s) + '</span>' +
                '<span class="ex-pos-etq">' + (ORDINAL[p] || '') + '</span>' +
                (i === A.tonica ? '<span class="ex-pos-marca">▲ tónica</span>' : '') +
                '</div>';
        }).join('') + '</div>';
    }

    /* cómo se sabe cuál es la tónica de ESTA palabra */
    function reglaTonica(A) {
        var w = A.palabra, silTon = sil(A.silabas[A.tonica]);
        if (A.tilde) {
            var v = A.silabas[A.tildeEn].match(/[áéíóú]/)[0];
            return 'Lleva tilde en la <b>' + v + '</b>, y la tilde siempre marca la sílaba tónica: ' + silTon + '.' +
                (A.clase === 'esdrujula' ? ' <small>(Las esdrújulas siempre llevan tilde.)</small>' : '');
        }
        var ult = w[w.length - 1];
        if (A.normal) {
            var fin = A.terminacion === 'vocal' ? 'una <b>vocal</b>' : 'la letra <b>' + ult + '</b>';
            return 'No lleva tilde y termina en ' + fin + '. Las palabras sin tilde que acaban en vocal, <b>n</b> o <b>s</b> ' +
                'son <b>llanas</b>: la tónica es la penúltima, ' + silTon + '.';
        }
        return 'No lleva tilde y termina en la consonante <b>' + ult + '</b> (no es n ni s). Las palabras sin tilde ' +
            'que acaban así son <b>agudas</b>: la tónica es la última, ' + silTon + '.';
    }

    /* ---------- CLASIFICAR ---------- */
    function porQueClase(A, E) {
        var n = A.silabas.length, sin = b(A.silabas.join('-'));
        if (E === 'esdrujula' && n < 3) {
            return 'Has dicho ' + malo('esdrújula') + ', pero ' + sil(A.palabra) + ' solo tiene <b>' + n +
                ' sílabas</b> (' + sin + '): para ser esdrújula la tónica tendría que ser la antepenúltima, y aquí no existe.' +
                ' Su tónica es ' + sil(A.silabas[A.tonica]) + ', la ' + ORDINAL[A.pos] + ': es <b>' + NOMBRE[A.clase] + '</b>.';
        }
        return 'Has dicho ' + malo(NOMBRE[E]) + ': en las palabras ' + NOMBRE[E] + 's ' + DEFINICION[E] + '. ' +
            'Pero en ' + sin + ' la sílaba tónica es ' + sil(A.silabas[A.tonica]) + ', que es la <b>' + ORDINAL[A.pos] + '</b>. ' +
            'Por eso es <b class="ex-bien">' + NOMBRE[A.clase] + '</b>.';
    }

    function pasosClase(A) {
        return '<ol class="ex-pasos">' +
            '<li>Divide la palabra en <b>sílabas</b> (golpes de voz): ' + fichas(A, false) + '</li>' +
            '<li>Busca la <b>sílaba tónica</b>, la que suena más fuerte. ' + reglaTonica(A) + '<div class="ex-truco">' + TRUCO + '</div></li>' +
            '<li>Cuenta desde el <b>final</b> hasta la tónica:' + posiciones(A) +
                '<div class="ex-conclusion">Antepenúltima ➜ esdrújula · Penúltima ➜ llana · Última ➜ aguda<br>' +
                'Es <b class="ex-bien">' + NOMBRE[A.clase] + '</b>.</div></li>' +
            '</ol>';
    }

    /* ---------- TÓNICA ---------- */
    function porQueTonica(A, E) {
        var elegida = A.silabas[E] || '';
        return 'La sílaba ' + malo('«' + elegida + '»') + ' no es la que suena más fuerte en ' + sil(A.silabas.join('-')) + '. ' +
            'La sílaba tónica es ' + sil(A.silabas[A.tonica]) + '. ' + reglaTonica(A);
    }

    function pasosTonica(A) {
        return '<ol class="ex-pasos">' +
            '<li>Di la palabra en voz alta, alargando cada sílaba. ' + TRUCO + '</li>' +
            '<li>¿Lleva tilde? ' + reglaTonica(A) + '</li>' +
            '<li>Así queda, con la tónica marcada:' + posiciones(A) +
                '<div class="ex-conclusion">Es <b class="ex-bien">' + NOMBRE[A.clase] + '</b> (la tónica es la ' + ORDINAL[A.pos] + ').</div></li>' +
            '</ol>';
    }

    /* ---------- SILABEAR ---------- */
    var REGLA = {
        hiato: 'Hiato: dos vocales seguidas que se pronuncian en <b>dos golpes de voz</b>. Ocurre con dos vocales abiertas (a, e, o) o cuando la <b>í</b> o la <b>ú</b> llevan tilde junto a otra vocal.',
        diptongo: 'Diptongo: una vocal abierta (a, e, o) y una cerrada (i, u), o dos cerradas, que suenan en <b>un solo golpe de voz</b>. No se separan.',
        triptongo: 'Triptongo: cerrada + abierta + cerrada, tres vocales en <b>un solo golpe de voz</b>. No se separan.',
        digrafo: 'ch, ll y rr son un solo sonido, y la u de qu / gu (que, gue…) no suena: no se separan.',
        inseparable: 'Grupos inseparables: pr, pl, br, bl, tr, dr, cr, cl, fr, fl, gr, gl. Las dos consonantes se quedan juntas con la vocal siguiente.',
        cc: 'Dos consonantes seguidas (que no son un grupo inseparable) se reparten: la primera cierra una sílaba y la segunda abre la siguiente.',
        'v-cv': 'Una sola consonante entre dos vocales se une a la vocal que va <b>después</b>.'
    };
    var ORDEN_REGLAS = ['hiato', 'diptongo', 'triptongo', 'digrafo', 'inseparable', 'cc', 'v-cv'];

    function parDe(A, pos) {
        var w = A.palabra, j = A.juntas[pos - 1];
        if (j && j.der === 'h' && w[pos + 1]) return w.slice(pos - 1, pos + 2);
        return w.slice(pos - 1, pos + 1);
    }

    /* Los errores del mismo tipo se explican juntos: una sola frase por regla */
    function lista(A, posiciones, lado) {
        return posiciones.slice(0, 4).map(function (p) {
            var j = A.juntas[p - 1];
            return sil(lado === 'izq' ? j.izq : lado === 'der' ? j.der : parDe(A, p));
        }).join(', ');
    }

    function grupos(A, posiciones, sobra) {
        var g = {}, orden = [];
        posiciones.forEach(function (p) {
            var j = A.juntas[p - 1], k = j.motivo;
            if (!sobra && k === 'hiato') k = /[íú]/.test(parDe(A, p)) ? 'hiato-tilde' : 'hiato';
            if (sobra && k !== 'digrafo' && k !== 'diptongo' && k !== 'triptongo' && k !== 'inseparable' && k !== 'cv') k = 'cierra';
            if (!g[k]) { g[k] = []; orden.push(k); }
            g[k].push(p);
        });
        return orden.map(function (k) { return { motivo: k, pos: g[k] }; });
    }

    function mensajeGrupo(A, motivo, pos, sobra) {
        var L = lista(A, pos);
        if (sobra) {
            switch (motivo) {
                case 'digrafo': return 'Has separado ' + L + ': ch, ll y rr suenan como un solo sonido, y la u de qu / gu no suena. <b>Nunca se separan</b>.';
                case 'diptongo': return 'Has separado ' + L + ': son vocales que forman un <b>diptongo</b> y se pronuncian en un solo golpe de voz.';
                case 'triptongo': return 'Has separado ' + L + ': son tres vocales en un solo golpe de voz (<b>triptongo</b>).';
                case 'inseparable': return 'Has separado ' + L + ': es un <b>grupo inseparable</b>; las dos consonantes van juntas con la vocal siguiente.';
                case 'cv': return 'Has dejado sola ' + lista(A, pos, 'izq') + ': una consonante se pronuncia <b>junto a su vocal</b>.';
                default: return 'No hay que cortar entre ' + L + ': la consonante cierra la sílaba porque la siguiente se une a su propia vocal.';
            }
        }
        switch (motivo) {
            case 'hiato-tilde': return 'Falta cortar entre ' + L + ': la vocal con tilde (í, ú) junto a otra vocal rompe el diptongo y se pronuncia aparte (<b>hiato</b>).';
            case 'hiato': return 'Falta cortar entre ' + L + ': dos vocales abiertas (a, e, o) seguidas no forman diptongo, son un <b>hiato</b> y van en sílabas distintas.';
            case 'cc': return 'Falta cortar entre ' + L + ': dos consonantes seguidas se <b>reparten</b>; la primera cierra la sílaba y la segunda empieza la siguiente.';
            default: return 'Falta cortar antes de ' + lista(A, pos, 'der') + ': entre vocales, una sola consonante se une a la vocal que va <b>después</b>.';
        }
    }

    /* palabra con los cortes dibujados: bien, sobra (rojo) o falta (verde punteado) */
    function palabraConCortes(A, elegida) {
        var w = A.palabra, correctos = A.cortes, html = '';
        for (var i = 0; i < w.length; i++) {
            if (i > 0) {
                var enC = correctos.indexOf(i) >= 0, enE = elegida.indexOf(i) >= 0;
                if (enC && enE) html += '<span class="ex-corte bien">|</span>';
                else if (enE) html += '<span class="ex-corte sobra">|</span>';
                else if (enC) html += '<span class="ex-corte falta">|</span>';
                else html += '<span class="ex-corte"></span>';
            }
            html += '<span class="ex-letra' + (A.roles[i] === 'N' ? ' nucleo' : '') + '">' + esc(w[i]) + '</span>';
        }
        return '<div class="ex-palabra">' + html + '</div>';
    }

    function porQueSilabas(A, elegida) {
        var sobran = elegida.filter(function (c) { return A.cortes.indexOf(c) < 0; });
        var faltan = A.cortes.filter(function (c) { return elegida.indexOf(c) < 0; });
        var li = [];
        grupos(A, sobran, true).forEach(function (g) { li.push(mensajeGrupo(A, g.motivo, g.pos, true)); });
        grupos(A, faltan, false).forEach(function (g) { li.push(mensajeGrupo(A, g.motivo, g.pos, false)); });
        li = li.slice(0, 4);
        var dado = elegida.length ? esc(partirPor(A.palabra, elegida).join('-')) : esc(A.palabra) + ' <small>(sin ningún corte)</small>';
        return '<p>Tu división: ' + malo(dado) + ' · La correcta: <b class="ex-bien">' + esc(A.silabas.join('-')) + '</b></p>' +
            '<ul class="ex-lista">' + li.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
            palabraConCortes(A, elegida) +
            '<p class="ex-leyenda"><span class="ex-corte bien">|</span> bien · <span class="ex-corte sobra">|</span> sobra · <span class="ex-corte falta">|</span> falta</p>';
    }

    function partirPor(w, cortes) {
        var out = [], ini = 0;
        cortes.slice().sort(function (a, b) { return a - b; }).concat([w.length]).forEach(function (c) { out.push(w.slice(ini, c)); ini = c; });
        return out;
    }

    function pasosSilabas(A) {
        var n = A.silabas.length;
        var reglas = [];
        ORDEN_REGLAS.forEach(function (m) {
            var j = A.juntas.filter(function (x) { return x.motivo === m; })[0];
            if (!j) return;
            var ej = m === 'v-cv' || m === 'cc' || m === 'hiato'
                ? ' En esta palabra: ' + sil(A.silabas.join('-')) + '.'
                : ' En esta palabra: ' + sil(parDe(A, j.pos)) + '.';
            reglas.push('<li>' + REGLA[m] + ej + '</li>');
        });
        return '<ol class="ex-pasos">' +
            '<li>Cuenta los <b>golpes de voz</b>: cada vocal (o grupo de vocales que suenan juntas) es el centro de una sílaba. ' +
                'Aquí hay <b>' + n + '</b>:' + palabraConCortes(A, A.cortes) + '</li>' +
            '<li>Reparte las consonantes que quedan entre las vocales. Las reglas que aparecen en esta palabra:' +
                '<ul class="ex-lista">' + (reglas.join('') || '<li>Todas las letras van con su vocal.</li>') + '</ul></li>' +
            '<li>Así queda: ' + fichas(A, false) + '</li>' +
            '</ol>';
    }

    /* ---------- ventana ---------- */
    function construir(d) {
        var A = Silabeo.analizar(d.palabra), enunciado, mal, bien, porQue, como;
        if (d.tipo === 'clasificar') {
            enunciado = 'Clasifica ' + b(A.palabra) + ' según su sílaba tónica';
            mal = NOMBRE[d.elegida]; bien = NOMBRE[A.clase];
            porQue = '<p>' + porQueClase(A, d.elegida) + '</p>';
            como = pasosClase(A);
        } else if (d.tipo === 'tonica') {
            enunciado = '¿Cuál es la sílaba tónica de ' + b(A.palabra) + '?';
            mal = A.silabas[d.elegida]; bien = A.silabas[A.tonica];
            porQue = '<p>' + porQueTonica(A, d.elegida) + '</p>';
            como = pasosTonica(A);
        } else {
            enunciado = 'Divide ' + b(A.palabra) + ' en sílabas (golpes de voz)';
            mal = partirPor(A.palabra, d.elegida).join('-'); bien = A.silabas.join('-');
            porQue = porQueSilabas(A, d.elegida);
            como = pasosSilabas(A);
        }
        return '' +
            '<div class="ex-cabecera">' +
                '<div class="ex-emoji">🤔</div>' +
                '<h3 id="ex-title" class="ex-titulo">' + TITULOS[Math.floor(Math.random() * TITULOS.length)] + '</h3>' +
                '<p class="ex-enunciado">' + enunciado + '</p>' +
                '<div class="ex-respuestas">' +
                    '<span class="ex-pill mal">✗ Tu respuesta <b>' + esc(mal) + '</b></span>' +
                    '<span class="ex-pill bien">✓ Correcta <b>' + esc(bien) + '</b></span>' +
                '</div>' +
            '</div>' +
            '<section class="ex-card ex-por-que"><h4>🔍 ¿Por qué no es así?</h4>' + porQue + '</section>' +
            '<section class="ex-card ex-como"><h4>💡 Así se hace</h4>' + como + '</section>' +
            '<div class="dialog-actions"><button type="button" class="btn-primary ex-ok">¡Entendido! Siguiente ➜</button></div>';
    }

    /* Si el contenido no cabe sin scroll, se reduce un poco (hasta un mínimo legible) */
    function ajustar(box) {
        var cont = box.querySelector('.ex-contenido'), z = 1;
        cont.style.zoom = 1;
        while (box.scrollHeight > box.clientHeight + 1 && z > 0.58) { z -= 0.04; cont.style.zoom = z.toFixed(2); }
    }

    function mostrar(datos) {
        return new Promise(function (resolve) {
            var previo = document.activeElement;
            var velo = document.createElement('div');
            velo.className = 'dialog-overlay ex-overlay';
            velo.innerHTML = '<div class="dialog-box ex-box" role="dialog" aria-modal="true" aria-labelledby="ex-title">' +
                '<button type="button" class="close-x ex-cerrar" aria-label="Cerrar">✕</button><div class="ex-contenido">' + construir(datos) + '</div></div>';
            document.body.appendChild(velo);
            ajustar(velo.querySelector('.ex-box'));
            window.addEventListener('resize', reajustar);

            var cerrado = false;
            function reajustar() { ajustar(velo.querySelector('.ex-box')); }
            function cerrar() {
                if (cerrado) return;
                cerrado = true;
                document.removeEventListener('keydown', onKey, true);
                window.removeEventListener('resize', reajustar);
                Sonido.efecto('click');
                velo.classList.add('dialog-out');
                setTimeout(function () { velo.remove(); }, 200);
                if (previo && typeof previo.focus === 'function') previo.focus();
                resolve();
            }
            /* Escape, Enter y espacio cierran y no llegan al resto de la página */
            function onKey(ev) {
                if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); cerrar(); }
            }
            document.addEventListener('keydown', onKey, true);
            velo.querySelector('.ex-ok').addEventListener('click', cerrar);
            velo.querySelector('.ex-cerrar').addEventListener('click', cerrar);
            setTimeout(function () { var bt = velo.querySelector('.ex-ok'); if (bt && !cerrado) bt.focus({ preventScroll: true }); }, 50);
        });
    }

    return { mostrar: mostrar };

})();
