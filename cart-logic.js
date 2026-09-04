// --- CONFIGURACIÓN Y VARIABLES GLOBALES ---
window.getCurrentLang = () => {
    const path = window.location.pathname;
    if (path.includes('/en')) return 'en';
    if (path.includes('/pt')) return 'pt';
    return 'es';
};
 
// --- TEXTOS Y LÓGICA COMPARTIDA ENTRE LOS EMBEDS DE HOME Y /EVENTOS ---
// Antes esto vivía duplicado (con contenido idéntico, salvo yearLabel/
// yearAllOption que solo usa events) en el <script> de "embed home.html" y
// "embed events.html". Se centraliza acá porque cart-logic.js ya se carga
// una sola vez por página (no una vez por iframe, como los embeds), así que
// esto no agrega ningún archivo ni request nuevo: los embeds lo consumen
// cruzando el iframe con window.parent.*, igual que ya hacen con
// getCurrentLang/addToCart/toggleCart. Ver diagnostico-carrito.md,
// "Consolidar lógica JS repetida entre los dos embeds".
window.UI_TEXTS = {
    noEventsTitle: { es: "¡Vaya!", en: "Oops!", pt: "Ops!" },
    noEventsBody: {
        es: "No hay eventos con estos criterios.",
        en: "There are no events with these filters.",
        pt: "Não há eventos com esses filtros."
    },
    brochure: { es: "Ver Brochure", en: "View Brochure", pt: "Ver Brochure" },
    event: { es: "Ver Evento", en: "View Event", pt: "Ver Evento" },
    video: { es: "Ver Video", en: "Watch Video", pt: "Ver Vídeo" },
    interest: { es: "Me interesa", en: "I'm interested", pt: "Tenho interesse" },
    here: { es: "aquí", en: "here", pt: "aqui" },
    regionLabel: { es: "Región:", en: "Region:", pt: "Região:" },
    segmentLabel: { es: "Segmento:", en: "Segment:", pt: "Segmento:" },
    yearLabel: { es: "Año:", en: "Year:", pt: "Ano:" },
    regionAllOption: { es: "Todas", en: "All", pt: "Todas" },
    segmentAllOption: { es: "Todos", en: "All", pt: "Todos" },
    yearAllOption: { es: "Todos", en: "All", pt: "Todos" }
};
 
// Reemplaza los t()/getLang() locales que tenía cada embed para sus textos
// fijos de interfaz: busca la traducción de "key" en window.UI_TEXTS según
// el idioma actual de la página (getCurrentLang, definida arriba).
window.getUIText = (key) => {
    const lang = window.getCurrentLang();
    const item = window.UI_TEXTS[key];
    if (!item) return "";
    return item[lang] || item.es || "";
};
 
// Reemplaza el bloque de ordenamiento cronológico que estaba duplicado,
// palabra por palabra, en renderEventList() de los dos embeds: separa
// "events" (ya filtrado por región/segmento/año) en próximos (>= hoy,
// ascendente) y pasados (< hoy, descendente), y devuelve la concatenación.
// Ver diagnostico-carrito.md, "Ordenamiento automático de eventos".
window.sortEventsChronologically = (events) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcoming = [];
    const past = [];
    events.forEach((event) => {
        const eventDate = new Date(event.startDate);
        if (eventDate >= now) upcoming.push(event);
        else past.push(event);
    });
    upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    past.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    return [...upcoming, ...past];
};
 
// Antes esto llevaba "?nocache=" + Date.now() para forzar que se ignore
// cualquier caché y se descargue el JSON entero en cada carga. Se saca el
// query param y en su lugar el fetch de abajo pide { cache: "no-cache" }:
// eso obliga a revalidar contra el servidor en CADA carga igual que antes
// (misma frescura garantizada), pero si el servidor confirma que no cambió
// (vía ETag), el navegador reusa el cuerpo que ya tenía en vez de volver a
// bajar el JSON completo. Ver diagnostico-carrito.md, punto 1 de
// "Optimización de carga", para cómo validar que esto esté funcionando.
var EVENTS_JSON_URL = "https://gist.githubusercontent.com/CMS-People/389e604db6a04767f0b55edc5b97acd9/raw/eventos.json";
    // esta era la url del gist de mi GitHub:  "https://gist.githubusercontent.com/Lauchis/50b5ece416be0f17df01c554fd70871f/raw/eventos.json"
// var EVENTS_JSON_URL = "https://gitlab.com/-/snippets/5980284/raw/main/eventos.json?inline=false";
window.ALL_COUNTRIES = ["Alemania", "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Ecuador", "El Salvador", "España", "Estados Unidos", "Francia", "Guatemala", "Honduras", "Italia", "México", "Nicaragua", "Otros", "Panamá", "Paraguay", "Perú", "Portugal", "Puerto Rico", "Reino Unido", "República Dominicana", "Uruguay", "Venezuela"].sort();
 
var ENDPOINTS = {
    brasil: "https://formsubmit.co/ajax/c.boueri@cmspeople.com",
    europa: "https://formsubmit.co/ajax/antonio.soto@cmspeople.com",
    latam: "https://formsubmit.co/ajax/tatiana.remaggi@cmspeople.com",
    mexico: "https://formsubmit.co/ajax/tatiana.remaggi@cmspeople.com"
};
 
// FormSubmit.co solo admite UN destinatario "principal" por endpoint (el
// email que va en la URL de ENDPOINTS de arriba) — no soporta dos
// direcciones como destinatarias directas de un mismo envío. Para sumar
// gente sin tocar el destinatario principal se usa el campo oculto "_cc"
// (copia), que sí admite varias direcciones separadas por coma.
//
// CC_BASE va en copia de TODAS las regiones (como ya era). CC_EUROPA_EXTRA
// se suma solo cuando el envío corresponde a Europa (ENDPOINTS.europa) —
// agregado el 2026-09-02 a pedido para que fernando.maquez@cmspeople.com
// reciba en copia los formularios de Europa además de Antonio (destinatario
// principal), sin sumarlo a Brasil/Latam/México.
var CC_BASE = "martina.delucchi@cmspeople.com,szubillaga@cmspeople.com";
var CC_EUROPA_EXTRA = "fernando.maquez@cmspeople.com";
 
// Arma la lista de "_cc" según la región del carrito en este momento
// (misma lógica de prioridad que getEndpoint): CC_BASE siempre, más
// CC_EUROPA_EXTRA únicamente si el endpoint que se va a usar es el de
// Europa.
window.getCcAddresses = () => {
    var cc = CC_BASE;
    if (window.getEndpoint() === ENDPOINTS.europa) cc += "," + CC_EUROPA_EXTRA;
    return cc;
};
 
var KEY = "framer_event_cart";
window.MOCK_EVENTS = window.MOCK_EVENTS || [];
window.cartItems = [];
window.isCartOpen = false;
 
// --- FUNCIONES DE NÚCLEO ---
window.loadCart = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch (e) { return [] } };
window.saveCart = c => { try { localStorage.setItem(KEY, JSON.stringify(c)) } catch (e) { } };
 
// window.EVENTS_LOAD_FAILED indica si, tras agotar los reintentos de abajo,
// no se pudo traer eventos.json. addToCart lo usa para no quedar esperando
// para siempre (ver diagnostico-carrito.md, "Manejo de falla al cargar
// eventos").
window.EVENTS_LOAD_FAILED = false;
 
// Un solo intento de fetch, con timeout de 8s (antes no tenía ninguno: un
// fetch colgado podía bloquear la carga de eventos indefinidamente).
var fetchEventsOnce = async () => {
    var controller = new AbortController();
    var timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
        var r = await fetch(EVENTS_JSON_URL, { cache: "no-cache", signal: controller.signal });
        if (!r.ok) throw new Error("HTTP " + r.status);
        return await r.json();
    } finally {
        clearTimeout(timeoutId);
    }
};
 
window.loadMockEvents = async () => {
    if (window.MOCK_EVENTS.length > 0) return;
    // 1 intento inicial + 2 reintentos ante fallas transitorias (red lenta,
    // timeout, Gist caído un instante, etc.), 8s como máximo cada uno —
    // hasta ~24s en el peor caso antes de darnos por vencidos.
    var maxIntentos = 3;
    for (var i = 0; i < maxIntentos; i++) {
        try {
            window.MOCK_EVENTS = await fetchEventsOnce();
            window.EVENTS_LOAD_FAILED = false;
            return;
        } catch (e) {
            if (i === maxIntentos - 1) window.EVENTS_LOAD_FAILED = true;
        }
    }
};
 
var D = {};
var rf = () => {
    D = {
        cart: document.getElementById("side-cart-global"),
        openBtn: document.getElementById("open-cart-btn-global"),
        closeBtn: document.getElementById("close-cart-btn-global"),
        count: document.getElementById("cart-count-global"),
        items: document.getElementById("cart-items-container-global"),
        form: document.getElementById("sponsorship-form-global"),
        data: document.getElementById("event-selection-data-global"),
        submit: document.getElementById("submit-btn-global"),
        select: document.getElementById("company-country-select"),
        privacy: document.getElementById("privacy-checkbox-global"),
        emptyMsg: document.getElementById("empty-cart-message-global"),
        success: document.getElementById("success-message-global"),
        error: document.getElementById("error-message-global"),
        closeSuccess: document.getElementById("close-success-btn-global"),
        closeError: document.getElementById("close-error-btn-global")
    };
};
 
window.updateCartState = () => {
    rf();
    window.saveCart(window.cartItems);
    if (!D.count) return;
 
    const lang = window.getCurrentLang();
    D.count.textContent = window.cartItems.length;
    D.count.style.display = window.cartItems.length > 0 ? "flex" : "none";
 
    if (window.cartItems.length > 0) {
        D.items.innerHTML = window.cartItems.map(i => {
            const tTitle = (i.title && typeof i.title === 'object') ? (i.title[lang] || i.title['es']) : (i.title || "");
            const tDate = (i.date && typeof i.date === 'object') ? (i.date[lang] || i.date['es']) : (i.date || "");
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background-color:#f9fafb;border-radius:0.5rem;margin-bottom:0.5rem;">
                      <div style="flex-grow:1;">
                        <p style="font-weight:600;color:#1f2937;margin:0">${tTitle}</p>
                        <p style="font-size:0.875rem;color:#6b7280;margin:0">${tDate}</p>
                      </div>
                      <button onclick="window.removeFromCart(${i.id})" style="padding:4px;border-radius:9999px;background-color:#fee2e2;color:#ef4444;border:none;cursor:pointer">🗑️</button>
                    </div>`;
        }).join("");
        if (D.data) D.data.value = window.cartItems.map(i => (typeof i.title === 'object' ? i.title[lang] || i.title['es'] : i.title)).join(" | ");
        if (D.emptyMsg) D.emptyMsg.style.display = "none";
        if (D.form) D.form.style.display = "block";
    } else {
        if (D.items) D.items.innerHTML = "";
        if (D.emptyMsg) D.emptyMsg.style.display = "block";
        if (D.form) D.form.style.display = "none";
    }
};
 
// Antes, si eventos.json no llegaba a cargar nunca, este polling se quedaba
// reintentando cada 50ms para siempre y el usuario no se enteraba de nada.
// Ahora corta cuando EVENTS_LOAD_FAILED queda en true (loadMockEvents ya
// agotó sus reintentos, hasta ~24s) o, como red de seguridad, a los 30s
// (maxAttempts), y avisa reutilizando el modal de error que ya existe para
// el formulario.
window.addToCart = id => {
    var attempts = 0;
    var maxAttempts = 600; // ~30s a 50ms por intento (con margen sobre los ~24s de loadMockEvents)
    var check = () => {
        if (!window.MOCK_EVENTS?.length) {
            if (window.EVENTS_LOAD_FAILED || attempts >= maxAttempts) {
                rf();
                if (D.error) D.error.style.display = "flex";
                return;
            }
            attempts++;
            setTimeout(check, 50);
            return;
        }
        var e = window.MOCK_EVENTS.find(x => x.id === id);
        if (e && !window.cartItems.some(i => i.id === id)) {
            window.cartItems.push(e);
            window.updateCartState();
            window.toggleCart(true);
        }
    }; check();
};
 
window.removeFromCart = id => { window.cartItems = window.cartItems.filter(i => i.id !== id); window.updateCartState(); };
 
window.getEndpoint = () => {
    var r = [...new Set(window.cartItems.map(i => i.region))];
    if (r.includes("Europa")) return ENDPOINTS.europa;
    if (r.includes("Brasil")) return ENDPOINTS.brasil;
    if (r.includes("Mexico")) return ENDPOINTS.mexico;
    return ENDPOINTS.latam;
};
 
window.toggleCart = o => {
    rf();
    window.isCartOpen = typeof o === "boolean" ? o : !window.isCartOpen;
    if (D.cart) D.cart.style.transform = window.isCartOpen ? "translateX(0)" : "translateX(100%)";
    if (D.openBtn) D.openBtn.style.display = window.isCartOpen ? "none" : "flex";
};
 
var handleFormSubmit = async e => {
    e.preventDefault();
    if (!window.cartItems.length) return;
    rf();
    // Recalcula el _cc justo antes de enviar (no alcanza con el valor fijado
    // al crear el campo): el carrito puede haber cambiado de región entre
    // que se abrió el panel y este envío. Ver "CC condicional a Europa..."
    // en diagnostico-carrito.md.
    var ccField = D.form.querySelector('input[name="_cc"]');
    if (ccField) ccField.value = window.getCcAddresses();
    D.submit.disabled = true;
    D.submit.textContent = "Enviando...";
    try {
        var r = await fetch(window.getEndpoint(), { method: "POST", body: new FormData(D.form) });
        if (r.ok) {
            window.toggleCart(false);
            D.success.style.display = "flex";
            window.cartItems = [];
            window.updateCartState();
            D.form.reset();
        } else { D.error.style.display = "flex" }
    } catch (x) { D.error.style.display = "flex" }
    finally { D.submit.disabled = false; D.submit.textContent = "Enviar Solicitud" }
};
 
var popSel = () => {
    rf();
    if (D.select && D.select.options.length <= 1) {
        D.select.innerHTML = '<option value="" selected>País</option>';
        window.ALL_COUNTRIES.forEach(c => {
            var o = document.createElement("option");
            o.value = c; o.textContent = c; D.select.appendChild(o);
        });
    }
};
 
window.startApp = async () => {
    window.cartItems = window.loadCart();
    // No se espera (sin "await") a que terminen de cargarse los eventos antes
    // de conectar los botones, el panel y el formulario: si el fetch a
    // eventos.json tarda o falla, el carrito (abrir/cerrar, ítems ya
    // guardados en localStorage, envío del formulario) sigue funcionando
    // igual. addToCart ya maneja por su cuenta la espera/timeout de
    // MOCK_EVENTS. Ver diagnostico-carrito.md.
    window.loadMockEvents();
    var ck = () => {
        rf();
        if (D.openBtn && document.body.contains(D.openBtn)) {
            D.openBtn.onclick = () => window.toggleCart(true);
            D.closeBtn.onclick = () => window.toggleCart(false);
            D.form.onsubmit = handleFormSubmit;
            if (D.privacy && D.submit) {
                D.privacy.onchange = () => { D.submit.disabled = !D.privacy.checked; D.submit.style.opacity = D.privacy.checked ? 1 : 0.5 };
            }
            if (D.closeSuccess) D.closeSuccess.onclick = () => D.success.style.display = "none";
            if (D.closeError) D.closeError.onclick = () => D.error.style.display = "none";
            document.addEventListener("click", e => {
                if (window.isCartOpen && D.cart && !D.cart.contains(e.target) && !D.openBtn.contains(e.target)) window.toggleCart(false);
            });
 
            popSel();
 
            // --- INICIO DE LA AGREGRACIÓN DE COPIAS (CC) ---
            if (D.form) {
                if (!D.form.querySelector('input[name="_cc"]')) {
                    var ccInput = document.createElement("input");
                    ccInput.type = "hidden";
                    ccInput.name = "_cc";
                    ccInput.value = CC_BASE;
                    D.form.appendChild(ccInput);
                }
                if (!D.form.querySelector('input[name="_subject"]')) {
                    var subInput = document.createElement("input");
                    subInput.type = "hidden";
                    subInput.name = "_subject";
                    subInput.value = "Eventos seleccionados - Web CMS Eventos";
                    D.form.appendChild(subInput);
                }
                // Honeypot anti-spam de FormSubmit: campo oculto llamado
                // "_honey" (nombre fijo que exige FormSubmit). Un usuario real
                // nunca lo ve ni lo completa (display:none + fuera del tab
                // order); si un bot lo completa, FormSubmit descarta el envío
                // en silencio. Mitiga el riesgo ya documentado de que los
                // endpoints de FormSubmit están expuestos en este archivo
                // público. No reemplaza la restricción por dominio permitido
                // en el panel de FormSubmit, que sigue pendiente de revisar.
                if (!D.form.querySelector('input[name="_honey"]')) {
                    var honeyInput = document.createElement("input");
                    honeyInput.type = "text";
                    honeyInput.name = "_honey";
                    honeyInput.style.display = "none";
                    honeyInput.tabIndex = -1;
                    honeyInput.autocomplete = "off";
                    D.form.appendChild(honeyInput);
                }
            }
            // --- FIN DE LA AGREGACIÓN ---
 
            window.updateCartState();
        } else { setTimeout(ck, 300) }
    };
    ck();
};
 
// --- INICIALIZACIÓN ---
// Antes esto usaba un MutationObserver sobre todo el document (subtree +
// childList), que se disparaba con CUALQUIER cambio del DOM, no solo con
// una navegación real. Se reemplaza por la interceptación de pushState /
// replaceState (que es como el router de Framer cambia de URL sin recargar
// la página) + el evento popstate (navegación con atrás/adelante del
// navegador). Mismo comportamiento (se sigue comparando contra
// window.lastUrl para no reinicializar si la URL no cambió realmente, y se
// mantiene el mismo delay de 800ms antes de reinicializar), pero sin pagar
// el costo de observar cada mutación del DOM.
if (!window.APP_INITIALIZED) {
    window.lastUrl = location.href;
    var onUrlChange = () => {
        if (location.href !== window.lastUrl) {
            window.lastUrl = location.href;
            setTimeout(() => { window.updateCartState(); window.startApp(); }, 800);
        }
    };
    var origPushState = history.pushState;
    history.pushState = function () {
        origPushState.apply(this, arguments);
        onUrlChange();
    };
    var origReplaceState = history.replaceState;
    history.replaceState = function () {
        origReplaceState.apply(this, arguments);
        onUrlChange();
    };
    window.addEventListener("popstate", onUrlChange);
    window.APP_INITIALIZED = true;
}
window.startApp();
 
