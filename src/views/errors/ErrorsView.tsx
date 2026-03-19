import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../../core/components/Card';
import { Badge } from '../../core/components/Badge';
import axiosInstance from '../../api/axiosInstance';
import { AlertTriangle, RefreshCcw, ScrollText, ShieldAlert, Package, Wifi, Database, ChevronDown, ChevronUp, CheckCheck, Trash2 } from 'lucide-react';

interface LogEntry {
  _id?: string;
  id?: string;
  service?: string;
  action?: string;
  status?: string;
  orderId?: string;
  productSku?: string;
  marketplace?: string;
  createdAt?: string;
  errors?: any;
  response?: any;
  request?: any;
  duration?: number;
  metadata?: any;
}

const INCIDENT_STATUSES = new Set(['error', 'warning', 'partial']);
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function badgeVariant(status?: string): 'success' | 'error' | 'warning' | 'default' {
  if (status === 'error') return 'error';
  if (status === 'partial' || status === 'warning') return 'warning';
  if (status === 'success') return 'success';
  return 'default';
}

// Categorizar el error para mostrar icono y label legible
function categorizeError(log: LogEntry): { label: string; icon: typeof AlertTriangle; color: string } {
  const errStr = typeof log.errors === 'string' ? log.errors : JSON.stringify(log.errors || '');
  const action = log.action || '';

  if (errStr.includes('available_quantity') || errStr.includes('not_updatable') || errStr.includes('multi warehouse')) {
    return { label: 'Stock no actualizable (multi-warehouse)', icon: Package, color: 'text-amber-600 bg-amber-50' };
  }
  if (errStr.includes('timeout') || errStr.includes('ETIMEDOUT') || errStr.includes('ECONNREFUSED')) {
    return { label: 'Timeout / Conexion', icon: Wifi, color: 'text-orange-600 bg-orange-50' };
  }
  if (errStr.includes('500') || errStr.includes('Internal Server')) {
    return { label: 'Error del marketplace (500)', icon: Wifi, color: 'text-orange-600 bg-orange-50' };
  }
  if (errStr.includes('Insufficient stock') || errStr.includes('Stock quant not found')) {
    return { label: 'Sin stock en Odoo', icon: Package, color: 'text-red-600 bg-red-50' };
  }
  if (errStr.includes('not found') || errStr.includes('no encontr')) {
    return { label: 'Recurso no encontrado', icon: Database, color: 'text-gray-600 bg-gray-50' };
  }
  if (errStr.includes('requires_manual_review') || action.includes('cancellation')) {
    return { label: 'Requiere revision manual', icon: ShieldAlert, color: 'text-purple-600 bg-purple-50' };
  }
  if (action === 'out_of_stock') {
    return { label: 'Sin stock', icon: Package, color: 'text-red-600 bg-red-50' };
  }
  if (action.includes('polling') || action.includes('cycle')) {
    return { label: 'Error en polling', icon: Wifi, color: 'text-orange-600 bg-orange-50' };
  }
  return { label: 'Error general', icon: AlertTriangle, color: 'text-red-600 bg-red-50' };
}

// Extraer mensaje legible del error
function friendlyErrorMessage(log: LogEntry): string {
  const err = log.errors;
  if (!err) return '-';

  const str = typeof err === 'string' ? err : '';

  // Timeout
  if (str.includes('timeout')) {
    const match = str.match(/timeout of (\d+)ms/);
    return `La API de ${log.marketplace || log.service || 'marketplace'} no respondio en ${match ? `${Math.round(Number(match[1]) / 1000)}s` : 'tiempo'}`;
  }

  // Multi-warehouse MeLi
  if (str.includes('available_quantity') || str.includes('not_updatable')) {
    return `MercadoLibre tiene multi-warehouse activado. Hay que usar el endpoint de inventario por bodega en vez de available_quantity`;
  }

  // Stock insuficiente
  if (str.includes('Insufficient stock')) {
    return `No hay stock suficiente en Odoo para el SKU ${log.productSku || ''}`;
  }

  // 500
  if (str.includes('status code 500')) {
    return `La API de ${log.marketplace || log.service || 'marketplace'} devolvio error interno (500)`;
  }

  // Manual review
  if (str.includes('requires_manual_review')) {
    const reason = str.replace('requires_manual_review:', '').trim();
    return `La orden no se puede cancelar automaticamente. Estado en Odoo: ${reason || 'desconocido'}`;
  }

  // Not found
  if (str.includes('not found')) {
    return str;
  }

  // Si es un JSON, intentar extraer el message
  if (typeof err === 'object') {
    if (err.message) return err.message;
    if (err.cause?.[0]?.message) return err.cause[0].message;
    try {
      return JSON.stringify(err);
    } catch {
      return 'Error desconocido';
    }
  }

  return str || 'Error desconocido';
}

function actionLabel(action?: string): string {
  const map: Record<string, string> = {
    sale_cycle_completed: 'Ciclo de venta',
    cancellation_completed: 'Cancelacion',
    stock_sync_completed: 'Sync de stock',
    stock_restore_sync_completed: 'Restauracion de stock',
    marketplace_update_completed: 'Update marketplace',
    stock_full_sync_completed: 'Sync completo',
    polling_cycle_completed: 'Polling',
    cancellation_polling_completed: 'Polling cancelaciones',
    out_of_stock: 'Sin stock',
  };
  return map[action || ''] || action || 'Evento';
}

export function ErrorsView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all');
  const [dismissing, setDismissing] = useState(false);

  const loadLogs = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await axiosInstance.get<LogEntry[]>('/logs');
      setLogs(Array.isArray(response.data) ? response.data : []);
    } catch {
      setLogs([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const dismissOne = async (id: string) => {
    try {
      await axiosInstance.post('/logs/dismiss', { ids: [id] });
      setLogs((prev) => prev.filter((l) => (l._id || l.id) !== id));
    } catch { /* silent */ }
  };

  const dismissAllVisible = async () => {
    if (incidents.length === 0) return;
    setDismissing(true);
    try {
      const ids = incidents.map((l) => l._id || l.id).filter(Boolean) as string[];
      await axiosInstance.post('/logs/dismiss', { ids });
      await loadLogs();
    } catch { /* silent */ }
    setDismissing(false);
  };

  const incidents = useMemo(() => {
    const now = Date.now();
    return [...logs]
      .filter((log) => {
        if (!log.status || !INCIDENT_STATUSES.has(log.status)) return false;
        if (!log.createdAt) return true;
        if (now - new Date(log.createdAt).getTime() > SEVEN_DAYS_MS) return false;
        if (filter === 'all') return true;
        if (filter === 'error') return log.status === 'error';
        if (filter === 'warning') return log.status === 'warning' || log.status === 'partial';
        return true;
      })
      .sort((a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0));
  }, [logs, filter]);

  const errorCount = incidents.filter((l) => l.status === 'error').length;
  const warningCount = incidents.filter((l) => l.status === 'warning' || l.status === 'partial').length;
  const affectedMarketplaces = new Set(incidents.map((l) => l.marketplace).filter(Boolean));

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">Historial de Incidentes</h1>
          <p className="mt-1 text-sm text-gray-500">Errores y advertencias de los ultimos 7 dias</p>
        </div>
        <div className="flex items-center gap-3">
          {incidents.length > 0 && (
            <button
              type="button"
              onClick={() => void dismissAllVisible()}
              disabled={dismissing}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" />
              {dismissing ? 'Descartando...' : `Descartar todos (${incidents.length})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => void loadLogs()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card bodyClassName="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Total incidentes</p>
          <p className="text-2xl font-bold text-gray-950 sm:text-3xl">{incidents.length}</p>
        </Card>
        <Card bodyClassName="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Errores</p>
          <p className="text-2xl font-bold text-red-600 sm:text-3xl">{errorCount}</p>
        </Card>
        <Card bodyClassName="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Advertencias</p>
          <p className="text-2xl font-bold text-amber-600 sm:text-3xl">{warningCount}</p>
        </Card>
        <Card bodyClassName="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Marketplaces afectados</p>
          <p className="text-2xl font-bold text-gray-950 sm:text-3xl">{affectedMarketplaces.size}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(['all', 'error', 'warning'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'error' ? 'Errores' : 'Advertencias'}
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-400">{incidents.length} resultados</span>
      </div>

      {incidents.length === 0 ? (
        <Card bodyClassName="py-12 text-center">
          <ScrollText className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-4 font-medium text-gray-900">No hay incidentes en este momento</p>
          <p className="mt-1 text-sm text-gray-500">Los ultimos 7 dias estan limpios</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {incidents.map((log) => {
            const logId = log._id || log.id || `${log.service}-${log.action}-${log.createdAt}`;
            const category = categorizeError(log);
            const IconComponent = category.icon;
            const isExpanded = expandedId === logId;

            return (
              <Card key={logId} bodyClassName="space-y-0">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : logId)}
                  className="w-full text-left"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-xl p-2 ${category.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-950">{category.label}</p>
                          <Badge variant={badgeVariant(log.status)} size="sm">{log.status || 'unknown'}</Badge>
                          {log.marketplace && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              {log.marketplace}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{friendlyErrorMessage(log)}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span>{actionLabel(log.action)}</span>
                          {log.orderId && <span>Orden: <span className="font-mono">{log.orderId}</span></span>}
                          {log.productSku && <span>SKU: <span className="font-mono">{log.productSku}</span></span>}
                          {log.duration && <span>{log.duration}ms</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap text-sm text-gray-500">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('es-CL') : 'Sin fecha'}
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    {/* Detalle tecnico */}
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase text-gray-400">Servicio</p>
                        <p className="mt-1 text-sm text-gray-900">{log.service || '-'}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase text-gray-400">Action</p>
                        <p className="mt-1 text-sm text-gray-900">{log.action || '-'}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase text-gray-400">Duracion</p>
                        <p className="mt-1 text-sm text-gray-900">{log.duration ? `${log.duration}ms` : '-'}</p>
                      </div>
                    </div>

                    {/* IDs de Odoo */}
                    {(log.response?.saleOrderId || log.response?.partnerId) && (
                      <div className="flex flex-wrap gap-2">
                        {log.response.saleOrderId && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                            Odoo Order: {log.response.saleOrderId}
                          </span>
                        )}
                        {log.response.partnerId && (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                            Odoo Partner: {log.response.partnerId}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Error raw */}
                    {log.errors && (
                      <div className="rounded-xl bg-red-50 p-3">
                        <p className="text-xs font-medium uppercase text-red-400">Error completo</p>
                        <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-red-800">
                          {typeof log.errors === 'string' ? log.errors : JSON.stringify(log.errors, null, 2)}
                        </pre>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void dismissOne(logId);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Descartar este incidente
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
