/* =========================================================
   Escala fija · el juego se ve igual con cualquier escala de Windows
   Con la escala de Windows al 125 % o al 150 %, el navegador solo
   tiene 1536 o 1280 px de ancho (y menos alto) en lugar de 1920:
   las ventanas ocupan proporcionalmente más y algunas no caben.
   Con <html class="escala-fija"> el tamaño base (1 rem) se amplía o
   reduce para ocupar la misma proporción de pantalla que en un
   monitor 1080p al 100 %, algo ampliado para verse bien en el aula (referencia: 1500×720 px útiles). Todo el
   CSS está en rem, así que el juego entero escala a la vez.
   En pantallas estrechas (móvil, tableta en vertical) no se aplica.
   Se carga en el <head> para que la clase esté puesta antes de pintar.
   ========================================================= */
window.Escala = (function (global) {

    var K_ESCALA = 'silabeador.escala';   // '1' / '0' · sin guardar = activada
    var REF_ANCHO = 1500, REF_ALTO = 720;
    var MIN = 0.5, MAX = 2, ANCHO_MINIMO = 900;

    function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function escribir(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    var activa = leer(K_ESCALA) !== '0';

    function calcular() {
        var w = global.innerWidth, h = global.innerHeight;
        if (w < ANCHO_MINIMO) return 1;
        var z = Math.min(w / REF_ANCHO, h / REF_ALTO);
        return Math.round(Math.min(MAX, Math.max(MIN, z)) * 100) / 100;
    }

    function factor() { return activa ? calcular() : 1; }

    function aplicar() {
        var raiz = document.documentElement;
        raiz.classList.toggle('escala-fija', activa);
        raiz.style.setProperty('--escala', String(factor()));
        var b = document.getElementById('scale-toggle-button');
        if (b) {
            b.setAttribute('aria-pressed', String(activa));
            var nota = document.getElementById('scale-toggle-info');
            if (nota) nota.textContent = activa
                ? 'Activada: ahora mismo al ' + Math.round(factor() * 100) + ' %.'
                : 'Mantiene el aspecto previsto aunque Windows use una escala del 125 % o 150 %.';
        }
    }
    aplicar();

    function conectarBoton() {
        var b = document.getElementById('scale-toggle-button');
        if (!b) return;
        b.addEventListener('click', function () {
            activa = !activa;
            escribir(K_ESCALA, activa ? '1' : '0');
            aplicar();
            global.dispatchEvent(new Event('resize'));
        });
        aplicar();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', conectarBoton);
    else conectarBoton();

    global.addEventListener('resize', aplicar);

    return {
        activa: function () { return activa; },
        factor: factor
    };

})(window);
