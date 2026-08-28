# Carrito de eventos — cmseventos.com

Carrito de selección de eventos integrado en la web de CMS People (Framer), que permite a un visitante marcar "Me interesa" en varios eventos y enviar una única solicitud de sponsorship/información con todos los eventos elegidos.

Creado e implementado por **Laura** (desarrolladora web, CMS People).

Vive en **cmseventos.com** (home) y en **cmseventos.com/events**, cada una en sus tres versiones de idioma: español, inglés (`/en`) y portugués (`/pt`).

## Por qué está repartido en 4 partes

Framer restringe fuertemente el código externo que se puede escribir directamente en sus configuraciones (tanto en qué se puede ejecutar como en la cantidad de caracteres permitidos). Por eso la lógica no vive en un solo archivo, sino repartida en 4 piezas, cada una alojada donde Framer sí lo permite:

1. **Embed de HTML en el canvas de Framer** — el listado de eventos y sus filtros (existen dos, ver más abajo).
2. **Configuraciones de la web** (`<head>` y final del `</body>`) — el markup del carrito (botón flotante, panel lateral, formulario, modales) y la carga del script principal.
3. **`cart-logic.js`**, alojado en GitHub y servido vía jsDelivr — toda la lógica del carrito (estado, persistencia, envío del formulario).
4. **Gist de GitHub** (`eventos-traducidos.json`) — los datos de todos los eventos, en los tres idiomas.

## Arquitectura

### 1. Head de Framer (`Configuración + Lógica sin DOM.html`)

Contenido pegado en la configuración **Start of head** de Framer, con "Run on Every Page Visit". Es idéntico en las 6 páginas donde corre el carrito: Home, `/events`, `/en`, `/pt`, `/events/pt`, `/events/en`.

Incluye:
- `dns-prefetch` / `preconnect` a `cdn.jsdelivr.net`, para adelantar la conexión con el CDN que sirve `cart-logic.js`.
- Un `<style>` con el CSS del carrito (panel lateral, inputs del formulario, modales de éxito/error). Este CSS es del carrito en sí (no del listado de eventos, que tiene el suyo propio en `embed-styles.css`).
- El `<script>` que carga `cart-logic.js` desde GitHub vía jsDelivr, con `defer`.

### 2. Final del body de Framer (`script de inicialización.html`)

Contenido pegado en la configuración **End of body** de Framer, también en las mismas 6 páginas. Es puro markup (sin lógica):
- El botón flotante que abre el carrito (`#open-cart-btn-global`).
- El panel lateral del carrito (`#side-cart-global`), con el listado de ítems agregados y el formulario de contacto (nombre, teléfono, email, empresa, cargo, país, checkbox de privacidad).
- Los modales de éxito y error tras enviar el formulario.

Todos los IDs de estos elementos terminan en `-global`, porque viven en el documento principal de Framer (no dentro de un iframe) y son referenciados por `cart-logic.js` a través de `document.getElementById`.

### 3. `cart-logic.js` (GitHub, servido vía jsDelivr)

Es el cerebro del carrito. Se carga una única vez, desde el head. Expone funciones globales (`window.*`) para que los embeds —que corren dentro de iframes— puedan invocarlas a través de `window.parent`:

| Función global | Qué hace |
|---|---|
| `getCurrentLang()` | Determina el idioma (`es`/`en`/`pt`) según el path de la URL. |
| `loadMockEvents()` | Trae `eventos-traducidos.json` desde el Gist y lo guarda en `window.MOCK_EVENTS`. |
| `loadCart()` / `saveCart()` | Persisten el carrito en `localStorage` (clave `framer_event_cart`). |
| `addToCart(id)` | Agrega un evento (por id) al carrito y abre el panel. |
| `removeFromCart(id)` | Quita un evento del carrito. |
| `updateCartState()` | Repinta el contador, el listado de ítems y el estado del formulario según `window.cartItems`. |
| `toggleCart(open?)` | Abre/cierra el panel lateral. |
| `getEndpoint()` | Devuelve el endpoint de FormSubmit.co según la región de los eventos elegidos (Europa, Brasil, México o Latam por defecto). |
| `startApp()` | Inicializa listeners (botones, formulario, checkbox de privacidad, click afuera del panel) y puebla el combo de países. |

El envío del formulario se hace por `fetch` (AJAX) contra el endpoint de FormSubmit.co correspondiente, con copia oculta (`_cc`) a las direcciones internas de seguimiento y un asunto fijo (`_subject`).

Como Framer es una SPA (cambia de URL sin recargar la página), `cart-logic.js` intercepta `history.pushState` / `history.replaceState` y escucha `popstate` para detectar navegación real y reinicializar el carrito cuando corresponde.

### 4. Gist de eventos (`eventos-traducidos.json`)

Un Gist de GitHub con el array completo de eventos. Cada evento tiene, entre otros campos:
- `id` (numérico, único).
- `startDate` (`YYYY-MM-DD`) — usado para el orden cronológico de las tarjetas.
- `title`, `description`, `date`, `participants` — objetos con claves `es`/`en`/`pt`.
- `location`, `region` (`Latam` / `Brasil` / `Europa` / `Mexico`), `segmentos` (array), `year`, `ticketType`, `users`.
- `image`, `eventLink`, `videoLink`, `brochureLink`.

`cart-logic.js` lo trae con `loadMockEvents()` y lo deja disponible en `window.MOCK_EVENTS`, de donde lo consumen los dos embeds.

### Los dos embeds (Framer canvas)

Cada uno es un HTML Embed independiente dentro del canvas de Framer, corre en su propio iframe, y se comunica con el documento principal a través de `window.parent` (para llamar a `addToCart`, `toggleCart`, `updateCartState` y leer `MOCK_EVENTS`/`getCurrentLang`).

- **`embed home.html`** — el listado de la home. Muestra hasta 9 tarjetas, priorizando el año actual y el siguiente (con relleno de otros años si hace falta para completar las 9). Filtros: Región y Segmento.
- **`embed events.html`** — el listado de `/events`. Sin límite de tarjetas por año: pagina de a 12, con filtros de Región, Año y Segmento.

En ambos, las tarjetas se ordenan cronológicamente a partir de `startDate` (próximos primero, del más cercano al más lejano; luego los pasados, del más reciente al más antiguo). Cada tarjeta tiene un botón "Me interesa" que llama a `addToCart` en el documento padre, y opcionalmente un botón de video (popup con iframe de YouTube/Instagram embebido) si el evento tiene `videoLink`.

El contenido de estos dos archivos es el mismo para las 3 variantes de idioma de cada página (home ES/EN/PT usan el mismo `embed home.html`; events ES/EN/PT usan el mismo `embed events.html`) — el idioma se resuelve en tiempo de ejecución vía `getCurrentLang()`, no hay contenido distinto por idioma en estos archivos.

Los textos fijos de la interfaz (labels de los filtros, "Ver Brochure", "Me interesa", mensaje de "sin resultados", etc.) están en un diccionario `UI_TEXTS` dentro de cada embed, con sus tres traducciones.

### `embed-styles.css` (GitHub, servido vía jsDelivr)

CSS compartido entre los dos embeds (tarjetas, grillas, botones, popup de video, utilidades tipo Tailwind). Cada embed conserva inline solo lo que le es propio: la cantidad de columnas del grid en desktop (3 en home, 4 en events) y los estilos de paginación (solo en events).

## Flujo de datos, resumido

```
Framer (documento principal)
├── Head: <script cart-logic.js>  →  expone window.addToCart, toggleCart, updateCartState, getCurrentLang, MOCK_EVENTS...
├── Body: markup del botón flotante + panel lateral + formulario + modales
│
├── Embed "home" (iframe)  ──┐
└── Embed "events" (iframe) ─┴──> vía window.parent.* consumen MOCK_EVENTS y llaman a addToCart/toggleCart/updateCartState

cart-logic.js, al iniciar:
1. Carga el carrito guardado en localStorage (si había uno de una visita anterior)
2. Trae eventos-traducidos.json desde el Gist → window.MOCK_EVENTS
3. Conecta los listeners del botón, panel y formulario
```

## Cómo se usa (visitante)

1. En la home o en `/events`, el visitante navega el listado de eventos (con filtros de región/segmento/año según la página).
2. Hace clic en "Me interesa" en los eventos que le interesan → se agregan al carrito y se abre el panel lateral.
3. Puede sumar más eventos desde cualquiera de las dos páginas (el carrito persiste en `localStorage`, entre páginas y entre visitas).
4. Completa el formulario de contacto dentro del panel (nombre, email, empresa, cargo, país, aceptación de privacidad) y envía.
5. El formulario se envía por AJAX al endpoint de FormSubmit.co que corresponde según la región de los eventos elegidos; se muestra un modal de éxito o error, y si fue exitoso el carrito se vacía.

## Dónde se modifica cada parte

| Qué querés cambiar | Dónde |
|---|---|
| Agregar, editar o quitar un evento (título, fechas, imagen, links, segmento, región, etc.) | Gist `eventos-traducidos.json` en GitHub |
| Textos fijos de la interfaz de los listados (labels de filtros, botones, mensaje de "sin resultados") en los 3 idiomas | Diccionario `UI_TEXTS` dentro de `embed home.html` / `embed events.html` |
| Cantidad de columnas del grid, look de las tarjetas, paginación, popup de video | `embed-styles.css` (compartido) + el bloque `<style>` inline de cada embed (lo específico de cada uno) |
| Agregar/quitar filtros, cambiar el límite de tarjetas de la home, la paginación de `/events`, el orden de las tarjetas | El `<script>` dentro de `embed home.html` / `embed events.html`, según corresponda |
| Lógica del carrito: agregar/quitar ítems, persistencia, armado del payload del formulario, endpoints de FormSubmit.co por región, direcciones de copia oculta | `cart-logic.js` en GitHub |
| Markup del botón flotante, panel lateral, campos del formulario, modales de éxito/error | `script de inicialización.html` (configuración de Framer, end of body) |
| Estilos propios del panel del carrito (no del listado de eventos) y precarga del CDN | `Configuración + Lógica sin DOM.html` (configuración de Framer, head) |

## Cómo se actualiza cada parte en producción

- **`cart-logic.js` y `embed-styles.css`**: viven en el repo de GitHub y se sirven vía jsDelivr con la rama `@main` (`https://cdn.jsdelivr.net/gh/<owner>/<repo>@main/<archivo>`). Alcanza con hacer push a `main` — no requieren tocar nada en Framer. jsDelivr cachea el contenido de `@main`, así que si un cambio no se refleja enseguida hay que purgar la caché desde [jsdelivr.com/tools/purge](https://www.jsdelivr.com/tools/purge) para la URL del archivo.
- **`eventos-traducidos.json`**: se edita directamente en el Gist de GitHub. Se trae con `{ cache: "no-cache" }` en cada carga de página, así que no depende de purgar ninguna caché externa.
- **`embed home.html` / `embed events.html`**: como son Embeds de HTML pegados en el canvas de Framer (no archivos externos), un cambio en el contenido hay que volver a pegarlo manualmente en cada instancia del canvas: 3 veces para `embed home.html` (home ES/EN/PT) y 3 veces para `embed events.html` (events ES/EN/PT).
- **`Configuración + Lógica sin DOM.html` / `script de inicialización.html`**: son las configuraciones de head/body de Framer. Un cambio hay que volver a pegarlo en las 6 páginas donde corren (Home, `/events`, `/en`, `/pt`, `/events/pt`, `/events/en`).

## Ubicación del código

- Repositorio de GitHub: **CMS-People/carrito-web-cmseventos** (rama `main`) — aloja `cart-logic.js` y `embed-styles.css`, servidos vía jsDelivr.
- Gist de GitHub, en la cuenta **CMS-People** — aloja `eventos-traducidos.json`.
- El resto (los dos Embeds y las configuraciones de head/body) vive únicamente dentro del proyecto de Framer de cmseventos.com; no está en ningún repositorio.
