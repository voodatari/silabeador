/* =========================================================
   Voz · interfaz: opciones e indicador de carga
   - «Voz en las palabras»: pronuncia cada palabra nueva (activada por defecto)
   - «Explicación animada con voz»: al fallar se muestra la infografía animada narrada (si no, la explicación escrita)
   - «Explicar los fallos»: No · En práctica (por defecto) · Siempre (también en contrarreloj, muerte súbita y supervivencia: el juego se pausa)
   El motor (Piper) se carga entero al entrar en la web y se queda en memoria; los ajustes se guardan en localStorage.
   ========================================================= */
window.VozUI = (function () {

    var K_PAL = 'silabeador.vozPalabras', K_EXP = 'silabeador.explicaAnimada', K_CUANDO = 'silabeador.explicarFallos';
    function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function escribir(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function $(id) { return document.getElementById(id); }

    var palabras = leer(K_PAL) !== '0';
    var explica = leer(K_EXP) !== '0';        // activada por defecto
    var cuando = leer(K_CUANDO); if (['no', 'practica', 'siempre'].indexOf(cuando) < 0) cuando = 'practica';
    var alCambiar = null;
    var chip = $('voz-carga'), texto = $('voz-carga-texto'), barra = $('voz-carga-barra');
    var botonPal = $('voz-palabras-button'), botonExp = $('voz-explica-button'), segCuando = $('explicar-seg');
    var ocultar = null;

    function pintar() {
        botonPal.setAttribute('aria-pressed', String(palabras));
        botonExp.setAttribute('aria-pressed', String(explica));
        segCuando.querySelectorAll('button').forEach(function (b) { b.classList.toggle('selected', b.dataset.explicar === cuando); });
        if (alCambiar) alCambiar();
    }

    function esconderChip(ms) {
        ocultar = setTimeout(function () { chip.classList.add('fuera'); setTimeout(function () { chip.classList.add('hidden'); }, 450); }, ms);
    }

    /* indicador de carga: se muestra mientras se descarga y se inicia el modelo */
    function alProgreso(f, estado) {
        clearTimeout(ocultar);
        if (estado === 'cargando' && f < 1) {
            chip.classList.remove('hidden', 'fuera', 'error');
            texto.textContent = '🗣️ Cargando la voz… ' + Math.round(f * 100) + ' %';
            barra.style.width = Math.round(f * 100) + '%';
        } else if (estado === 'lista') {
            barra.style.width = '100%';
            texto.textContent = '✓ Voz lista';
            chip.classList.remove('hidden', 'error');
            esconderChip(1300);
        } else if (estado === 'error') {
            chip.classList.remove('hidden', 'fuera'); chip.classList.add('error');
            texto.textContent = 'No se pudo cargar la voz: el juego sigue sin ella';
            esconderChip(4500);
        }
        if (alCambiar) alCambiar();
    }

    function cargar() {
        if (!palabras && !explica) return;
        Voz.iniciar(alProgreso).catch(function () {});
    }

    function sonar() { if (window.Sonido) Sonido.efecto('click'); }

    botonPal.addEventListener('click', function () {
        sonar(); palabras = !palabras; escribir(K_PAL, palabras ? '1' : '0'); if (!palabras) Voz.parar(); else cargar(); pintar();
    });
    botonExp.addEventListener('click', function () {
        sonar(); explica = !explica; escribir(K_EXP, explica ? '1' : '0'); if (explica) cargar(); pintar();
    });

    segCuando.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        sonar(); cuando = b.dataset.explicar; escribir(K_CUANDO, cuando); pintar();
    });

    // empieza a cargar en cuanto se entra en la web
    cargar();
    pintar();

    return {
        palabras: function () { return palabras; },
        explicacion: function () { return explica; },
        /* ¿se explica un fallo en este modo de juego? */
        explicarEn: function (modo) { return cuando === 'siempre' || (cuando === 'practica' && modo === 'practice'); },
        alCambiar: function (fn) { alCambiar = fn; }
    };

})();
