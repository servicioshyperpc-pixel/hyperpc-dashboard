# Dashboard HyperPC

Dashboard de administración para el orquestador de inventario de HyperPC.

## Descripción

Este dashboard permite visualizar y gestionar el flujo de ventas entre múltiples marketplaces (Falabella, MercadoLibre, Ripley, Paris, Walmart) y Odoo, mostrando el proceso completo desde la recepción de la orden hasta la sincronización de stock.

## Características Principales

### 1. Dashboard (Inicio)
- **Timeline de ventas del día**: Visualización del flujo completo (Venta → Odoo → Stock → Marketplaces)
- **Alertas de errores**: Detección automática de fallas en cualquier paso del proceso
- **Estadísticas**: Total ventas, monto, errores, órdenes pendientes
- **Estado por marketplace**: Indicadores visuales de conexión y sincronización

### 2. Carga Masiva
- **Upload CSV/Excel**: Arrastrar y soltar archivos con inventario
- **Preview de datos**: Vista previa antes de procesar
- **Selector de marketplaces**: Elegir destinos de sincronización
- **Progreso en tiempo real**: Barra de progreso con contador
- **Resultados detallados**: Éxitos, fallos y errores

### 3. Productos
- **Catálogo completo**: Lista con filtros por marketplace
- **Detalle de producto**: Información extendida con imagen
- **Stock por marketplace**: Niveles de inventario en cada canal
- **Indicadores de alerta**: Stock bajo destacado

## Arquitectura

```
src/
├── api/           # Cliente HTTP con interceptores
├── core/          # Componentes UI, layouts, utilidades
├── integrations/  # Adaptadores por marketplace
├── store/         # Estados globales (Zustand)
├── views/         # Páginas principales
└── data/          # Datos mock para desarrollo
```

## Stack Tecnológico

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (estilos)
- **Zustand** (gestión de estado)
- **React Router DOM** (navegación)
- **Lucide React** (iconos)

## Marketplaces Soportados

- ✅ Falabella
- ✅ MercadoLibre
- ✅ Ripley
- ✅ Paris
- ✅ Walmart
- ✅ Odoo (ERP)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Build Producción

```bash
npm run build
```

## Datos de Prueba (Mock)

El dashboard incluye datos mock para demostración:
- 5 ventas de ejemplo con diferentes estados
- 5 productos con stock variado
- Logs del sistema con éxitos y errores

### Usuarios de prueba
- **Admin**: `admin@hyperpc.cl` / `admin123`
- **Usuario**: `user@hyperpc.cl` / `user123`

## Flujo de Ventas Visualizado

Cada venta muestra el proceso en 4 pasos:
1. **Orden Recibida** → Llegada desde marketplace
2. **Odoo Procesando** → Confirmación en ERP
3. **Stock Rebajado** → Descontar inventario
4. **Marketplaces Sync** → Actualizar otros canales

Indicadores visuales:
- 🟢 Éxito
- 🔴 Error (con mensaje)
- ⚪ Pendiente

## Próximos Pasos (Integración)

Para conectar con el backend real:
1. Configurar `VITE_API_URL` en `.env`
2. Implementar autenticación JWT
3. Conectar endpoints del orquestador
4. WebSockets para notificaciones en tiempo real

## Licencia

Proyecto privado - HyperPC Chile
