/* =========================================================
   Silabeo · motor de sílabas, sílaba tónica y clasificación
   Divide las palabras por GOLPES DE VOZ (silabeo fonético), no por la
   separación de final de renglón: ahu-mar, su-bra-yar, prohi-bir.

   Sirve igual en el navegador (window.Silabeo) y en Node (require).

   Silabeo.analizar('murciélago') →
     { palabra, silabas: ['mur','cié','la','go'], cortes: [3,6,8],
       tonica: 1, pos: 3 (desde el final), clase: 'esdrujula',
       tilde: true, terminacion: 'vocal', tildeEn: 1, juntas: [...] }

   Cada "junta" es el hueco entre dos letras (índice 1…n-1) y dice si ahí
   hay corte y por qué: lo usa la explicación de errores.
   ========================================================= */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.Silabeo = factory();
})(typeof self !== 'undefined' ? self : this, function () {

    var VOCALES = 'aeiouáéíóúü';
    var FUERTES = 'aeoáéó';
    var DEBILES_TILDE = 'íú';
    var CON_TILDE = 'áéíóú';
    var INSEPARABLES = { pl: 1, bl: 1, fl: 1, gl: 1, cl: 1, kl: 1, pr: 1, br: 1, fr: 1, gr: 1, cr: 1, kr: 1, tr: 1, dr: 1 };

    /* Palabras que las reglas no resuelven bien: 'palabra': 'sí-la-bas' */
    var EXCEPCIONES = Object.create(null);

    function quitarTildes(s) {
        return s.normalize('NFD').replace(/́/g, '').normalize('NFC');
    }
    function tieneTilde(s) { return /[áéíóú]/.test(s); }

    /* ---------- 1. unidades: vocales, consonantes, dígrafos y h ---------- */
    function unidades(w) {
        var u = [], n = w.length, i = 0;
        while (i < n) {
            var c = w[i], d = w[i + 1], e = w[i + 2];
            if (c === 'q' && d === 'u') { u.push({ t: 'C', s: 'qu', dig: true }); i += 2; }
            else if (c === 'g' && d === 'u' && e && 'eiéí'.indexOf(e) >= 0) { u.push({ t: 'C', s: 'gu', dig: true }); i += 2; }
            else if (c === 'c' && d === 'h') { u.push({ t: 'C', s: 'ch', dig: true }); i += 2; }
            else if (c === 'l' && d === 'l') { u.push({ t: 'C', s: 'll', dig: true }); i += 2; }
            else if (c === 'r' && d === 'r') { u.push({ t: 'C', s: 'rr', dig: true }); i += 2; }
            else if (c === 'h') { u.push({ t: 'H', s: 'h' }); i++; }
            else if (c === 'y' && i === n - 1) { u.push({ t: 'V', s: 'y' }); i++; }   // rey, hoy, y
            else if (VOCALES.indexOf(c) >= 0) { u.push({ t: 'V', s: c }); i++; }
            else { u.push({ t: 'C', s: c }); i++; }
        }
        return u;
    }

    /* fuerte (a e o), débil (i u ü y) o débil con tilde (í ú) */
    function clase(v) {
        if (FUERTES.indexOf(v.s) >= 0) return 'F';
        if (DEBILES_TILDE.indexOf(v.s) >= 0) return 'T';
        return 'D';
    }
    /* ¿Dos vocales seguidas se separan? (hiato) */
    function hiato(a, b) {
        var x = clase(a), y = clase(b);
        if (x === 'F' && y === 'F') return true;
        if ((x === 'T' && y === 'F') || (x === 'F' && y === 'T')) return true;
        return false;   // fuerte+débil, débil+débil (incluido uí, iú): diptongo
    }

    function separable(izq, der) {
        return !(izq.s.length === 1 && der.s.length === 1 && INSEPARABLES[izq.s + der.s]);
    }

    /* ---------- 2. silabear ---------- */
    function silabearReglas(w) {
        var us = unidades(w), i = 0, partes = [];   // alterna: grupo de consonantes / núcleo
        var consonantes = [];

        function volcarConsonantes() { partes.push({ k: 'K', us: consonantes }); consonantes = []; }

        while (i < us.length) {
            if (us[i].t === 'V') {
                volcarConsonantes();
                /* racha de vocales (la h entre dos vocales no las separa) */
                var racha = [{ u: us[i], h: null }], j = i + 1;
                for (;;) {
                    if (us[j] && us[j].t === 'V') { racha.push({ u: us[j], h: null }); j++; }
                    else if (us[j] && us[j].t === 'H' && us[j + 1] && us[j + 1].t === 'V') { racha.push({ u: us[j + 1], h: us[j] }); j += 2; }
                    else break;
                }
                /* se reparte en núcleos: solo se corta en los hiatos */
                var nucleos = [{ us: [racha[0].u], fuerte: clase(racha[0].u) !== 'D' }];
                var huecos = [];
                for (var k = 1; k < racha.length; k++) {
                    var actual = nucleos[nucleos.length - 1];
                    var previa = actual.us[actual.us.length - 1];
                    var nueva = racha[k].u, esF = clase(nueva) === 'F';
                    /* débil tras h entre dos fuertes: se une a la que sigue (ca-ca-hue-te) */
                    var haciaDelante = racha[k].h && clase(nueva) === 'D' && actual.fuerte &&
                        racha[k + 1] && clase(racha[k + 1].u) === 'F';
                    var corta = hiato(previa, nueva) || (esF && actual.fuerte) || haciaDelante;
                    if (corta) {
                        huecos.push(racha[k].h ? [racha[k].h] : []);
                        nucleos.push({ us: [nueva], fuerte: clase(nueva) !== 'D' });
                    } else {
                        if (racha[k].h) actual.us.push(racha[k].h);
                        actual.us.push(nueva);
                        if (clase(nueva) !== 'D') actual.fuerte = true;
                    }
                }
                nucleos.forEach(function (n, idx) {
                    if (idx > 0) partes.push({ k: 'K', us: huecos[idx - 1] });
                    partes.push({ k: 'N', us: n.us });
                });
                i = j;
            } else {
                consonantes.push(us[i]);
                i++;
            }
        }
        volcarConsonantes();   // consonantes finales

        /* reparto de cada grupo de consonantes entre sílabas */
        var silabas = [];   // { us: [{u, rol}] }
        var actual = null;
        for (var p = 0; p < partes.length; p++) {
            var pt = partes[p];
            if (pt.k === 'N') {
                if (!actual) actual = { us: [] };
                pt.us.forEach(function (u) { actual.us.push({ u: u, rol: 'N' }); });
            } else {
                var cs = pt.us;
                var primero = (p === 0), ultimo = (p === partes.length - 1);
                if (primero) {                       // inicio de palabra: todo es ataque
                    actual = { us: cs.map(function (u) { return { u: u, rol: 'A' }; }) };
                } else if (ultimo) {                 // final: todo es coda de la última sílaba
                    cs.forEach(function (u) { actual.us.push({ u: u, rol: 'C' }); });
                } else if (cs.length === 0) {
                    silabas.push(actual); actual = { us: [] };
                } else {
                    var m = cs.length, ataque = 1;
                    if (m >= 2 && !separable(cs[m - 2], cs[m - 1])) ataque = 2;
                    cs.slice(0, m - ataque).forEach(function (u) { actual.us.push({ u: u, rol: 'C' }); });
                    silabas.push(actual);
                    actual = { us: cs.slice(m - ataque).map(function (u) { return { u: u, rol: 'A' }; }) };
                }
            }
        }
        if (actual) silabas.push(actual);
        /* palabra sin vocales (siglas, etc.): una sola "sílaba" */
        if (!silabas.length) silabas.push({ us: us.map(function (u) { return { u: u, rol: 'A' }; }) });
        return silabas;
    }

    /* motivo de cada hueco entre dos letras */
    function motivoJunta(a, b, corte, nVocales) {
        if (!b) return null;
        if (a === b) return 'digrafo';                                 // dentro de ch, ll, rr, qu, gu
        var x = a.rol, y = b.rol, ua = a.u, ub = b.u;
        if (!corte) {
            if (x === 'N' && y === 'N') return nVocales >= 3 ? 'triptongo' : 'diptongo';
            if (x === 'A' && y === 'A') return 'inseparable';
            if (x === 'A' && y === 'N') return 'cv';
            if (x === 'N' && y === 'C') return 'cierra';
            return 'coda';
        }
        if (x === 'N' && y === 'N') return 'hiato';
        if (x === 'N' && ub.t === 'H') return 'hiato';
        if (x === 'N' && y === 'A') return 'v-cv';
        if (x === 'C' && y === 'A') return 'cc';
        return 'v-cv';
    }

    /* ---------- 3. análisis completo ---------- */
    function analizar(palabra) {
        var w = String(palabra).normalize('NFC').toLowerCase();
        var silabas, planas = [], letras = [], sil = [];
        var ex = EXCEPCIONES[w];
        var estructura = silabearReglas(w);

        /* aplanamos las letras con su sílaba y rol */
        estructura.forEach(function (s, idx) {
            s.us.forEach(function (it) {
                for (var q = 0; q < it.u.s.length; q++) {
                    letras.push({ ch: it.u.s[q], silaba: idx, rol: it.rol, u: it.u, dentro: q > 0 });
                }
            });
        });

        var cortes = [];
        for (var l = 1; l < letras.length; l++) if (letras[l].silaba !== letras[l - 1].silaba) cortes.push(l);

        if (ex) {   // la excepción manda sobre las reglas
            var partes = ex.split('-'), pos = 0;
            cortes = [];
            partes.forEach(function (pr, ix) { pos += pr.length; if (ix < partes.length - 1) cortes.push(pos); });
            if (pos !== w.length) cortes = cortes.filter(function (c) { return c < w.length; });
        }

        silabas = [];
        var ini = 0;
        cortes.concat([w.length]).forEach(function (c) { silabas.push(w.slice(ini, c)); ini = c; });

        /* juntas (huecos entre letras) con su motivo */
        var nVoc = estructura.map(function (s) { return s.us.filter(function (it) { return it.u.t === 'V'; }).length; });
        var juntas = [];
        for (var g = 1; g < letras.length; g++) {
            var a = letras[g - 1], b = letras[g], corte = cortes.indexOf(g) >= 0;
            var dig = (a.u === b.u);
            juntas.push({
                pos: g,
                corte: corte,
                motivo: dig ? 'digrafo' : motivoJunta(a, b, corte, nVoc[b.silaba]),
                izq: a.ch, der: b.ch
            });
        }

        /* sílaba tónica */
        var tildadas = [];
        silabas.forEach(function (s, ix) { if (tieneTilde(s)) tildadas.push(ix); });
        var ult = w[w.length - 1], pen = w[w.length - 2];
        var terminacion = VOCALES.indexOf(ult) >= 0 ? 'vocal'
            : ult === 'n' ? 'n'
            : (ult === 's' && pen && VOCALES.indexOf(pen) >= 0) ? 's'
            : 'otra';
        var normal = (terminacion !== 'otra');   // vocal, n o s

        var tonica, posDesdeFinal, nombre;
        var n = silabas.length;
        if (tildadas.length) tonica = tildadas[0];
        else if (n === 1) tonica = 0;
        else tonica = normal ? n - 2 : n - 1;
        posDesdeFinal = n - tonica;
        nombre = n === 1 ? 'monosilaba'
            : posDesdeFinal === 1 ? 'aguda'
            : posDesdeFinal === 2 ? 'llana'
            : posDesdeFinal === 3 ? 'esdrujula'
            : 'sobresdrujula';

        return {
            palabra: w,
            silabas: silabas,
            cortes: cortes,
            juntas: juntas,
            roles: letras.map(function (x) { return x.rol; }).join(''),   // N núcleo · A ataque · C coda, letra a letra
            tonica: tonica,
            pos: posDesdeFinal,
            clase: nombre,
            tilde: tildadas.length > 0,
            tildeEn: tildadas.length ? tildadas[0] : -1,
            variasTildes: tildadas.length > 1,
            terminacion: terminacion,
            normal: normal
        };
    }

    /* ¿La tilde de la palabra está justificada por las reglas? (para validar el diccionario)
       Devuelve '' si todo cuadra o un texto con el motivo si no. */
    function revisarTilde(a) {
        var w = a.palabra;
        if (a.variasTildes) return 'varias tildes';
        if (a.clase === 'monosilaba') return a.tilde ? 'monosílaba con tilde (¿diacrítica?)' : '';
        if (!a.tilde) {
            return '';
        }
        if (a.clase === 'esdrujula' || a.clase === 'sobresdrujula') return '';
        var justificada = (a.clase === 'aguda' && a.normal) || (a.clase === 'llana' && !a.normal);
        if (justificada) return '';
        /* tilde de hiato: í o ú junto a una vocal fuerte */
        var t = a.silabas[a.tildeEn], idx = 0;
        for (var i = 0; i < a.tildeEn; i++) idx += a.silabas[i].length;
        var m = t.search(/[áéíóú]/);
        var letra = t[m], pos = idx + m;
        if (DEBILES_TILDE.indexOf(letra) >= 0) {
            var ant = w[pos - 1], ant2 = w[pos - 2], sig = w[pos + 1];
            if ((ant && FUERTES.indexOf(ant) >= 0) || (ant === 'h' && ant2 && FUERTES.indexOf(ant2) >= 0) || (sig && FUERTES.indexOf(sig) >= 0)) return '';
        }
        return 'tilde no justificada (' + a.clase + ', termina en ' + a.terminacion + ')';
    }

    return {
        analizar: analizar,
        revisarTilde: revisarTilde,
        quitarTildes: quitarTildes,
        tieneTilde: tieneTilde,
        excepciones: EXCEPCIONES
    };
});
