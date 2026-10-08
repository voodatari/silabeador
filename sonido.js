/* =========================================================
   Sonido · música de fondo (en bucle sin cortes) y efectos
   La elección de música / efectos se guarda en localStorage.
   Sonido.musica('menu' | 'fin' | 'timeattack' | 'sudden_death' | 'survival' | 'practice')
   Sonido.efecto('click' | 'acierto' | 'error' | 'start')
   ========================================================= */
window.Sonido = (function () {

    var K_MUSICA = 'silabeador.musica', K_EFECTOS = 'silabeador.efectos';
    function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function escribir(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    var musicaOn = leer(K_MUSICA) !== '0';
    var efectosOn = leer(K_EFECTOS) !== '0';

    var PISTAS = {
        menu: 'music/titulo.mp3', fin: 'music/fin.mp3',
        timeattack: 'music/2.mp3', sudden_death: 'music/3.mp3', survival: 'music/2.mp3', practice: 'music/1.mp3'
    };
    var VOLUMEN = { menu: 0.4, fin: 0.4 };
    var EFECTOS = {
        click: 'music/click.wav', acierto: 'music/acierto.mp3', error: 'music/error.mp3', start: 'music/start.mp3'
    };

    var pistas = {};      // archivo → MusicaBucle (se crean al pedirlas)
    var actual = null;    // nombre de la pista que debe sonar
    var fx = {};

    function efecto(nombre, volumen) {
        if (!efectosOn || !EFECTOS[nombre]) return;
        try {
            var a = fx[nombre] || (fx[nombre] = new Audio(EFECTOS[nombre]));
            a.pause();
            a.currentTime = 0;
            a.volume = volumen == null ? 1 : volumen;
            var p = a.play();
            if (p && p.catch) p.catch(function () {});
        } catch (e) {}
    }

    /* «Woosh» al cortar: barrido de ruido que sube de grave a agudo, como el amarillo subiendo por la línea.
       Se genera con Web Audio (no necesita archivo). */
    var ctxFx = null, ruido = null;
    function woosh() {
        if (!efectosOn) return;
        try {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            ctxFx = ctxFx || new AC();
            if (ctxFx.state === 'suspended') ctxFx.resume();
            if (!ruido) {
                var n = Math.floor(ctxFx.sampleRate * 0.4), buf = ctxFx.createBuffer(1, n, ctxFx.sampleRate), d = buf.getChannelData(0);
                for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
                ruido = buf;
            }
            var t = ctxFx.currentTime, dur = 0.24;
            var src = ctxFx.createBufferSource(); src.buffer = ruido;
            var bp = ctxFx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
            bp.frequency.setValueAtTime(450, t); bp.frequency.exponentialRampToValueAtTime(3400, t + dur);
            var g = ctxFx.createGain();
            g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1.0, t + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            src.connect(bp); bp.connect(g); g.connect(ctxFx.destination);
            src.start(t); src.stop(t + dur + 0.03);
        } catch (e) {}
    }

    function pista(nombre) {
        var src = PISTAS[nombre], p = pistas[src];
        if (!p) {
            p = pistas[src] = new MusicaBucle(src, { preload: 'auto' });
            p.volume = VOLUMEN[nombre] || 0.3;
        }
        return p;
    }

    function tocar(nombre) {
        var r;
        try { r = pista(nombre).play(); } catch (e) {}
        if (r && r.catch) r.catch(function () { /* el navegador espera un primer toque: ver desbloquear() */ });
    }

    function parar() {
        Object.keys(pistas).forEach(function (s) { try { pistas[s].pause(); } catch (e) {} });
    }

    /* Cambiar de pista (o de modo) la empieza desde el principio; si ya suena la misma, sigue.
       Con reiniciar = true vuelve a empezar aunque ya estuviera sonando. */
    function musica(nombre, reiniciar) {
        actual = nombre;
        if (!musicaOn || !PISTAS[nombre]) return;
        var src = PISTAS[nombre];
        Object.keys(pistas).forEach(function (s) { if (s !== src) pistas[s].pause(); });
        var p = pistas[src];
        if (p && !p.paused && !reiniciar) return;
        if (p) { p.pause(); p.currentTime = 0; }
        tocar(nombre);
    }

    function silenciar() { actual = null; parar(); }

    /* Los navegadores no dejan sonar hasta el primer toque: entonces se reanuda lo pendiente */
    function desbloquear() {
        if (musicaOn && actual) {
            var p = pistas[PISTAS[actual]];
            if (!p || p.paused) tocar(actual);
        }
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, desbloquear, true); });

    return {
        musica: musica,
        parar: silenciar,
        efecto: efecto,
        woosh: woosh,
        musicaActiva: function () { return musicaOn; },
        efectosActivos: function () { return efectosOn; },
        alternarMusica: function () {
            musicaOn = !musicaOn;
            escribir(K_MUSICA, musicaOn ? '1' : '0');
            if (musicaOn) { if (actual) musica(actual, true); } else parar();
            return musicaOn;
        },
        alternarEfectos: function () {
            efectosOn = !efectosOn;
            escribir(K_EFECTOS, efectosOn ? '1' : '0');
            return efectosOn;
        }
    };

})();
