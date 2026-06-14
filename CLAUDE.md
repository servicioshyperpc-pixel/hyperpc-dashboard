# HyperPC Dashboard — Frontend del orquestador

Dashboard de operaciones de HyperPC. **Es el frontend de `backend-or`** (el
orquestador de marketplaces). Desde acá se ve el catálogo, se publica/actualiza
en los marketplaces y se monitorean órdenes/logs.

## Stack

- **React + Vite + TypeScript + Tailwind**.
- Toda la comunicación con el backend pasa por `src/api/axiosInstance.ts`
  (Bearer token en `localStorage`, key `hyperpc_dashboard_token`).
- **API base**: `VITE_API_URL` → prod `https://backend-or-api.fly.dev`, local `http://localhost:3000`.

## Backend al que apunta (importante)

`backend-or` se despliega como **2 apps Fly**. El dashboard habla **solo con la API**:
- `backend-or-api` ← el dashboard consume esta (endpoints + publicación + bulk-import).
- `backend-or-worker` → órdenes/stock/Odoo (post-venta). El dashboard NO le pega directo.

Si un endpoint que usás cambia de shape, revisá `backend-or` (la KB en `backend-or/.agents/architecture/frontend-dashboard.md` tiene el contrato).

## Dónde está cada cosa

- **`src/views/products/ProductList.tsx`** — archivo central y grande. Catálogo,
  detalle de producto, canales, carga/actualización masiva, importar Excel. La
  mayoría de las features viven acá.
- `src/api/axiosInstance.ts` — cliente HTTP (token, redirect a /login en 401).
- `src/core/layouts/MainLayout.tsx` — layout (sidebar + header sticky).

### Endpoints principales que consume
| Acción | Endpoint backend |
|---|---|
| Listar catálogo | `GET /catalog/products` |
| Detalle producto | `GET /catalog/products/:sku` |
| Estado por marketplace | `POST /marketplace-sync/status` |
| Publicar 1 canal | `POST /catalog/products/:sku/marketplaces/:mp/publish` |
| Actualización masiva | `POST /catalog/products/bulk-update` |
| Publicación masiva | `POST /catalog/products/bulk-publish` |
| Importar Excel | `POST /bulk-import/upload` + `GET /bulk-import/:jobId/status` |
| Logs / órdenes | `GET /logs...` |

## Deploy

- **Prod = Vercel**: `npx vercel --prod --yes` desde la raíz. Aliased a
  `https://hyperpc-dashboard.vercel.app`.
- OJO: Vercel **NO** auto-deploya al pushear a `main` (no hay Git integration) →
  hay que correr el CLI a mano.
- El script `npm run deploy` usa `gh-pages` (GitHub Pages) — **NO es el prod real**
  y además `gh-pages` no está en las deps (usar `npx gh-pages` si se quisiera).
- Build: `npm run build` (`tsc -b && vite build`).

## Convenciones / decisiones vigentes

- **Flags de UI** (ocultar sin borrar, "por las dudas"), en `ProductList.tsx`:
  - `SHOW_PUBLISH_BUTTONS = false` → oculta "Publicar este canal", "Publicar en
    todos los canales" y "Guardar cambios".
  - `SHOW_CREAR_MASIVO = false` → oculta el botón "Crear masivo".
  - Reactivar = poner el flag en `true`.
- **Descripción del producto**: MercadoLibre se muestra en **texto plano**
  (`stripHtml`); el resto de los canales en **HTML** (pedido del cliente).
- **Imágenes**: vienen de Odoo (miniatura base64 `imageThumbBase64`/`imageBase64`
  y/o array `images` con URLs). Si no hay ninguna → se muestra aviso "Falta imagen".

## Antes de deployar

1. `npm run build` (debe pasar `tsc`).
2. `npx vercel --prod --yes`.
3. Verificar en `https://hyperpc-dashboard.vercel.app` (Cmd+Shift+R para saltear caché).
