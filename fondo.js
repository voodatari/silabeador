/* =========================================================
   Fondo animado · con el tema del juego: letras, ondas de voz y golpes de voz
   - letras : letras, sílabas y tildes que flotan como tiza en la pizarra
   - voz    : barras de «ecualizador» que se mueven como una voz hablando
   - golpes : círculos que laten con cada golpe de voz y dejan una sílaba
   En modo ligero usa menos elementos; se pausa si la pestaña no se ve.
   Fondo.set('letras' | 'voz' | 'golpes' | 'none')
   ========================================================= */
window.Fondo = (function () {

    var K_FONDO = 'silabeador.fondo';
    function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function escribir(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    var TIPOS = ['letras', 'voz', 'golpes', 'none'];
    var tipo = leer(K_FONDO);
    if (TIPOS.indexOf(tipo) < 0) tipo = 'voz';

    var VOCALES = 'aeiou', LETRAS = 'bcdfghjlmnpqrstvz';
    var SILABAS = ['ca', 'sa', 'ma', 'ta', 'lla', 'ción', 'mos', 'pe', 'rro', 'ñe', 'to', 'sí', 'lá', 'ba', 'gue', 'ci', 'dor', 'ñor', 'mi', 'ré', 'qui', 'ja', 'za'];
    var CALIDOS = 'rgba(255, 138, 91, ', FRIOS = 'rgba(110, 231, 208, ', TIZA = 'rgba(240, 244, 236, ', AMARILLO = 'rgba(255, 210, 63, ';

    var canvas, ctx, ancho = 0, alto = 0, tiempo = 0, raf = null, ultimo = 0;
    var glifos = [], anillos = [], proximoGolpe = 0;

    function ligero() { return window.Rendimiento && Rendimiento.ligero(); }
    function azar(a, b) { return a + Math.random() * (b - a); }

    /* ---------- letras flotando ---------- */
    function nuevoGlifo(inicial) {
        var r = Math.random(), texto, tam, color;
        if (r < 0.34) { texto = VOCALES[Math.floor(Math.random() * 5)]; tam = azar(40, 96); color = CALIDOS; }
        else if (r < 0.62) { texto = LETRAS[Math.floor(Math.random() * LETRAS.length)]; tam = azar(34, 80); color = TIZA; }
        else if (r < 0.92) { texto = SILABAS[Math.floor(Math.random() * SILABAS.length)]; tam = azar(30, 58); color = FRIOS; }
        else { texto = '´'; tam = azar(60, 130); color = AMARILLO; }
        return {
            t: texto, tam: tam, c: color,
            x: Math.random() * ancho, y: inicial ? Math.random() * alto : alto + tam,
            vy: -azar(0.12, 0.42), vx: azar(-0.12, 0.12), rot: azar(-0.4, 0.4), vr: azar(-0.003, 0.003),
            a: azar(0.07, 0.17), f: Math.random() * 6
        };
    }

    function pintarLetras() {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (var i = 0; i < glifos.length; i++) {
            var g = glifos[i];
            g.x += g.vx + Math.sin(tiempo * 0.6 + g.f) * 0.15; g.y += g.vy; g.rot += g.vr;
            if (g.y < -g.tam * 1.5) { glifos[i] = nuevoGlifo(false); continue; }
            ctx.save();
            ctx.translate(g.x, g.y); ctx.rotate(g.rot);
            ctx.font = '700 ' + g.tam + 'px Andika, sans-serif';
            ctx.fillStyle = g.c + g.a + ')';
            ctx.fillText(g.t, 0, 0);
            ctx.restore();
        }
    }

    /* ---------- ondas de voz (ecualizador) ---------- */
    function pintarVoz() {
        var ancho_b = ligero() ? 34 : 22, n = Math.ceil(ancho / ancho_b), base = alto * 0.78;
        // la «voz» sube y baja como frases: una envolvente lenta que modula las barras
        var frase = 0.55 + 0.45 * Math.sin(tiempo * 0.9) * Math.sin(tiempo * 0.37 + 1.3);
        for (var i = 0; i < n; i++) {
            var x = i * ancho_b + ancho_b / 2;
            var v = Math.abs(Math.sin(i * 0.31 + tiempo * 2.1) * Math.cos(i * 0.12 - tiempo * 1.3)) * 0.65 +
                    Math.abs(Math.sin(i * 0.9 + tiempo * 3.4)) * 0.35;
            var h = (alto * 0.22) * Math.max(0.05, v * (0.35 + frase));
            var grad = ctx.createLinearGradient(0, base - h, 0, base + h);
            grad.addColorStop(0, CALIDOS + '0.34)'); grad.addColorStop(0.5, AMARILLO + '0.22)'); grad.addColorStop(1, FRIOS + '0.30)');
            ctx.fillStyle = grad;
            var w = ancho_b * 0.52, r = w / 2;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x - r, base - h, w, h * 2, r); else ctx.rect(x - r, base - h, w, h * 2);
            ctx.fill();
        }
        ctx.strokeStyle = TIZA + '0.10)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(ancho, base); ctx.stroke();
    }

    /* ---------- golpes de voz ---------- */
    function nuevoGolpe() {
        anillos.push({
            x: azar(ancho * 0.1, ancho * 0.9), y: azar(alto * 0.15, alto * 0.85), r: 0, max: azar(110, 230),
            t: SILABAS[Math.floor(Math.random() * SILABAS.length)], c: [CALIDOS, FRIOS, AMARILLO][Math.floor(Math.random() * 3)]
        });
    }

    function pintarGolpes(dt) {
        proximoGolpe -= dt;
        if (proximoGolpe <= 0 && anillos.length < (ligero() ? 3 : 6)) { nuevoGolpe(); proximoGolpe = azar(0.5, 1.3); }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (var i = anillos.length - 1; i >= 0; i--) {
            var a = anillos[i];
            a.r += dt * 95;
            var p = a.r / a.max;
            if (p >= 1) { anillos.splice(i, 1); continue; }
            var op = (1 - p) * 0.62;
            ctx.lineWidth = 4;
            for (var k = 0; k < 3; k++) {          // tres ondas, como el eco de un golpe
                var rr = a.r - k * 22;
                if (rr <= 2) continue;
                ctx.strokeStyle = a.c + (op * (1 - k * 0.3)) + ')';
                ctx.beginPath(); ctx.arc(a.x, a.y, rr, 0, Math.PI * 2); ctx.stroke();
            }
            var pop = p < 0.18 ? p / 0.18 : 1;     // la sílaba salta al principio del golpe
            ctx.font = '700 ' + Math.round(34 + 14 * pop) + 'px Andika, sans-serif';
            ctx.fillStyle = a.c + ((1 - p) * 0.8) + ')';
            ctx.fillText(a.t, a.x, a.y);
        }
    }

    /* ---------- bucle ---------- */
    function crear() {
        glifos = []; anillos = [];
        var n = ligero() ? 12 : 26;
        for (var i = 0; i < n; i++) glifos.push(nuevoGlifo(true));
    }

    function medir() {
        ancho = canvas.width = window.innerWidth;
        alto = canvas.height = window.innerHeight;
        crear();
    }

    function bucle(ahora) {
        raf = null;
        if (document.hidden || tipo === 'none') { ctx.clearRect(0, 0, ancho, alto); return; }
        var dt = Math.min(0.05, (ahora - (ultimo || ahora)) / 1000);
        ultimo = ahora;
        tiempo += dt;
        ctx.clearRect(0, 0, ancho, alto);
        if (tipo === 'letras') pintarLetras();
        else if (tipo === 'voz') pintarVoz();
        else pintarGolpes(dt);
        raf = requestAnimationFrame(bucle);
    }

    function arrancar() { ultimo = 0; if (!raf && tipo !== 'none') raf = requestAnimationFrame(bucle); }

    function iniciar() {
        canvas = document.getElementById('bg-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        medir();
        window.addEventListener('resize', medir);
        document.addEventListener('visibilitychange', arrancar);
        arrancar();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();

    return {
        tipo: function () { return tipo; },
        set: function (t) {
            if (TIPOS.indexOf(t) < 0) return;
            tipo = t;
            escribir(K_FONDO, t);
            anillos = [];
            if (ctx) { ctx.clearRect(0, 0, ancho, alto); arrancar(); }
        },
        recrear: function () { if (ctx) crear(); }
    };

})();
