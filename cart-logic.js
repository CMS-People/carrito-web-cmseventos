// --- CONFIGURACIÓN Y VARIABLES GLOBALES ---
window.getCurrentLang = () => {
    const path = window.location.pathname;
    if (path.includes('/en')) return 'en';
    if (path.includes('/pt')) return 'pt';
    return 'es'; 
};

var EVENTS_JSON_URL = "https://gist.githubusercontent.com/CMS-People/389e604db6a04767f0b55edc5b97acd9/raw/eventos.json?nocache=" + new Date().getTime();
    // esta era la url del gist de mi GitHub:  "https://gist.githubusercontent.com/Lauchis/50b5ece416be0f17df01c554fd70871f/raw/eventos.json?nocache=" + new Date().getTime();
// var EVENTS_JSON_URL = "https://gitlab.com/-/snippets/5980284/raw/main/eventos.json?inline=false&nocache=" + new Date().getTime();
window.ALL_COUNTRIES = ["Alemania", "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Ecuador", "El Salvador", "España", "Estados Unidos", "Francia", "Guatemala", "Honduras", "Italia", "México", "Nicaragua", "Otros", "Panamá", "Paraguay", "Perú", "Portugal", "Puerto Rico", "Reino Unido", "República Dominicana", "Uruguay", "Venezuela"].sort();

var ENDPOINTS = {
    brasil: "https://formsubmit.co/ajax/c.boueri@cmspeople.com",
    europa: "https://formsubmit.co/ajax/antonio.soto@cmspeople.com",
    latam: "https://formsubmit.co/ajax/tatiana.remaggi@cmspeople.com",
    mexico: "https://formsubmit.co/ajax/tatiana.remaggi@cmspeople.com"
};

var KEY = "framer_event_cart";
window.MOCK_EVENTS = window.MOCK_EVENTS || [];
window.cartItems = [];
window.isCartOpen = false;

// --- FUNCIONES DE NÚCLEO ---
window.loadCart = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch (e) { return [] } };
window.saveCart = c => { try { localStorage.setItem(KEY, JSON.stringify(c)) } catch (e) { } };
window.loadMockEvents = async () => { if (window.MOCK_EVENTS.length > 0) return; try { var r = await fetch(EVENTS_JSON_URL); window.MOCK_EVENTS = await r.json() } catch (e) { } };

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

window.syncEmbedButtons = () => {
    document.querySelectorAll('iframe').forEach(i => {
        try { if (typeof i.contentWindow.updateThisButton === "function") i.contentWindow.updateThisButton() } catch (e) { }
    });
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
    setTimeout(window.syncEmbedButtons, 100);
};

window.addToCart = id => {
    var check = () => {
        if (!window.MOCK_EVENTS?.length) { setTimeout(check, 50); return; }
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
    await window.loadMockEvents();
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
                    ccInput.value = "juan.lopez@cmspeople.com,szubillaga@cmspeople.com";
                    D.form.appendChild(ccInput);
                }
                if (!D.form.querySelector('input[name="_subject"]')) {
                    var subInput = document.createElement("input");
                    subInput.type = "hidden";
                    subInput.name = "_subject";
                    subInput.value = "Eventos seleccionados - Web CMS Eventos";
                    D.form.appendChild(subInput);
                }
            }
            // --- FIN DE LA AGREGACIÓN ---

            window.updateCartState();
        } else { setTimeout(ck, 300) }
    };
    ck();
};

// --- INICIALIZACIÓN ---
if (!window.APP_INITIALIZED) {
    window.lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== window.lastUrl) {
            window.lastUrl = location.href;
            setTimeout(() => { window.updateCartState(); window.startApp(); }, 800);
        }
    }).observe(document, { subtree: true, childList: true });
    window.APP_INITIALIZED = true;
}
window.startApp();
