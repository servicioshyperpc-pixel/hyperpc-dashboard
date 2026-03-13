# Dashboard HyperPC

Panel operativo para publicar productos desde Odoo hacia marketplaces y revisar trazabilidad del orquestador.

## Qué hace hoy

### Login
- autenticación real contra el backend
- endpoints usados:
  - `POST /auth/login`
  - `GET /auth/me`

### Productos
- la tabla base sale solo de Odoo
- si un producto no existe en Odoo, no aparece en el dashboard
- cada producto permite:
  - guardar configuración comercial por marketplace
  - publicar un canal
  - publicar canales seleccionados para un solo producto
  - publicación masiva por lotes

### Publicación masiva
- selección múltiple desde la tabla
- modal para elegir marketplaces
- modo `Verificar`
- modo `Publicar`
- lotes de hasta `100`
- tamaño por defecto: `50`

### Órdenes
- vista alimentada por logs reales del orquestador
- permite revisar órdenes por `orderId`, canal, estado y último evento

### Historial
- consume logs reales desde Mongo a través del backend
- muestra eventos, errores e incidentes recientes
- incluye botón `Actualizar`

## Regla de negocio actual

- Odoo es el catálogo maestro
- el dashboard no edita Odoo
- el dashboard solo administra publicación y contenido comercial por marketplace
- si un producto no existe en Odoo, no se publica desde este panel

## Arquitectura operativa

### Fuente de datos
- catálogo: Odoo
- estados de publicación: Mongo
- trazabilidad operativa: `/logs`

### Marketplaces soportados
- Falabella
- MercadoLibre
- Ripley
- Paris
- Walmart

## Stack

- React 19
- TypeScript
- Vite
- Zustand
- React Router DOM
- Tailwind CSS
- Lucide React

## Variables

Crear un `.env.local` con:

```bash
VITE_API_URL=https://backend-or-api.fly.dev
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

El proyecto puede desplegarse en Vercel.

Si el repo ya está linkeado al proyecto correcto:

```bash
vercel --prod
```

## Flujo recomendado de uso

1. crear o actualizar producto en Odoo
2. abrir el producto en el dashboard
3. completar configuración por marketplace
4. usar `Verificar`
5. publicar un canal, varios canales del producto, o una selección masiva

## Estado actual

### Hecho
- login real
- catálogo desde Odoo
- borradores por marketplace
- publicación individual
- publicación por canales seleccionados para un producto
- publicación masiva
- órdenes e historial desde logs reales

### Pendiente de validar operativamente
- pruebas completas por marketplace con datos reales del cliente
- ajustes finos de categorías, atributos e imágenes por canal

## Nota

La verificación masiva está optimizada para trabajar con Odoo y estado local del orquestador. No depende de consultas en vivo a todos los marketplaces en cada ejecución.
