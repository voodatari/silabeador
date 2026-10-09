/* =========================================================
   Infografía animada con voz · explicación paso a paso de un error (modo práctica)
   Cada explicación se divide en «pasos» (beats): una animación en pantalla + una frase que lee Piper.
   Las frases se sintetizan por adelantado en el worker de voz, así que el paso siguiente suena sin esperas.
   Si la voz no está disponible, las animaciones siguen solas, con el tiempo de lectura de cada frase.

   Infografia.mostrar({ tipo, palabra, elegida })  → promesa que se resuelve al cerrarla
   Infografia.preparar({ tipo, palabra, elegida }) → empieza a sintetizar las frases (llamar en cuanto se falla)
   tipo 'clasificar' → elegida: 'aguda' | 'llana' | 'esdrujula'
   tipo 'silabas'    → elegida: [posiciones de los cortes del alumno]
   tipo 'tonica'     → elegida: índice de la sílaba elegida
   ========================================================= */
window.Infografia = (function () {

    var I = Explicacion.interno;

    /* ---------- texto para la voz ---------- */
    function aVoz(html) {
        return String(html)
            .replace(/<small>[\s\S]*?<\/small>/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/[«»"]/g, '')
            .replace(/\s*(➜|→)\s*/g, ', ')
            .replace(/(\p{L})-(?=\p{L})/gu, '$1, ')          // ca-mi-no → ca, mi, no
            .replace(/\s*·\s*/g, ', ')
            .replace(/[()]/g, ',')
            .replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/,(\s*,)+/g, ',').replace(/,\s*\./g, '.')
            .trim();
    }
    function enLista(arr) { return arr.join(', '); }

    var NOMBRE_LETRA = { a: 'a', b: 'be', c: 'ce', d: 'de', e: 'e', f: 'efe', g: 'ge', h: 'hache', i: 'i', j: 'jota', k: 'ka', l: 'ele', m: 'eme', n: 'ene', 'ñ': 'eñe',
        o: 'o', p: 'pe', q: 'cu', r: 'erre', s: 'ese', t: 'te', u: 'u', v: 'uve', w: 'uve doble', x: 'equis', y: 'i griega', z: 'zeta',
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', ll: 'elle', ch: 'che', rr: 'erre doble' };
    function nombreLetra(ch) { return NOMBRE_LETRA[ch] || ch; }
    /* «uc» → «u y c»; «ahu» → «a, hache y u» */
    function letrasVoz(par) {
        // cada letra con su artículo y la «y» entre comas: «i y o» se oía «io» y «e y ene» «eine»
        var n = par.split('').map(function (c) { return (/[aeiouáéíóúü]/.test(c) ? 'la vocal ' : 'la letra ') + nombreLetra(c); });
        return n.length <= 1 ? n.join('') : n.slice(0, -1).join(', ') + ', y ' + n[n.length - 1];
    }

    /* lo que se DICE de cada error de silabeo (no se lee el texto de pantalla: «uc» sonaba mal, mejor «entre u y c») */
    function mensajeVoz(A, motivo, pos, sobra) {
        var pares = pos.slice(0, 3).map(function (p) { return letrasVoz(I.parDe(A, p)); });
        var L = pares.join(', y entre '), j = A.juntas[pos[0] - 1];
        if (sobra) {
            switch (motivo) {
                case 'digrafo': return 'No cortes entre ' + L + '. ' + I.vozDigrafo(A, pos) + ' Nunca se separan.';
                case 'diptongo': return 'No cortes entre ' + L + '. Forman un diptongo: se pronuncian en un solo golpe de voz.';
                case 'triptongo': return 'No cortes entre ' + L + '. Son un triptongo: tres vocales en un solo golpe de voz.';
                case 'inseparable': return 'No cortes entre ' + L + '. Es un grupo inseparable: las dos consonantes van juntas con la vocal siguiente.';
                case 'cv': return 'No dejes sola la letra ' + nombreLetra(j.izq) + '. Una consonante no forma sílaba ella sola: se junta con la vocal de detrás: ' + I.silabaDe(A, pos[0] - 1) + '.';
                default: return 'No cortes entre ' + L + '. ' + (pos.length === 1 ? 'La letra ' + nombreLetra(A.palabra[pos[0]]) + ' no tiene una vocal detrás, así que se queda en la sílaba de delante: ' : 'Esas consonantes no tienen una vocal detrás, así que se quedan en la sílaba de delante: ') + pos.slice(0, 3).map(function (p) { return I.silabaDe(A, p - 1); }).join(', ') + '.';
            }
        }
        switch (motivo) {
            case 'hiato-tilde': return 'Falta cortar entre ' + L + '. La vocal con tilde rompe el diptongo y se pronuncia aparte. Es un hiato.';
            case 'hiato': return 'Falta cortar entre ' + L + '. Dos vocales abiertas seguidas no forman diptongo: es un hiato, y van en sílabas distintas.' + (/hache/.test(L) ? ' La hache no suena.' : '');
            case 'cc': return 'Falta cortar entre ' + L + '. Dos consonantes seguidas se reparten: la primera cierra la sílaba y la segunda empieza la siguiente.';
            default:
                var cs = pos.slice(0, 3).map(function (p) { return 'la letra ' + nombreLetra(I.consonanteDesde(A, p)); }), ss = pos.slice(0, 3).map(function (p) { return I.silabaDesde(A, p); });
                if (cs.length === 1) return 'Falta un corte antes de ' + cs[0] + '. Está entre dos vocales, y se junta con la vocal de detrás: ' + ss[0] + '.';
                return 'Faltan cortes antes de ' + cs.slice(0, -1).join(', ') + ', y de ' + cs[cs.length - 1] + '. Cada una está entre dos vocales, y se junta con la vocal de detrás: ' + ss.join(', ') + '.';
        }
    }

    /* la regla de la tónica, con una pausa en cada elemento de la enumeración y tras los dos puntos */
    function vozRegla(A) {
        var ton = A.silabas[A.tonica], s = [], pausa = 550;
        s.push({ t: 'Lleva tilde en la sílaba:', pausa: 100 }); s.push({ t: ton, pausa: pausa });
        s.push('y la tilde siempre marca la sílaba tónica.');
        return s;
    }

    /* tiempos (ms): silencio entre frases, entre pasos y tras cada sílaba que se deletrea */
    var PAUSA_FRASE = 600, PAUSA_PASO = 1100, PAUSA_SILABA = 700;

    /* una palabra dicha sílaba a sílaba, en UN solo enunciado y con las vocales alargadas (la tónica mucho más):
       el worker devuelve en qué segundo empieza cada sílaba y la animación se sincroniza con esas marcas */
    function silabeo(sils, tonica) { return { sil: sils, ton: tonica, pausa: 0 }; }
    function textoDeVoz(v) { return Array.isArray(v) ? v.map(function (x) { return typeof x === 'string' ? x : x.t; }).join(' ') : v; }

    function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }

    /* ---------- guiones ---------- */
    var ETIQ_MOTIVO = {
        digrafo: 'un solo sonido', diptongo: 'diptongo', triptongo: 'triptongo', inseparable: 'grupo inseparable',
        cv: 'va con su vocal', cierra: 'cierra la sílaba', 'hiato': 'hiato', 'hiato-tilde': 'hiato', cc: 'se reparten', 'v-cv': 'se junta con la vocal de detrás'
    };

    function guionAcento(d, A) {
        var clasif = d.tipo === 'clasificar', n = A.silabas.length, tonicaTxt = A.silabas[A.tonica];
        var mal = clasif ? I.NOMBRE[d.elegida] : A.silabas[d.elegida], bien = clasif ? I.NOMBRE[A.clase] : tonicaTxt;
        var nota = (clasif && d.elegida === 'esdrujula' && n < 3) ? ' Fíjate: solo tiene ' + n + ' sílabas, así que no puede tener antepenúltima.' : '';
        var etiquetas = ['última', 'penúltima', 'antepenúltima'].slice(0, A.pos);
        var titulo = clasif ? 'Clasificar la palabra' : 'Buscar la sílaba tónica';

        var b = [];
        b.push({
            cap: titulo + ' <b>' + A.palabra + '</b>',
            voz: clasif ? 'Vamos a clasificar la palabra ' + A.palabra + '.' : 'Vamos a buscar la sílaba tónica de la palabra ' + A.palabra + '.',
            anim: function (e) { e.mostrarPalabra(); }
        });
        b.push({
            cap: 'Has elegido <b class="ig-mal">' + mal + '</b>, pero la correcta es <b class="ig-bien">' + bien + '</b>.' + (nota ? '<br><small>' + nota.trim() + '</small>' : ''),
            // UNA sola oración, con comas: así Piper la entona entera (partirla en llamadas sueltas rompía la entonación)
            voz: 'Has elegido ' + mal + ', pero la respuesta correcta es ' + bien + '.' + nota + ' Vamos a verlo paso a paso.',
            anim: function (e) { e.pildoras(mal, bien); },
            // la sílaba elegida se pone en color en el momento aproximado en que se nombra dentro de la frase
            seg: function (e, i, fi, dur) {
                if (fi !== 0 || clasif) return;
                var frase = 'Has elegido ' + mal + ', pero la respuesta correcta es ' + bien + '.';
                var cuando = dur ? dur * 1000 * ('Has elegido '.length / frase.length) : 0;
                e.tarde(cuando, function () { e.errorTemporal(d.elegida, 1500); });
            }
        });
        b.push({
            cap: '1 · Dividimos la palabra en <b>sílabas</b>',
            // no se silabea en voz alta aquí (se hace en el paso 2): las sílabas aparecen mientras se habla y luego hay una pausa
            voz: [{ t: 'Primero dividimos la palabra en sílabas.', pausa: 900 + n * 150 }],
            anim: function (e) { A.silabas.forEach(function (s, k) { e.tarde(500 + k * 450, function () { e.revelarSilaba(k); }); }); }
        });
        b.push({
            cap: '2 · Buscamos la sílaba <b>tónica</b>: la que suena más fuerte',
            voz: ['Ahora buscamos la sílaba tónica, la que suena más fuerte. Vamos a decir la palabra alargando cada sílaba.', silabeo(A.silabas, A.tonica), 'La sílaba tónica es ' + tonicaTxt + '.'],
            anim: function (e) { e.sueno(-1); },
            sil: function (e, k) { e.sueno(k); if (!clasif && k === d.elegida) e.errorTemporal(k, 1500); },
            seg: function (e, i) { if (i === 2) e.tonicaFinal(); }
        });
        // solo se explica la tilde (marca la tónica); nunca las terminaciones (n, s, vocal…), ni al buscar la tónica ni al clasificar
        if (!clasif && A.tilde) b.push({
            cap: I.reglaTonica(A),
            voz: vozRegla(A),
            anim: function (e) { e.marcarRegla(); }
        });
        var cuenta = ['Contamos desde el final hasta la tónica:'];
        etiquetas.forEach(function (x) { cuenta.push({ t: x, pausa: PAUSA_SILABA }); });
        b.push({
            cap: '3 · Contamos desde el <b>final</b>',
            voz: cuenta,
            anim: function (e) { e.prepararCuenta(); },
            seg: function (e, i) { if (i >= 1) e.contarPaso(i); }
        });
        b.push({
            cap: 'La tónica es la <b>' + I.ORDINAL[A.pos] + '</b>: la palabra es <b class="ig-bien">' + I.NOMBRE[A.clase] + '</b>',
            voz: 'La sílaba tónica es la ' + I.ORDINAL[A.pos] + ', así que la palabra ' + A.palabra + ' es ' + I.NOMBRE[A.clase] + '.',
            anim: function (e) { e.insigniaClase(); },
            final: true
        });
        return b;
    }

    function guionSilabas(d, A) {
        var elegida = d.elegida, sils = A.silabas, n = sils.length;
        var tuDiv = elegida.length ? I.partirPor(A.palabra, elegida) : [A.palabra];
        var sobran = elegida.filter(function (c) { return A.cortes.indexOf(c) < 0; });
        var faltan = A.cortes.filter(function (c) { return elegida.indexOf(c) < 0; });
        var grupos = I.grupos(A, sobran, true).map(function (g) { return { sobra: true, g: g }; })
            .concat(I.grupos(A, faltan, false).map(function (g) { return { sobra: false, g: g }; })).slice(0, 3);

        var b = [];
        b.push({
            cap: 'Dividir en sílabas <b>' + A.palabra + '</b>',
            voz: 'Vamos a dividir la palabra ' + A.palabra + ' en sílabas.',
            anim: function (e) { e.mostrarPalabra(); }
        });
        b.push({
            cap: 'Tu división: <b class="ig-mal">' + tuDiv.join('-') + '</b>',
            voz: 'Mira cómo la has dividido.',
            anim: function (e) { e.cortesAlumno(elegida); }
        });
        b.push({
            cap: 'Pero se divide así: <b class="ig-bien">' + sils.join('-') + '</b>',
            voz: ['Pero se divide así:', silabeo(sils, A.tonica)],
            anim: function (e) { e.limpiarCortes(); },
            sil: function (e, k) { e.revelarSilaba(k); }
        });
        b.push({
            cap: 'Cada vocal, o grupo de vocales que suenan juntas, es el centro de una sílaba. Aquí hay <b>' + n + '</b>.',
            voz: 'Cada vocal, o grupo de vocales que suenan juntas, es el centro de una sílaba. Aquí hay ' + n + '.',
            anim: function (e) { e.contarNucleos(); }
        });
        grupos.forEach(function (x) {
            var texto = I.mensajeGrupo(A, x.g.motivo, x.g.pos, x.sobra);
            b.push({
                cap: texto,
                voz: mensajeVoz(A, x.g.motivo, x.g.pos, x.sobra),
                anim: function (e) { e.resaltarGrupo(x.g.pos, x.sobra, ETIQ_MOTIVO[x.g.motivo] || '', x.g.motivo); }
            });
        });
        b.push({
            cap: 'Así queda: <b class="ig-bien">' + sils.join('-') + '</b>',
            voz: ['Así queda:', silabeo(sils, A.tonica)],
            anim: function (e) { e.cortesCorrectos(); },
            sil: function (e, k) { e.destacarSilaba(k); },
            final: true
        });
        return b;
    }

    function guion(d) {
        var A = Silabeo.analizar(d.palabra);
        return { A: A, beats: d.tipo === 'silabas' ? guionSilabas(d, A) : guionAcento(d, A) };
    }

    var preparados = {};
    function clave(d) { return d.tipo + '|' + d.palabra + '|' + JSON.stringify(d.elegida); }
    function preparar(d) {
        var k = clave(d);
        if (!preparados[k]) {
            preparados[k] = guion(d);
            if (Voz.estado() !== 'error') preparados[k].beats.forEach(function (x) { Voz.precargar(x.voz); });   // en orden, en el worker
        }
        return preparados[k];
    }

    /* ---------- escena (los elementos animados) ---------- */
    function Escena(raiz, A, tipo) {
        var self = this;
        this.A = A; this.raiz = raiz; this.timers = []; this.tipo = tipo;
        raiz.innerHTML = '';

        // palabra con huecos de corte entre letras
        var w = A.palabra, p = el('div', 'ig-palabra');
        for (var i = 0; i < w.length; i++) {
            var l = el('span', 'ig-l' + (A.roles[i] === 'N' ? ' nucleo' : ''), w[i]); l.dataset.i = i; p.appendChild(l);
            if (i < w.length - 1) { var h = el('span', 'ig-h'); h.dataset.pos = i + 1; h.appendChild(el('span', 'ig-h-linea')); p.appendChild(h); }
        }
        this.palabra = p;
        this.letras = [].slice.call(p.querySelectorAll('.ig-l'));
        this.huecos = [].slice.call(p.querySelectorAll('.ig-h'));
        this.bocadillo = el('div', 'ig-bocadillo');
        this.pildorasEl = el('div', 'ig-pildoras');
        this.cols = el('div', 'ig-sils');
        A.silabas.forEach(function (s, i) {
            var c = el('div', 'ig-col'); c.appendChild(el('div', 'ig-chip', s)); c.appendChild(el('div', 'ig-etq', ''));
            self.cols.appendChild(c);
        });
        this.insignia = el('div', 'ig-insignia', '');
        var top = el('div', 'ig-zona-palabra'); top.appendChild(this.bocadillo); top.appendChild(p);
        var lienzo = el('div', 'ig-lienzo');
        lienzo.appendChild(this.pildorasEl); lienzo.appendChild(top); lienzo.appendChild(this.cols); lienzo.appendChild(this.insignia);
        raiz.appendChild(lienzo);
        this.lienzo = lienzo;
        p.classList.add('oculta');
        this.encajar();
    }
    var P = Escena.prototype;
    /* si el contenido no cabe en el alto de la escena, se reduce (nada se corta por arriba ni por abajo) */
    P.encajar = function () {
        var raiz = this.raiz, l = this.lienzo, z = 1, palabra = this.palabra, hs = this.huecos;
        // se mide con los huecos de corte ya abiertos (la palabra se ensancha cuando salen los cortes)
        var n = Math.min(hs.length, this.A.cortes.length + 2), i;
        hs.forEach(function (h) { h.style.transition = 'none'; });
        for (i = 0; i < n; i++) hs[i].classList.add('medir');
        /* tónica y clasificar: se mide con lo que saldrá al final (píldoras, etiquetas «antepenúltima»… e insignia), que al
           principio está vacío; si no, en móvil el final no cabía y se cortaba */
        var etqs = this.chips().map(function (c) { return c.querySelector('.ig-etq'); }), guardado = null;
        if (this.tipo !== 'silabas') {
            guardado = { pild: this.pildorasEl.innerHTML, etqs: etqs.map(function (e) { return e.innerHTML; }), ins: this.insignia.textContent, insC: this.insignia.className };
            if (!this.pildorasEl.innerHTML) this.pildorasEl.innerHTML = '<span class="ig-pill mal">✗ Tu respuesta <b>esdrújula</b></span><span class="ig-pill bien">✓ Correcta <b>esdrújula</b></span>';
            etqs.forEach(function (e, k) { var pos = etqs.length - k; e.innerHTML = pos <= 3 ? '<span class="ig-num">' + pos + '</span> ' + I.ORDINAL[pos] : '▲ tónica'; });
            this.insignia.textContent = I.NOMBRE[this.A.clase].toUpperCase(); this.insignia.className = 'ig-insignia ver ' + this.A.clase;
        }
        l.style.zoom = 1;
        var filas = [this.cols, this.pildorasEl];       // van en una sola fila: si no caben a lo ancho, se reduce todo
        function nocabe() {
            return raiz.scrollHeight > raiz.clientHeight + 1 || palabra.getBoundingClientRect().width > raiz.clientWidth - 6 ||
                filas.some(function (f) { return f.scrollWidth > f.clientWidth + 1; });
        }
        while (nocabe() && z > 0.35) { z -= 0.04; l.style.zoom = z.toFixed(2); }
        if (guardado) {
            this.pildorasEl.innerHTML = guardado.pild; etqs.forEach(function (e, k) { e.innerHTML = guardado.etqs[k]; });
            this.insignia.textContent = guardado.ins; this.insignia.className = guardado.insC;
        }
        for (i = 0; i < n; i++) hs[i].classList.remove('medir');
        void l.offsetWidth;
        hs.forEach(function (h) { h.style.transition = ''; });
    };
    P.tarde = function (ms, fn) { if (this.rapido) fn(); else this.timers.push(setTimeout(fn, ms)); };
    P.parar = function () { this.timers.forEach(clearTimeout); this.timers = []; };
    P.chips = function () { return [].slice.call(this.cols.querySelectorAll('.ig-col')); };

    P.mostrarPalabra = function () {
        var self = this;
        this.palabra.classList.remove('oculta');
        this.letras.forEach(function (l, i) { l.style.animationDelay = (i * 55) + 'ms'; l.classList.add('entra'); });
    };
    P.pildoras = function (mal, bien) {
        this.pildorasEl.innerHTML = '<span class="ig-pill mal">✗ Tu respuesta <b>' + mal + '</b></span><span class="ig-pill bien">✓ Correcta <b>' + bien + '</b></span>';
        [].forEach.call(this.pildorasEl.children, function (x, i) { x.style.animationDelay = (i * 350) + 'ms'; x.classList.add('ver'); });
    };
    /* una sílaba cada vez: sale su corte (si no es la primera) y su ficha */
    P.revelarSilaba = function (k) {
        var cs = this.chips();
        if (!cs[k]) return;
        if (k > 0) this.huecos[this.A.cortes[k - 1] - 1].classList.add('on', 'ok');
        cs[k].style.transitionDelay = '0ms';
        cs[k].classList.add('ver');
    };
    P.limpiarCortes = function () {
        this.parar();
        this.huecos.forEach(function (h) { h.className = 'ig-h'; });
        this.chips().forEach(function (c) { c.classList.remove('ver', 'suena'); });
        this.letras.forEach(function (l) { l.classList.remove('resalta', 'nucleo-on', 'err'); });
        this.bocadillo.classList.remove('ver');
    };
    /* la sílaba k (letras y ficha) cambia de color un momento: es la que el alumno eligió por error */
    P.errorTemporal = function (k, ms) {
        var A = this.A, ini = k > 0 ? A.cortes[k - 1] : 0, fin = k < A.cortes.length ? A.cortes[k] : A.palabra.length;
        var ls = this.letras.slice(ini, fin), c = this.chips()[k];
        ls.forEach(function (l) { l.classList.add('err'); });
        if (c) c.classList.add('err');
        this.tarde(ms || 1600, function () { ls.forEach(function (l) { l.classList.remove('err'); }); if (c) c.classList.remove('err'); });
    };
    /* la sílaba k «suena» (ondas); -1 = ninguna */
    P.sueno = function (k) {
        this.chips().forEach(function (c, i) { c.classList.toggle('suena', i === k); });
    };
    P.destacarSilaba = P.sueno;
    P.tonicaFinal = function () {
        var cs = this.chips(), t = this.A.tonica;
        cs.forEach(function (c) { c.classList.remove('suena'); });
        cs[t].classList.add('tonica', 'suena');
        cs[t].querySelector('.ig-etq').textContent = '▲ tónica';
    };
    P.marcarRegla = function () {
        var A = this.A, w = A.palabra, self = this;
        this.letras.forEach(function (l) { l.classList.remove('resalta'); });
        if (A.tilde) {
            var idx = w.search(/[áéíóú]/);
            if (idx >= 0) this.letras[idx].classList.add('resalta', 'tilde');
            this.dicho('lleva tilde');
        }
    };
    P.dicho = function (txt) { this.bocadillo.textContent = txt; this.bocadillo.classList.remove('ver'); void this.bocadillo.offsetWidth; this.bocadillo.classList.add('ver'); };
    P.prepararCuenta = function () {
        this.letras.forEach(function (l) { l.classList.remove('resalta'); });
        this.bocadillo.classList.remove('ver');
        this.chips().forEach(function (c) { c.classList.remove('suena'); });
    };
    /* k = 1 → última, 2 → penúltima, 3 → antepenúltima */
    P.contarPaso = function (k) {
        var cs = this.chips(), c = cs[cs.length - k];
        if (!c) return;
        c.classList.add('cuenta');
        c.querySelector('.ig-etq').innerHTML = '<span class="ig-num">' + k + '</span> ' + I.ORDINAL[k];
    };
    P.insigniaClase = function () {
        var cs = this.chips(), t = this.A.tonica;
        cs.forEach(function (c, i) { c.classList.toggle('apagada', i !== t); });
        this.insignia.textContent = I.NOMBRE[this.A.clase].toUpperCase();
        this.insignia.className = 'ig-insignia ' + this.A.clase;
        void this.insignia.offsetWidth;
        this.insignia.classList.add('ver');
    };

    /* sílabas */
    P.cortesAlumno = function (elegida) {
        var self = this, correctos = this.A.cortes;
        this.palabra.classList.remove('oculta');
        this.letras.forEach(function (l) { l.classList.add('entra'); l.style.animationDelay = '0ms'; });
        var pos = correctos.concat(elegida.filter(function (c) { return correctos.indexOf(c) < 0; })).sort(function (a, b) { return a - b; });
        pos.forEach(function (c, k) {
            var enC = correctos.indexOf(c) >= 0, enE = elegida.indexOf(c) >= 0;
            self.tarde(k * 330, function () { self.huecos[c - 1].classList.add('on', enC && enE ? 'ok' : enE ? 'mal' : 'falta'); });
        });
    };
    P.contarNucleos = function () {
        var self = this, A = this.A, grupos = [], actual = null;
        A.roles.split('').forEach(function (r, i) {
            if (r === 'N') { if (!actual) { actual = []; grupos.push(actual); } actual.push(i); } else actual = null;
        });
        this.huecos.forEach(function (h) { h.className = 'ig-h'; });
        grupos.forEach(function (g, k) {
            self.tarde(k * 600, function () {
                self.letras.forEach(function (l) { l.classList.remove('resalta'); });
                g.forEach(function (i) { self.letras[i].classList.add('resalta', 'nucleo-on'); });
                self.dicho(String(k + 1));
            });
        });
        this.tarde(grupos.length * 600 + 200, function () { self.bocadillo.classList.remove('ver'); self.letras.forEach(function (l) { l.classList.remove('resalta', 'nucleo-on'); }); });
    };
    P.resaltarGrupo = function (posiciones, sobra, etiqueta, motivo) {
        var self = this, w = this.A.palabra;
        this.letras.forEach(function (l) { l.classList.remove('resalta', 'nucleo-on'); });
        this.huecos.forEach(function (h) { h.className = 'ig-h'; });
        this.A.cortes.forEach(function (pos) { self.huecos[pos - 1].classList.add('on', 'ok'); });
        var estado = sobra ? 'mal' : 'falta';
        // el hueco concreto y sus dos letras
        posiciones.slice(0, 4).forEach(function (p) {
            self.huecos[p - 1].className = 'ig-h on ' + estado + ' late';
            if (!sobra && motivo === 'v-cv') {
                // lo que va JUNTO: la consonante y la vocal de detrás (con «ch», «ll», «rr»… hasta la vocal)
                for (var q = p; q < w.length && self.letras[q]; q++) { self.letras[q].classList.add('resalta'); if (/[aeiouáéíóúü]/i.test(w[q])) break; }
                return;
            }
            if (self.letras[p - 1]) self.letras[p - 1].classList.add('resalta');
            if (self.letras[p]) self.letras[p].classList.add('resalta');
        });
        if (etiqueta) this.dicho(etiqueta);
    };
    P.cortesCorrectos = function () {
        var self = this, A = this.A;
        this.bocadillo.classList.remove('ver');
        this.letras.forEach(function (l) { l.classList.remove('resalta'); });
        this.huecos.forEach(function (h) { h.className = 'ig-h'; });
        A.cortes.forEach(function (pos, k) { self.tarde(k * 260, function () { self.huecos[pos - 1].classList.add('on', 'ok'); }); });
        this.tarde(A.cortes.length * 260 + 150, function () {
            self.chips().forEach(function (c, i) { c.style.transitionDelay = (i * 140) + 'ms'; c.classList.add('ver'); });
        });
    };

    /* ---------- ventana ---------- */
    /* La explicación avanza sola de un paso al siguiente. Con ◀ ▶ (o las flechas del teclado, o tocando un punto)
       se salta a otro paso: a partir de ese momento ya NO avanza sola, solo a mano. */
    function mostrar(datos) {
        return new Promise(function (resolve) {
            var previo = document.activeElement;
            var script;
            try { script = preparar(datos); } catch (e) { console.warn('Infografia', e); return Explicacion.mostrar(datos).then(resolve); }
            var beats = script.beats, A = script.A, total = beats.length;

            var velo = el('div', 'dialog-overlay ig-overlay');
            velo.innerHTML =
                '<div class="dialog-box ig-box" role="dialog" aria-modal="true" aria-label="Explicación animada">' +
                    '<button type="button" class="close-x ig-cerrar" aria-label="Cerrar">✕</button>' +
                    '<div class="ig-cabecera"><span class="ig-claqueta">🎬 Explicación</span><span class="ig-voz-estado"></span><div class="ig-puntos"></div></div>' +
                    '<div class="ig-escenario"></div>' +
                    '<div class="ig-subtitulo"></div>' +
                    '<div class="ig-nav">' +
                        '<button type="button" class="btn-secondary ig-atras" aria-label="Paso anterior"><span class="ig-ico">◀</span><span class="ig-txt"> Atrás</span></button>' +
                        '<button type="button" class="btn-secondary ig-pausa" aria-label="Pausar al terminar este paso"></button>' +
                        '<button type="button" class="btn-secondary ig-repetir" aria-label="Repetir este paso"><span class="ig-ico">↻</span><span class="ig-txt"> Repetir</span></button>' +
                        '<button type="button" class="btn-secondary ig-adelante" aria-label="Paso siguiente"><span class="ig-txt">Adelante </span><span class="ig-ico">▶</span></button>' +
                    '</div>' +
                    '<div class="dialog-actions ig-acciones"><button type="button" class="btn-primary ig-ok">Saltar ⏭</button></div>' +
                '</div>';
            document.body.appendChild(velo);

            var puntos = velo.querySelector('.ig-puntos'), sub = velo.querySelector('.ig-subtitulo'), estadoVoz = velo.querySelector('.ig-voz-estado');
            var botonOk = velo.querySelector('.ig-ok'), botonRep = velo.querySelector('.ig-repetir');
            var botonAtras = velo.querySelector('.ig-atras'), botonAdelante = velo.querySelector('.ig-adelante'), botonPausa = velo.querySelector('.ig-pausa');
            beats.forEach(function (x, k) { var p = el('button', 'ig-punto'); p.type = 'button'; p.dataset.k = k; p.setAttribute('aria-label', 'Ir al paso ' + (k + 1)); puntos.appendChild(p); });

            var cerrado = false, ejecucion = 0, escena = null;
            var idx = 0, manual = false, terminado = false;
            var pausaPedida = false, detenido = false, ultimoVoz = '';     // pausa: se detiene al terminar el paso en curso
            Sonido.mantenerBajo(true);                          // la música se queda baja mientras dura la explicación

            function cerrar() {
                if (cerrado) return;
                cerrado = true; ejecucion++;
                document.removeEventListener('keydown', onKey, true);
                window.removeEventListener('resize', alRedimensionar);
                if (escena) escena.parar();
                Voz.parar();
                Sonido.mantenerBajo(false);                         // y sube suave al cerrarla
                Sonido.efecto('click');
                velo.classList.add('dialog-out');
                setTimeout(function () { velo.remove(); }, 200);
                if (previo && typeof previo.focus === 'function') previo.focus();
                resolve();
            }

            function pintar(vozTexto) {
                ultimoVoz = vozTexto || '';
                var finTotal = terminado && idx >= total - 1 && !manual;      // solo al acabar la última fase quedan todos como hechos
                [].forEach.call(puntos.children, function (p, k) { p.className = 'ig-punto' + (k < idx || finTotal ? ' hecho' : '') + (k === idx && !finTotal ? ' ahora' : ''); });
                botonAtras.disabled = idx <= 0;
                botonAdelante.disabled = idx >= total - 1;
                botonOk.textContent = terminado && idx >= total - 1 ? '¡Entendido! Siguiente ➜' : 'Saltar ⏭';
                var etiqueta = detenido ? '⏸ en pausa' : pausaPedida ? '⏸ se parará al terminar este paso' : manual ? '✋ manual' : '';
                estadoVoz.textContent = (vozTexto || '') + (etiqueta ? (vozTexto ? ' · ' : '') + etiqueta : '');
                var seguir = manual || pausaPedida;
                botonPausa.innerHTML = seguir ? '<span class="ig-ico">▶</span><span class="ig-txt"> Seguir</span>' : '<span class="ig-ico">⏸</span><span class="ig-txt"> Pausa</span>';
                botonPausa.setAttribute('aria-label', seguir ? 'Seguir con la explicación' : 'Pausar al terminar este paso');
                botonPausa.disabled = idx >= total - 1 && terminado;
            }

            function esperar(ms, yo) { return new Promise(function (ok) { setTimeout(ok, ms); }).then(function () { return yo === ejecucion; }); }

            /* la escena tal como queda justo antes del paso i (los pasos anteriores se aplican de golpe) */
            function construirEscena(hasta) {
                if (escena) escena.parar();
                escena = new Escena(velo.querySelector('.ig-escenario'), A, datos.tipo);
                escena.rapido = true;
                for (var k = 0; k < hasta; k++) {
                    var x = beats[k];
                    x.anim(escena);
                    var segsX = Array.isArray(x.voz) ? x.voz : [x.voz];
                    segsX.forEach(function (sg, q) {
                        if (typeof sg === 'object' && sg.sil) { if (x.sil) sg.sil.forEach(function (z, kk) { x.sil(escena, kk); }); }
                        else if (x.seg) x.seg(escena, q);
                    });
                }
                escena.rapido = false;
                escena.encajar();
            }

            /* muestra el paso i y lo cuenta; devuelve false si se canceló por el camino */
            async function ejecutarPaso(i, yo) {
                var b = beats[i];
                idx = i; terminado = false;
                var conVoz = Voz.estado() === 'lista';
                pintar(conVoz ? '🔊' : (Voz.estado() === 'cargando' ? '⏳ cargando la voz…' : ''));
                sub.classList.remove('ver'); void sub.offsetWidth;
                sub.innerHTML = b.cap; sub.classList.add('ver');
                b.anim(escena);
                if (conVoz) {
                    await Voz.decir(b.voz, {
                        pausa: PAUSA_FRASE,
                        alFrase: function (fi, tot, dur, seg, marcas, silK) {
                            if (yo !== ejecucion) return;
                            if (silK != null && b.sil) b.sil(escena, silK);          // sílaba a sílaba: se anima al empezar cada una
                            else if (marcas && b.sil) marcas.forEach(function (t, k) { escena.tarde(t * 1000, function () { b.sil(escena, k); }); });   // sílaba a sílaba, en su momento
                            else if (b.seg) b.seg(escena, seg, fi, dur);
                        }
                    });
                } else {
                    // sin voz: cada segmento dura lo que tardaría en leerse
                    var segs = Array.isArray(b.voz) ? b.voz : [b.voz], acumulado = 0;
                    segs.forEach(function (x, k) {
                        if (typeof x === 'object' && x.sil) {
                            x.sil.forEach(function (z, kk) { if (b.sil) { var cuando = acumulado + kk * 900; escena.tarde(cuando, function () { b.sil(escena, kk); }); } });
                            acumulado += x.sil.length * 900;
                        } else {
                            var t = typeof x === 'string' ? x : x.t;
                            if (b.seg) { var cuando2 = acumulado; escena.tarde(cuando2, function () { b.seg(escena, k); }); }
                            acumulado += 700 + t.length * 62 + (typeof x === 'string' ? PAUSA_FRASE : (x.pausa || 0));
                        }
                    });
                    if (!(await esperar(acumulado, yo))) return false;
                }
                return yo === ejecucion;
            }

            /* reproduce desde el paso i; en modo manual se queda en ese paso, si no sigue solo hasta el final */
            async function correr(i, reconstruir) {
                var yo = ++ejecucion;
                Voz.parar();
                if (escena) escena.parar();
                if (reconstruir || !escena) construirEscena(i);
                for (var j = i; j < total; j++) {
                    if (!(await ejecutarPaso(j, yo))) return;
                    terminado = true;
                    if (manual) { pintar(''); return; }                 // a mano: aquí se detiene
                    if (pausaPedida && j < total - 1) { detenido = true; pintar(''); return; }   // pausa: se detiene al terminar el paso
                    if (j < total - 1) {
                        terminado = false; pintar('');
                        if (!(await esperar(PAUSA_PASO, yo))) return;
                    }
                }
                pintar('');
                try { botonOk.focus({ preventScroll: true }); } catch (e) {}
            }

            function ir(i) {
                manual = true; pausaPedida = false; detenido = false;       // desde aquí ya no avanza solo
                i = Math.max(0, Math.min(total - 1, i));
                Sonido.efecto('click');
                correr(i, true);
            }

            function onKey(ev) {
                if (ev.key === 'ArrowLeft') { ev.preventDefault(); ev.stopPropagation(); if (idx > 0) ir(idx - 1); }
                else if (ev.key === 'ArrowRight') { ev.preventDefault(); ev.stopPropagation(); if (idx < total - 1) ir(idx + 1); }
                else if (ev.key === 'p' || ev.key === 'P') { ev.preventDefault(); ev.stopPropagation(); pulsarPausa(); }
                else if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); cerrar(); }
            }
            document.addEventListener('keydown', onKey, true);
            function alRedimensionar() { if (escena) escena.encajar(); }
            window.addEventListener('resize', alRedimensionar);
            botonOk.addEventListener('click', cerrar);
            velo.querySelector('.ig-cerrar').addEventListener('click', cerrar);
            botonAtras.addEventListener('click', function () { if (idx > 0) ir(idx - 1); });
            botonAdelante.addEventListener('click', function () { if (idx < total - 1) ir(idx + 1); });
            botonRep.addEventListener('click', function () { ir(idx); });
            /* Pausa: no corta el paso en curso, pero al terminarlo no pasa al siguiente. «Seguir» reanuda en automático */
            function pulsarPausa() {
                if (botonPausa.disabled) return;
                Sonido.efecto('click');
                if (!manual && !pausaPedida) { pausaPedida = true; pintar(ultimoVoz); return; }          // pedir pausa
                if (pausaPedida && !detenido && !manual) { pausaPedida = false; pintar(ultimoVoz); return; }   // arrepentirse
                var sig = terminado ? idx + 1 : idx;                                                       // reanudar
                manual = false; pausaPedida = false; detenido = false;
                if (sig < total) correr(sig, !terminado); else pintar('');
            }
            botonPausa.addEventListener('click', pulsarPausa);
            puntos.addEventListener('click', function (ev) { var p = ev.target.closest('.ig-punto'); if (p) ir(parseInt(p.dataset.k, 10)); });

            correr(0, true);
        });
    }

    return { mostrar: mostrar, preparar: preparar, aVoz: aVoz };

})();
