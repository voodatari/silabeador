/**
 * Silabeador · navegación, partida, resultados y ranking local
 * Actividades: clasificar (aguda/llana/esdrújula) · silabas (dividir) · tonica · combinada (las tres seguidas)
 * Modos: timeattack · sudden_death · survival · practice (con explicación de cada error; en los demás modos, si en Opciones
 *        «Explicar los fallos» está en «Siempre», el juego se pausa por completo —también el reloj— mientras se explica el fallo)
 */
// Las palabras se dicen un poco más despacio (0,85) y con la g clara; fundido de música rápido
const VOZ_PALABRA = { rapido: true, vel: 0.85, claro: true };
// ...y con el acento que sabe el juego (silabeo propio), porque la voz se equivoca a veces con palabras sueltas
// ...y precedidas de una portadora («la,») que se descarta: dicha sola, una palabra suena peor que dentro de una frase
const PORTADORA_PALABRAS = 'esta es la palabra';          // '' para desactivarla
function vozPalabra(A) { return Object.assign({ palabra: { silabas: A.silabas, tonica: A.tonica, portadora: PORTADORA_PALABRAS || undefined } }, VOZ_PALABRA); }

const app = {

    // --- ESTADO ---
    state: {
        playerName: '',
        mode: 'timeattack',
        actividad: 'clasificar',
        nivel: 1,                 // 1, 2, 3, 4 (difíciles) · 0 = mixto (1-3)
        tiempo: 60,               // contrarreloj
        score: 0, streak: 0, maxStreak: 0,
        total: 0, aciertos: 0, lives: 3,
        timeRemaining: 0, timerId: null,
        isPlaying: false,
        q: null,                  // pregunta en curso
        recientes: [],            // últimas palabras, para no repetir enseguida
        falladas: [],             // palabras falladas en la partida
        timeouts: [],
        lastRankingKey: null
    },

    TIPOS: {
        clasificar: { nombre: 'Clasificar', velocidad: [2000, 4000] },
        silabas: { nombre: 'Dividir en sílabas', velocidad: [5000, 9000] },
        tonica: { nombre: 'Sílaba tónica', velocidad: [2500, 5000] },
        combinada: { nombre: 'Todo junto', velocidad: [3000, 6000] }
    },
    MODOS: { timeattack: 'CONTRARRELOJ', sudden_death: 'MUERTE SÚBITA', survival: 'SUPERVIVENCIA', practice: 'PRÁCTICA' },
    CLASES: { aguda: 'aguda', llana: 'llana', esdrujula: 'esdrújula' },
    PASOS_COMBINADA: ['silabas', 'tonica', 'clasificar'],
    // Cuenta atrás 3-2-1 antes de empezar: desactivada hasta que haya un modo con base de datos (ranking compartido)
    CUENTA_ATRAS: false,
    ANONIMO: 'Anónimo',
    MULT_NIVEL: { 1: 1, 2: 1.5, 3: 2, 4: 2.5 },
    DESC_NIVEL: {
        1: 'Nivel 1 · palabras muy frecuentes, de hasta 3 sílabas.',
        2: 'Nivel 2 · palabras más variadas, de hasta 4 sílabas.',
        3: 'Nivel 3 · palabras menos habituales, de hasta 5 sílabas.',
        4: 'Nivel 4 · solo palabras difíciles: hiatos, diptongos y grupos de consonantes (examen, corrección…).',
        0: 'Mixto · mezcla los tres niveles.'
    },

    // --- ALMACENAMIENTO (todo local, sin cuentas) ---
    leer(k, def) { try { const v = localStorage.getItem('silabeador.' + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
    guardar(k, v) { try { localStorage.setItem('silabeador.' + k, JSON.stringify(v)); } catch (e) {} },

    later(fn, ms) { const id = setTimeout(fn, ms); this.state.timeouts.push(id); return id; },
    clearLater() { this.state.timeouts.forEach(clearTimeout); this.state.timeouts = []; },
    $(id) { return document.getElementById(id); },

    // --- NAVEGACIÓN ---
    showScreen(screenId, sinSonido) {
        if (!sinSonido) Sonido.efecto('click');
        document.body.classList.toggle('en-juego', screenId === 'screen-game');     // el botón de opciones no se ve durante la partida
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            setTimeout(() => { if (!s.classList.contains('active')) s.classList.add('hidden'); }, 400);
        });
        const target = this.$(screenId);
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active'), 50);

        if (screenId === 'screen-home') this.seguirCinta(900);
        if (screenId === 'screen-ranking') this.abrirRanking();
        if (screenId === 'screen-config') this.pintarConfig();
        if (screenId === 'screen-config' || screenId === 'screen-results') { this.ajustarPanel(screenId); setTimeout(() => this.ajustarPanel(screenId), 450); }
        if (['screen-home', 'screen-modes', 'screen-config'].includes(screenId)) Sonido.musica('menu');
        else if (screenId === 'screen-results' || screenId === 'screen-ranking') Sonido.musica('fin');
    },

    /* Ajusta el contenido de un panel al alto disponible (sin scroll) reduciéndolo un poco si hace falta */
    ajustarPanel(screenId) {
        const pantalla = this.$(screenId); if (!pantalla) return;
        const panel = pantalla.querySelector('.glass-panel'), cont = pantalla.querySelector('.panel-contenido');
        if (!panel || !cont) return;
        cont.style.zoom = 1;
        let z = 1;
        while (panel.scrollHeight > panel.clientHeight + 1 && z > 0.7) { z -= 0.04; cont.style.zoom = z.toFixed(2); }
    },

    // --- INICIALIZACIÓN ---
    init() {
        const nameInput = this.$('player-name'), btnStart = this.$('btn-start');
        const guardado = this.leer('nombre', '');
        if (guardado) { nameInput.value = guardado; this.state.playerName = guardado; }

        const cfg = this.leer('config', {});
        if (this.TIPOS[cfg.actividad]) this.state.actividad = cfg.actividad;
        if ([0, 1, 2, 3, 4].includes(cfg.nivel)) this.state.nivel = cfg.nivel;
        if ([30, 60, 90, 120].includes(cfg.tiempo)) this.state.tiempo = cfg.tiempo;

        nameInput.addEventListener('input', e => {
            this.state.playerName = e.target.value.trim();
        });
        const empezar = () => {
            // sin nombre se juega como «Anónimo» (y no se guarda: la próxima vez el campo sale vacío)
            const nombre = nameInput.value.trim();
            this.state.playerName = nombre || this.ANONIMO;
            this.guardar('nombre', nombre);
            this.showScreen('screen-modes');
        };
        nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') { nameInput.blur(); empezar(); } });
        btnStart.addEventListener('click', empezar);

        document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => this.showScreen(b.dataset.go)));

        document.querySelectorAll('.mode-card').forEach(card => card.addEventListener('click', () => {
            this.state.mode = card.dataset.mode;
            this.showScreen('screen-config');
        }));
        document.querySelectorAll('.activity-card').forEach(card => card.addEventListener('click', () => {
            Sonido.efecto('click');
            this.state.actividad = card.dataset.actividad;
            this.pintarConfig();
        }));
        this.$('level-seg').addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            Sonido.efecto('click');
            this.state.nivel = parseInt(b.dataset.nivel, 10);
            this.pintarConfig();
            this.ajustarPanel('screen-config');
        });
        this.$('time-seg').addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            Sonido.efecto('click');
            this.state.tiempo = parseInt(b.dataset.tiempo, 10);
            this.pintarConfig();
        });
        this.$('btn-play').addEventListener('click', () => {
            this.guardar('config', { actividad: this.state.actividad, nivel: this.state.nivel, tiempo: this.state.tiempo });
            this.startGame();
        });

        this.$('btn-abort').addEventListener('click', () => this.abortar());
        this.$('btn-retry').addEventListener('click', () => { Sonido.efecto('click'); this.startGame(); });
        this.$('btn-otra-actividad').addEventListener('click', () => this.showScreen('screen-config'));   // el mismo modo, otra actividad / nivel
        this.$('btn-change-name').addEventListener('click', () => this.abrirCambioNombre());
        this.$('btn-name-cancel').addEventListener('click', () => { Sonido.efecto('click'); cerrarModal(this.$('modal-change-name')); });
        this.$('btn-name-ok').addEventListener('click', () => this.confirmarNombre());
        this.$('new-player-name').addEventListener('keydown', e => { if (e.key === 'Enter') this.confirmarNombre(); });

        this.$('ranking-mode-select').addEventListener('change', () => this.renderRanking());
        this.$('ranking-activity-select').addEventListener('change', () => this.renderRanking());

        window.addEventListener('resize', () => { this.encajarCortador(); ['screen-config', 'screen-results'].forEach(id => { if (this.$(id).classList.contains('active')) this.ajustarPanel(id); }); });
        if (document.fonts) document.fonts.addEventListener('loadingdone', () => this.encajarCortador());
        document.addEventListener('keydown', e => this.teclado(e));
        window.addEventListener('resize', () => this.posicionarCinta());
        if (window.ResizeObserver) { const pp = document.querySelector('#screen-home .glass-panel'); if (pp) new ResizeObserver(() => this.posicionarCinta()).observe(pp); }
        this.seguirCinta(900);
        this.pintarConfig();
    },

    /* la cinta «v2.0» se coloca sobre la esquina superior derecha de la tarjeta del menú principal */
    posicionarCinta() {
        const sec = this.$('screen-home'), c = sec && sec.querySelector('.cinta-version'), p = sec && sec.querySelector('.glass-panel');
        if (!c || !p) return;
        // medidas de maquetación (offset*), no getBoundingClientRect: la pantalla entra con un scale() y la cinta, que está dentro,
        // ya se escala con ella; con medidas ya escaladas el escalado se aplicaba dos veces y la cinta se veía desplazada
        let x = 0, y = 0, el = p;
        while (el && el !== sec) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
        Object.assign(c.style, { left: x + 'px', top: y + 'px', width: p.offsetWidth + 'px', height: p.offsetHeight + 'px',
            borderRadius: getComputedStyle(p).borderTopRightRadius });
    },

    /* mientras la tarjeta entra con su animación, la cinta la sigue en cada fotograma (si no, se ve un momento fuera de su sitio) */
    seguirCinta(ms) {
        const fin = performance.now() + ms;
        const paso = () => { this.posicionarCinta(); if (performance.now() < fin) requestAnimationFrame(paso); };
        paso();
    },

    pintarConfig() {
        const s = this.state;
        document.querySelectorAll('.activity-card').forEach(c => c.classList.toggle('selected', c.dataset.actividad === s.actividad));
        document.querySelectorAll('#level-seg button').forEach(b => b.classList.toggle('selected', parseInt(b.dataset.nivel, 10) === s.nivel));
        document.querySelectorAll('#time-seg button').forEach(b => b.classList.toggle('selected', parseInt(b.dataset.tiempo, 10) === s.tiempo));
        this.$('time-row').style.display = s.mode === 'timeattack' ? '' : 'none';
        this.$('level-hint').textContent = this.DESC_NIVEL[s.nivel];
        this.$('config-title').textContent = this.MODOS[s.mode].charAt(0) + this.MODOS[s.mode].slice(1).toLowerCase() + ' · ¿qué quieres practicar?';
        this.prepararPrimera();
    },

    /* La primera palabra de la partida se elige y se sintetiza ya mientras se configura (cada cambio de actividad o nivel la renueva):
       así, al pulsar jugar, suena sin esperar los ~0,9 s de la síntesis. */
    prepararPrimera() {
        const s = this.state;
        try {
            if (!s.actividad || !window.VozUI || !VozUI.palabras() || Voz.estado() !== 'lista') return;
            const clave = s.actividad + '|' + s.nivel;
            if (this._pre && this._pre.clave === clave) return;
            const A = this.elegirPalabra(s.actividad);
            this._pre = { clave, A };
            Voz.precargar(A.palabra, vozPalabra(A));
        } catch (e) { this._pre = null; }
    },

    abrirCambioNombre() {
        Sonido.efecto('click');
        const input = this.$('new-player-name');
        input.value = this.state.playerName === this.ANONIMO ? '' : this.state.playerName;
        abrirModal(this.$('modal-change-name'));
        input.focus();
    },
    confirmarNombre() {
        Sonido.efecto('click');
        const val = this.$('new-player-name').value.trim();
        this.state.playerName = val || this.ANONIMO;       // vacío: «Anónimo»
        this.guardar('nombre', val);
        this.$('player-name').value = val;
        this.$('btn-start').disabled = false;
        cerrarModal(this.$('modal-change-name'));
    },

    // --- PALABRAS ---
    _datos: {},
    /* NIVEL 4 (difíciles): las palabras de los niveles 1-3 que tienen hiato, diptongo o triptongo, o un grupo de consonantes
       complicado (x, cc, tres consonantes seguidas, dos consonantes cerrando sílaba: examen, corrección, instante…).
       Se reparten en tres grupos y se elige 35 % hiatos, 35 % diptongos y 30 % consonantes: predominan los vocálicos. */
    REPARTO_N4: [['hiato', 0.35], ['diptongo', 0.35], ['consonantes', 0.30]],
    datosNivel4() {
        if (this._datos[4]) return this._datos[4];
        const grupos = { hiato: [], diptongo: [], consonantes: [] };
        [1, 2, 3].forEach(n => this.datosNivel(n).lista.forEach(a => {
            const m = new Set(a.juntas.map(j => j.motivo)), w = a.palabra;
            const g = m.has('hiato') ? 'hiato' : (m.has('diptongo') || m.has('triptongo')) ? 'diptongo'
                : (/x|cc/.test(w) || m.has('coda') || /[bcdfgjklmnñpqstvwxz]{3}/.test(w.replace(/ch|ll|rr|qu/g, 'K'))) ? 'consonantes' : null;
            if (g) grupos[g].push(Object.assign({}, a, { nivel: 4 }));
        }));
        const datos = { grupos: {} }, todas = [];
        Object.keys(grupos).forEach(g => {
            const porClase = { aguda: [], llana: [], esdrujula: [] };
            grupos[g].forEach(a => { if (porClase[a.clase]) porClase[a.clase].push(a); todas.push(a); });
            datos.grupos[g] = { lista: grupos[g], porClase };
        });
        datos.lista = todas;
        return (this._datos[4] = datos);
    },

    datosNivel(n) {
        if (n === 4) return this.datosNivel4();
        if (this._datos[n]) return this._datos[n];
        const lista = (window.PALABRAS[n] || []).map(w => Object.assign(Silabeo.analizar(w), { nivel: n }));
        const porClase = { aguda: [], llana: [], esdrujula: [] };
        lista.forEach(a => { if (porClase[a.clase]) porClase[a.clase].push(a); });
        return (this._datos[n] = { lista, porClase });
    },

    elegirPalabra(actividad) {
        const s = this.state;
        const nivel = s.nivel || [1, 2, 3][Math.floor(Math.random() * 3)];
        let d = this.datosNivel(nivel);
        if (nivel === 4) {             // primero el grupo (hiatos, diptongos o consonantes), luego como siempre
            let r = Math.random(), g = 'consonantes';
            for (const [nombre, peso] of this.REPARTO_N4) { if (r < peso) { g = nombre; break; } r -= peso; }
            d = d.grupos[g].lista.length ? d.grupos[g] : d;
        }
        let pool;
        if (actividad === 'silabas') pool = d.lista;
        else {
            // reparto equilibrado: llana 40 %, aguda 35 %, esdrújula 25 %
            const r = Math.random();
            const clase = r < 0.4 ? 'llana' : r < 0.75 ? 'aguda' : 'esdrujula';
            pool = d.porClase[clase].length ? d.porClase[clase] : d.lista;
        }
        let a = null;
        for (let i = 0; i < 12; i++) {
            a = pool[Math.floor(Math.random() * pool.length)];
            if (!s.recientes.includes(a.palabra)) break;
        }
        s.recientes.push(a.palabra);
        if (s.recientes.length > 40) s.recientes.shift();
        return a;
    },

    // --- PARTIDA ---
    startGame() {
        const s = this.state;
        this.clearLater();
        clearInterval(s.timerId);
        Object.assign(s, { score: 0, streak: 0, maxStreak: 0, total: 0, aciertos: 0, lives: 3, q: null, falladas: [], recientes: [], proxima: null, isPlaying: false, pausado: false });
        Voz.parar();
        // la primera palabra se sintetiza YA (mientras se pinta la pantalla): así no hay espera al empezar
        const pre = this._pre && this._pre.clave === s.actividad + '|' + s.nivel ? this._pre.A : null;
        this._pre = null;
        s.proxima = pre || this.elegirPalabra(s.actividad);
        if (VozUI.palabras()) Voz.precargar(s.proxima.palabra, vozPalabra(s.proxima));
        updateStreak(0);
        this.$('hud-score').textContent = '0';
        this.$('question-area').innerHTML = '';
        this.$('question-text').innerHTML = '';
        this.$('step-indicator').innerHTML = '';
        this.$('answer-note').innerHTML = '';

        const hudTimer = this.$('hud-time-container'), hudLives = this.$('hud-lives-container'), hudScore = this.$('hud-score-container');
        this.$('hud-time').classList.remove('danger');
        hudScore.classList.remove('centered');
        hudTimer.classList.remove('hidden');
        hudLives.classList.add('hidden');
        this.$('hud-time-label').textContent = 'TIEMPO';

        this.$('current-mode-name').textContent = this.MODOS[s.mode];
        this.$('current-activity-name').textContent = this.TIPOS[s.actividad].nombre.toUpperCase();
        this.$('btn-abort').textContent = s.mode === 'practice' ? '🏁 Terminar' : '✖ Abortar';

        if (s.mode === 'timeattack') {
            s.timeRemaining = s.tiempo;
        } else if (s.mode === 'sudden_death') {
            hudTimer.classList.add('hidden');
            hudScore.classList.add('centered');
        } else if (s.mode === 'survival') {
            hudLives.classList.remove('hidden');
            this.$('hud-time-label').textContent = 'RELOJ';
            s.timeRemaining = 20;
            this.pintarVidas();
        } else {   // práctica: reloj que sube
            s.timeRemaining = 0;
        }
        this.pintarTiempo();

        this.showScreen('screen-game', true);
        Sonido.musica(s.mode, true);   // cada partida empieza su música desde el principio

        const comenzar = () => {
            s.isPlaying = true;
            if (s.mode !== 'sudden_death') this.iniciarReloj();
            this.siguientePregunta();
        };
        if (s.mode === 'practice' || !this.CUENTA_ATRAS) {
            if (s.mode !== 'practice') Sonido.efecto('start');
            comenzar();
        } else {
            Sonido.efecto('start');
            showCountdown(comenzar, '<div class="countdown-header">' + this.MODOS[s.mode] + ' · ' + this.TIPOS[s.actividad].nombre + '</div>');
        }
    },

    async abortar() {
        const s = this.state;
        Sonido.efecto('click');
        if (s.mode === 'practice' && s.isPlaying) { this.endGame(); return; }
        if (s.isPlaying) {
            const ok = await confirmDialog('Se perderá esta partida.', { title: '¿Abandonar?', icon: '🚪', okText: 'Abandonar', cancelText: 'Seguir jugando', danger: true });
            if (!ok || !s.isPlaying) return;
        }
        s.isPlaying = false;
        Voz.parar();
        clearInterval(s.timerId);
        this.clearLater();
        this.showScreen('screen-home');
    },

    iniciarReloj() {
        const s = this.state;
        clearInterval(s.timerId);
        s.timerId = setInterval(() => {
            if (!s.isPlaying || s.pausado) return;          // pausado: mientras se explica un fallo
            if (s.mode === 'practice') s.timeRemaining++;
            else s.timeRemaining--;
            this.pintarTiempo();
            const hudTime = this.$('hud-time');
            const peligro = (s.mode === 'timeattack' && s.timeRemaining <= 10) || (s.mode === 'survival' && s.timeRemaining <= 5);
            hudTime.classList.toggle('danger', peligro);
            if (peligro && s.timeRemaining > 0) Sonido.efecto('click', 0.25);

            if (s.mode !== 'practice' && s.timeRemaining <= 0) {
                if (s.mode === 'survival') this.tiempoAgotadoPregunta();
                else this.endGame();
            }
        }, 1000);
    },

    pintarTiempo() {
        const t = Math.max(0, this.state.timeRemaining);
        this.$('hud-time').textContent = String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
    },
    pintarVidas() { this.$('hud-lives').textContent = '❤️'.repeat(Math.max(0, this.state.lives)) || '💔'; },

    // --- PREGUNTAS ---
    siguientePregunta() {
        const s = this.state;
        if (!s.isPlaying) return;
        const prev = s.q;
        let q, nueva = false;
        if (prev && prev.pasos && prev.paso < prev.pasos.length - 1) {
            q = Object.assign({}, prev, { paso: prev.paso + 1, resuelta: false });   // siguiente paso de la misma palabra
            q.tipo = q.pasos[q.paso];
        } else {
            const A = s.proxima || this.elegirPalabra(s.actividad);
            s.proxima = null; nueva = true;
            q = { A, nivel: A.nivel, resuelta: false };
            if (s.actividad === 'combinada') { q.pasos = this.PASOS_COMBINADA; q.paso = 0; q.tipo = q.pasos[0]; }
            else q.tipo = s.actividad;
        }
        q.inicio = Date.now();
        q.cortes = new Set();
        s.q = q;
        if (s.mode === 'survival') {
            s.timeRemaining = Math.max(8, 20 - Math.floor(s.aciertos / 5));
            this.pintarTiempo();
            this.$('hud-time').classList.remove('danger');
        }
        this.$('answer-note').innerHTML = '';
        this.pintarPregunta();
        if (nueva) {
            if (VozUI.palabras()) Voz.decir(q.A.palabra, vozPalabra(q.A));              // pronuncia la palabra nueva
            s.proxima = this.elegirPalabra(s.actividad);               // y deja lista la siguiente (se sintetiza mientras se juega)
            if (VozUI.palabras()) Voz.precargar(s.proxima.palabra, vozPalabra(s.proxima));
        }
    },

    pintarPregunta() {
        const q = this.state.q, A = q.A, area = this.$('question-area'), texto = this.$('question-text');
        area.classList.remove('bloqueado');

        // indicador de pasos (solo en «Todo junto»)
        const ind = this.$('step-indicator');
        if (q.pasos) {
            const nombres = { silabas: '✂️ Sílabas', tonica: '🔊 Tónica', clasificar: '🏷️ Clase' };
            ind.innerHTML = q.pasos.map((p, i) =>
                '<span class="step-dot ' + (i < q.paso ? 'done' : i === q.paso ? 'now' : '') + '"></span>').join('') +
                '<span>' + nombres[q.tipo] + ' · paso ' + (q.paso + 1) + ' de ' + q.pasos.length + '</span>';
        } else ind.innerHTML = '';

        if (q.tipo === 'clasificar') {
            texto.innerHTML = '¿Cómo es la palabra según su <b>sílaba tónica</b>?';
            const cabecera = q.pasos
                ? this.fichasHTML(A, true, false)                       // ya se sabe dónde está la tónica
                : '<div class="palabra-grande">' + esc(A.palabra) + '</div>';
            area.innerHTML = cabecera + '<div class="options-grid">' + [
                ['esdrujula', 'Esdrújula', 'tónica en la antepenúltima'],
                ['llana', 'Llana', 'tónica en la penúltima'],
                ['aguda', 'Aguda', 'tónica en la última']
            ].map(o => '<button type="button" class="option-btn" data-clase="' + o[0] + '"><span class="tit">' + o[1] + '</span><span class="sub">' + o[2] + '</span></button>').join('') + '</div>';
            area.querySelectorAll('.option-btn').forEach(b => b.addEventListener('click', () => this.responder(b.dataset.clase, b)));
        } else if (q.tipo === 'tonica') {
            texto.innerHTML = 'Toca la <b>sílaba tónica</b>: la que suena más fuerte';
            area.innerHTML = this.fichasHTML(A, false, true);
            area.querySelectorAll('button.sil-chip').forEach(b => b.addEventListener('click', () => this.responder(parseInt(b.dataset.i, 10), b)));
        } else {
            texto.innerHTML = 'Pulsa los botones de debajo para <b>cortar</b> la palabra en sílabas';
            area.innerHTML = this.cortadorHTML(A) +
                '<div class="cortador-ayuda">Cada sílaba es un golpe de voz.</div>' +
                '<div class="acciones-cortador"><button type="button" class="btn-secondary" id="btn-borrar">Borrar cortes</button>' +
                '<button type="button" class="btn-primary" id="btn-comprobar">Comprobar ✔</button></div>';
            this.encajarCortador();
            this.$('cortador').addEventListener('click', e => {
                const h = e.target.closest('.palanca'); if (!h) return;
                this.alternarCorte(parseInt(h.dataset.pos, 10), h);
            });
            this.$('btn-borrar').addEventListener('click', () => {
                Sonido.efecto('click');
                q.cortes.clear();
                area.querySelectorAll('.palanca').forEach(h => h.classList.remove('on'));
            });
            this.$('btn-comprobar').addEventListener('click', () => this.responder([...q.cortes].sort((a, b) => a - b)));
        }
    },

    fichasHTML(A, marcarTonica, botones) {
        return '<div class="sil-fila">' + A.silabas.map((s, i) =>
            (i ? '<span class="sil-guion">-</span>' : '') +
            (botones
                ? '<button type="button" class="sil-chip" data-i="' + i + '">' + esc(s) + '</button>'
                : '<span class="sil-chip fija' + (marcarTonica && i === A.tonica ? ' tonica' : '') + '">' + esc(s) + '</span>')
        ).join('') + '</div>';
    },

    cortadorHTML(A) {
        const w = A.palabra, TIJERA = '<svg class="tijera" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8 16.4 17 3.5M16 16.4 7 3.5"/></svg>';
        let html = '';
        for (let i = 0; i < w.length; i++) {
            html += '<span class="letra">' + esc(w[i]) + '</span>';
            if (i < w.length - 1) html += '<button type="button" class="palanca" data-pos="' + (i + 1) + '" aria-label="Cortar entre ' + esc(w[i]) + ' y ' + esc(w[i + 1]) + '"><span class="linea"></span><span class="pad">' + TIJERA + '</span></button>';
        }
        return '<div class="cortador" id="cortador"><div class="palabra-cortar">' + html + '</div></div>';
    },

    /* La posición de cada botón la da la propia palabra (están dentro de ella); aquí solo se
       decide el tamaño de las letras y el de los botones, y si van en una o dos alturas. */
    ajustarCortador(repetida) {
        const c = this.$('cortador'); if (!c) return;
        if (!repetida) requestAnimationFrame(() => this.ajustarCortador(true));   // por si las fuentes o el tamaño cambian justo después
        const palabra = c.querySelector('.palabra-cortar'), palancas = [...c.querySelectorAll('.palanca')];
        const disponible = Math.max(180, this.$('question-area').clientWidth - 8);
        const ancho = () => palabra.lastElementChild.getBoundingClientRect().right - palabra.firstElementChild.getBoundingClientRect().left;

        // 1) tamaño de letra: la palabra ocupa el ancho disponible (con un tope)
        c.style.setProperty('--tam', '2rem');
        const esc = this._escCort || 1;   // <1 si hay que reducir para que quepa en la pantalla
        const rem = Math.min(6, 2 * disponible / ancho() * 0.98) * esc;
        c.style.setProperty('--tam', rem.toFixed(2) + 'rem');

        // 2) botones: si no caben en fila, se escalonan en dos alturas (medidas relativas al tamaño base de la página)
        const fs = parseFloat(getComputedStyle(c).fontSize);
        const k = ((parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) / 16) * (this._escCort || 1);
        const centros = palancas.map(p => { const r = p.getBoundingClientRect(); return r.left + r.width / 2; });
        const local = i => {   // distancia al hueco vecino más cercano (la «i» y la «l» son estrechas)
            const izq = i > 0 ? centros[i] - centros[i - 1] : Infinity, der = i < centros.length - 1 ? centros[i + 1] - centros[i] : Infinity;
            const m = Math.min(izq, der);
            return isFinite(m) ? m : 60 * k;
        };
        const paso = Math.min(...centros.map((x, i) => local(i)));
        const tactil = window.matchMedia('(any-pointer: coarse)').matches;
        // con ratón los botones pueden ser más pequeños y caben en una sola fila; con el dedo se piden más grandes
        const niveles = paso / k < (tactil ? 64 : 32) * (this._escCort || 1) ? 2 : 1;
        // una sola fila: cada botón se ajusta a su propio hueco; dos alturas: todos del mismo ancho
        const anchoDoble = Math.max(30 * k, Math.min(84 * k, 2 * paso - 8 * k));
        // todos los botones de una palabra del mismo tamaño: el más pequeño que haga falta
        const unico = Math.max(24 * k, Math.min(84 * k, paso - 5 * k));
        const anchos = centros.map(() => niveles === 2 ? anchoDoble : unico);
        const maxAncho = Math.max(...anchos);
        const padH = niveles === 1 && !tactil ? Math.max(34 * k, Math.min(56 * k, maxAncho * 0.75)) : Math.max(38 * k, Math.min(60 * k, maxAncho * 0.9));
        const sep = 0.3 * fs, entre = 8 * k;
        c.style.setProperty('--padh', padH + 'px');
        c.style.setProperty('--sep', sep + 'px');
        c.style.setProperty('--entre', entre + 'px');
        palancas.forEach((p, i) => {
            p.style.setProperty('--padw', anchos[i] + 'px');
            p.style.setProperty('--hit', Math.min(local(i) * 0.9, 46 * k) + 'px');
            p.classList.toggle('n2', niveles === 2 && i % 2 === 1);
        });
        c.style.paddingBottom = (sep + niveles * padH + (niveles - 1) * entre + 6 * k) + 'px';
    },

    /* Si el tablero no cabe en el alto de la pantalla (móvil con las barras del navegador), reduce palabra y botones */
    encajarCortador() {
        if (!this.$('cortador')) return;
        const tablero = document.querySelector('.game-board');
        this._escCort = 1;
        this.ajustarCortador(true);
        for (let n = 0; tablero && n < 9 && tablero.scrollHeight > tablero.clientHeight + 1 && this._escCort > 0.58; n++) {
            this._escCort -= 0.06;
            this.ajustarCortador(true);
        }
    },

    alternarCorte(pos, el) {
        const q = this.state.q;
        if (!q || q.resuelta) return;
        if (q.cortes.has(pos)) { q.cortes.delete(pos); el.classList.remove('on'); Sonido.efecto('click', 0.4); }
        else { q.cortes.add(pos); el.classList.add('on'); Sonido.woosh(); }
    },

    teclado(e) {
        const q = this.state.q;
        if (!this.state.isPlaying || !q || q.resuelta || e.ctrlKey || e.metaKey || e.altKey) return;
        if (!this.$('screen-game').classList.contains('active')) return;
        if (q.tipo === 'silabas' && e.key === 'Enter') { e.preventDefault(); this.responder([...q.cortes].sort((a, b) => a - b)); return; }
        const n = parseInt(e.key, 10);
        if (!n) return;
        if (q.tipo === 'clasificar') {
            const b = this.$('question-area').querySelectorAll('.option-btn')[n - 1];
            if (b) this.responder(b.dataset.clase, b);
        } else if (q.tipo === 'tonica') {
            const b = this.$('question-area').querySelectorAll('button.sil-chip')[n - 1];
            if (b) this.responder(parseInt(b.dataset.i, 10), b);
        }
    },

    // --- RESPUESTAS ---
    evaluar(q, valor) {
        const A = q.A;
        if (q.tipo === 'clasificar') return valor === A.clase;
        if (q.tipo === 'tonica') return valor === A.tonica;
        return valor.length === A.cortes.length && valor.every((c, i) => c === A.cortes[i]);
    },

    notaRespuesta(q, ok) {
        const A = q.A;
        const sils = A.silabas.map((s, i) => i === A.tonica ? '<b>' + esc(s.toUpperCase()) + '</b>' : esc(s)).join('-');
        if (q.tipo === 'silabas') return (ok ? '¡Bien! ' : 'Era: ') + '<b>' + esc(A.silabas.join('-')) + '</b>';
        if (q.tipo === 'tonica') return (ok ? '¡Bien! ' : 'La tónica es ') + sils;
        return (ok ? '¡Bien! ' : 'Es ') + '<b>' + this.CLASES[A.clase] + '</b> · ' + sils;
    },

    marcarCorrecto(q, valor, boton) {
        const area = this.$('question-area');
        area.classList.add('bloqueado');
        const ok = this.evaluar(q, valor);
        if (q.tipo === 'clasificar') {
            area.querySelectorAll('.option-btn').forEach(b => { if (b.dataset.clase === q.A.clase) b.classList.add('correct'); });
            if (!ok && boton) boton.classList.add('wrong');
        } else if (q.tipo === 'tonica') {
            area.querySelectorAll('button.sil-chip').forEach(b => { if (parseInt(b.dataset.i, 10) === q.A.tonica) b.classList.add('correct'); });
            if (!ok && boton) boton.classList.add('wrong');
        } else {
            const c = this.$('cortador');
            c.classList.add('bloqueado');
            c.querySelectorAll('.palanca').forEach(h => {
                const pos = parseInt(h.dataset.pos, 10), esC = q.A.cortes.includes(pos), esE = valor.includes(pos);
                h.classList.remove('on');
                if (esC && esE) h.classList.add('ok');
                else if (esE) h.classList.add('mal');
                else if (esC) h.classList.add('falta');
            });
            area.querySelectorAll('.acciones-cortador button').forEach(b => b.disabled = true);
        }
        return ok;
    },

    async responder(valor, boton) {
        const s = this.state, q = s.q;
        if (!s.isPlaying || !q || q.resuelta) return;
        q.resuelta = true;
        if (boton) boton.blur();

        const ok = this.marcarCorrecto(q, valor, boton);
        const dt = Date.now() - q.inicio;
        s.total++;
        this.$('answer-note').innerHTML = this.notaRespuesta(q, ok);

        if (ok) {
            s.aciertos++;
            s.streak++;
            if (s.streak > s.maxStreak) s.maxStreak = s.streak;
            this.feedback(true);
            let extra = 0;
            if (s.mode !== 'practice') {
                const [t0, t1] = this.TIPOS[q.tipo].velocidad;
                if (dt < t0) { extra = 20; this.popup('¡Velocidad luz!', 'super'); }
                else if (dt < t1) { extra = 10; this.popup('¡Qué rápido!', 'high'); }
            }
            const puntos = Math.round((10 + extra + Math.min(s.streak, 15) * 2) * (this.MULT_NIVEL[q.nivel] || 1));
            s.score += puntos;
            this.$('hud-score').textContent = s.score;
            floatText('+' + puntos, this.$('hud-score'), 'float-good');
            updateStreak(s.streak);
            this.later(() => this.siguientePregunta(), 800);
            return;
        }

        // --- fallo ---
        s.streak = 0;
        updateStreak(0);
        if (!s.falladas.includes(q.A.palabra)) s.falladas.push(q.A.palabra);
        this.feedback(false);

        if (s.mode === 'survival') { s.lives--; this.pintarVidas(); }
        if (VozUI.explicarEn(s.mode)) {
            // explicación: el juego (y el reloj) se detiene por completo hasta que se cierra
            s.pausado = true;
            // si este fallo termina la partida (muerte súbita, o última vida en supervivencia), ya suena la música de fin
            const terminada = s.mode === 'sudden_death' || (s.mode === 'survival' && s.lives <= 0);
            if (terminada) Sonido.musica('fin');
            const datos = { tipo: q.tipo, palabra: q.A.palabra, elegida: valor };
            const animada = VozUI.explicacion();
            if (animada) Infografia.preparar(datos);      // empieza a sintetizar la narración mientras se ve la respuesta correcta
            await new Promise(r => this.later(r, 900));
            if (!s.isPlaying) return;
            await (animada ? Infografia.mostrar(datos) : Explicacion.mostrar(datos));
            s.pausado = false;
            if (!s.isPlaying) return;
            if (terminada) { this.endGame(); return; }
            // nunca se vuelve a preguntar algo que la explicación acaba de contar: la de la tónica dice también la clase
            // de la palabra, así que en «Todo junto» se salta el paso de clasificar y se pasa a la palabra siguiente
            if (q.pasos && q.tipo === 'tonica') q.paso = q.pasos.length - 1;
            this.siguientePregunta();
        } else if (s.mode === 'practice') {      // práctica sin explicaciones
            this.later(() => this.siguientePregunta(), 1600);
        } else if (s.mode === 'sudden_death') {
            this.later(() => this.endGame(), 1800);
        } else if (s.mode === 'survival') {
            if (s.lives <= 0) this.later(() => this.endGame(), 1800);
            else this.later(() => this.siguientePregunta(), 1600);
        } else {   // contrarreloj
            this.later(() => this.siguientePregunta(), 1300);
        }
    },

    tiempoAgotadoPregunta() {      // supervivencia: se acabó el reloj de la pregunta
        const s = this.state, q = s.q;
        if (!q || q.resuelta) return;
        q.resuelta = true;
        this.$('question-area').classList.add('bloqueado');
        s.total++;
        s.streak = 0;
        updateStreak(0);
        if (!s.falladas.includes(q.A.palabra)) s.falladas.push(q.A.palabra);
        s.lives--;
        this.pintarVidas();
        this.$('answer-note').innerHTML = '⏰ ¡Tiempo! ' + this.notaRespuesta(q, false);
        this.feedback(false);
        if (s.lives <= 0) this.later(() => this.endGame(), 1800);
        else this.later(() => this.siguientePregunta(), 1600);
    },

    feedback(ok) {
        Sonido.efecto(ok ? 'acierto' : 'error');
        const overlay = this.$('feedback-overlay');
        overlay.className = 'feedback-fx ' + (ok ? 'correct' : 'wrong');
        if (!ok) {
            const board = document.querySelector('.game-board');
            restartAnimation(board, 'shake');
        }
        setTimeout(() => { overlay.className = 'feedback-fx'; }, 300);
    },

    popup(texto, clase) {
        const board = document.querySelector('.game-board');
        const pop = document.createElement('div');
        pop.className = 'speed-popup speed-text-' + clase;
        pop.textContent = texto;
        board.appendChild(pop);
        setTimeout(() => pop.remove(), 1200);
    },

    // --- FIN DE PARTIDA ---
    endGame() {
        const s = this.state;
        if (!s.isPlaying) return;
        Voz.parar();
        s.isPlaying = false;
        clearInterval(s.timerId);
        this.clearLater();

        const precision = s.total > 0 ? Math.round(s.aciertos / s.total * 100) : 0;
        animateCount(this.$('res-score'), s.score);
        this.$('res-jugador').textContent = s.playerName;
        this.$('res-accuracy').textContent = precision + '%';
        this.$('res-streak').textContent = s.maxStreak;
        this.$('res-detail').textContent = this.MODOS[s.mode].charAt(0) + this.MODOS[s.mode].slice(1).toLowerCase() +
            ' · ' + this.TIPOS[s.actividad].nombre + ' · ' + (s.nivel ? 'nivel ' + s.nivel : 'nivel mixto') +
            ' · ' + s.aciertos + ' de ' + s.total + ' correctas';

        const rep = this.$('res-repasar');
        if (s.falladas.length) {
            rep.innerHTML = '<b>Para repasar:</b><br>' + s.falladas.slice(0, 10).map(w => '<span class="pal">' + esc(w) + '</span>').join('');
        } else rep.innerHTML = s.total ? '¡Sin ninguna palabra para repasar!' : '';

        const msg = this.$('res-message');
        if (!s.total) msg.textContent = 'Esta vez no ha dado tiempo a responder.';
        else if (precision >= 90) msg.textContent = '¡Maestro de las sílabas!';
        else if (precision >= 70) msg.textContent = '¡Muy buen trabajo!';
        else if (precision >= 50) msg.textContent = 'Vas por buen camino. ¡Sigue practicando!';
        else msg.textContent = 'Repasa las palabras de arriba y vuelve a intentarlo.';

        if (s.mode !== 'practice' && s.score > 0) this.guardarRanking();
        if (precision >= 90 && s.total >= 8) launchConfetti();

        this.later(() => this.showScreen('screen-results', true), 600);
    },

    // --- RANKING LOCAL ---
    claveRanking(modo, tiempo) { return modo === 'timeattack' ? 'timeattack_' + tiempo : modo; },

    guardarRanking() {
        const s = this.state;
        const modoKey = this.claveRanking(s.mode, s.tiempo);
        const clave = modoKey + '|' + s.actividad;
        const todos = this.leer('ranking', {});
        const lista = todos[clave] || [];
        lista.push({ name: s.playerName, score: s.score, date: new Date().toLocaleDateString('es-ES') });
        lista.sort((a, b) => b.score - a.score);
        todos[clave] = lista.slice(0, 10);
        this.guardar('ranking', todos);
        s.lastRankingKey = { modo: modoKey, actividad: s.actividad };
    },

    abrirRanking() {
        const k = this.state.lastRankingKey;
        if (k) {
            this.$('ranking-mode-select').value = k.modo;
            this.$('ranking-activity-select').value = k.actividad;
        }
        this.renderRanking();
    },

    renderRanking() {
        const clave = this.$('ranking-mode-select').value + '|' + this.$('ranking-activity-select').value;
        const datos = this.leer('ranking', {})[clave] || [];
        const tbody = this.$('ranking-body');
        tbody.innerHTML = '';
        if (!datos.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center muted">Aún no hay puntuaciones.</td></tr>';
            return;
        }
        datos.forEach((e, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td>' + (i + 1) + '</td><td>' + esc(e.name) + '</td><td>' + esc(e.score) + '</td><td>' + esc(e.date) + '</td>';
            tbody.appendChild(tr);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
