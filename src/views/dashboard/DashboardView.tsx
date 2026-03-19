import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../core/components/Card';
import { Badge } from '../../core/components/Badge';
import axiosInstance from '../../api/axiosInstance';
import { BellRing, CircleAlert, Package, RefreshCw, ScrollText, ShoppingCart, XCircle, ArrowDownUp, AlertTriangle } from 'lucide-react';

interface CatalogResponse {
  total: number;
  marketplaces?: string[];
}

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
  duration?: number;
}

const ERROR_STATUSES = new Set(['error', 'warning', 'partial']);
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function actionLabel(action?: string): string {
  const map: Record<string, string> = {
    sale_cycle_completed: 'Venta',
    cancellation_completed: 'Cancelacion',
    stock_sync_completed: 'Sync stock',
    stock_restore_sync_completed: 'Stock restaurado',
    marketplace_update_completed: 'Update marketplace',
    stock_full_sync_completed: 'Sync completo',
    polling_cycle_completed: 'Polling',
    cancellation_polling_completed: 'Polling cancelaciones',
    out_of_stock: 'Sin stock',
  };
  return map[action || ''] || action || 'Evento';
}

function logIcon(log: LogEntry) {
  if (log.action?.includes('cancellation')) return XCircle;
  if (log.action?.includes('stock')) return ArrowDownUp;
  if (log.action?.includes('sale')) return ShoppingCart;
  if (log.status === 'error' || log.status === 'warning') return AlertTriangle;
  return ScrollText;
}

export const DashboardView: React.FC = () => {
  const [catalog, setCatalog] = useState<CatalogResponse>({ total: 0, marketplaces: [] });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catalogResponse, logsResponse] = await Promise.all([
        axiosInstance.get<CatalogResponse>('/catalog/products?limit=1'),
        axiosInstance.get<LogEntry[]>('/logs'),
      ]);

      setCatalog({
        total: catalogResponse.data?.total || 0,
        marketplaces: catalogResponse.data?.marketplaces || [],
      });
      setLogs(Array.isArray(logsResponse.data) ? logsResponse.data : []);
    } catch {
      setCatalog({ total: 0, marketplaces: [] });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Agrupar incidentes por (action + marketplace + error_type) para no contar repetidos
  const { uniqueIncidentCount, groupedIncidents } = useMemo(() => {
    const now = Date.now();
    const incidentLogs = logs.filter((log) => {
      if (!log.status || !ERROR_STATUSES.has(log.status)) return false;
      if (!log.createdAt) return true;
      return now - new Date(log.createdAt).getTime() <= SEVEN_DAYS_MS;
    });

    // Agrupar por clave unica
    const groups = new Map<string, { count: number; latest: LogEntry }>();
    for (const log of incidentLogs) {
      const errStr = typeof log.errors === 'string' ? log.errors.substring(0, 50) : '';
      const key = `${log.action || ''}-${log.marketplace || ''}-${errStr}`;
      const existing = groups.get(key);
      if (!existing || new Date(log.createdAt || 0) > new Date(existing.latest.createdAt || 0)) {
        groups.set(key, {
          count: (existing?.count || 0) + 1,
          latest: log,
        });
      } else {
        existing.count++;
      }
    }

    return {
      uniqueIncidentCount: groups.size,
      groupedIncidents: Array.from(groups.values())
        .sort((a, b) => +new Date(b.latest.createdAt || 0) - +new Date(a.latest.createdAt || 0)),
    };
  }, [logs]);

  // Actividad reciente: deduplicar polling repetido, priorizar eventos de ordenes
  const recentActivity = useMemo(() => {
    const sorted = [...logs].sort((a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0));
    const result: LogEntry[] = [];
    const seenKeys = new Set<string>();

    for (const log of sorted) {
      if (result.length >= 8) break;

      // Agrupar polling repetido
      if (log.action?.includes('polling')) {
        const key = `${log.action}-${log.marketplace}-${log.status}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
      }

      result.push(log);
    }
    return result;
  }, [logs]);

  // Conteos
  const salesCount = useMemo(() =>
    logs.filter((l) => l.action === 'sale_cycle_completed' && l.status === 'success').length,
  [logs]);

  const cancellationCount = useMemo(() =>
    logs.filter((l) => l.action === 'cancellation_completed' && (l.status === 'success' || l.status === 'skipped')).length,
  [logs]);

  const cards = [
    { label: 'Productos Odoo', value: catalog.total, icon: Package, color: '' },
    { label: 'Ventas procesadas', value: salesCount, icon: ShoppingCart, color: 'text-green-600' },
    { label: 'Cancelaciones', value: cancellationCount, icon: XCircle, color: 'text-red-600' },
    { label: 'Incidentes unicos (7d)', value: uniqueIncidentCount, icon: CircleAlert, color: uniqueIncidentCount > 0 ? 'text-amber-600' : '' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Centro de operacion</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">Resumen operativo</h1>
        </div>
        <button
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} bodyClassName="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{card.label}</p>
                <div className="rounded-2xl bg-gray-950 p-2 text-white">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className={`text-2xl font-bold sm:text-3xl ${card.color || 'text-gray-950'}`}>{card.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        {/* Actividad reciente */}
        <Card
          header={
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Actividad</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-950">Historial reciente</h2>
            </div>
          }
        >
          {recentActivity.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
              <BellRing className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-4 font-medium text-gray-900">Sin eventos visibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log) => {
                const Icon = logIcon(log);
                const isError = ERROR_STATUSES.has(log.status || '');
                const isSuccess = log.status === 'success';

                return (
                  <div
                    key={log._id || log.id || `${log.service}-${log.action}-${log.createdAt}`}
                    className={`rounded-2xl border px-4 py-3 ${
                      isError ? 'border-red-100 bg-red-50/30' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-lg p-1.5 ${
                          isError ? 'bg-red-100 text-red-600' : isSuccess ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-gray-950">{actionLabel(log.action)}</p>
                            <Badge
                              variant={isSuccess ? 'success' : isError ? 'error' : 'default'}
                              size="sm"
                            >
                              {log.status || 'unknown'}
                            </Badge>
                            {log.marketplace && (
                              <span className="text-xs text-gray-400">{log.marketplace}</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {log.orderId ? `Orden ${log.orderId}` : ''}
                            {log.orderId && log.productSku ? ' · ' : ''}
                            {log.productSku ? `SKU ${log.productSku}` : ''}
                            {!log.orderId && !log.productSku && log.service ? log.service : ''}
                          </p>
                        </div>
                      </div>
                      <p className="whitespace-nowrap text-xs text-gray-400">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('es-CL') : 'Sin fecha'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Panel derecho: canales + incidentes agrupados */}
        <div className="space-y-6">
          <Card
            header={
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Canales</p>
                <h2 className="mt-1 text-lg font-semibold text-gray-950">Marketplaces activos</h2>
              </div>
            }
          >
            <div className="flex flex-wrap gap-2">
              {(catalog.marketplaces || []).length === 0 ? (
                <p className="text-sm text-gray-500">Sin canales.</p>
              ) : (
                (catalog.marketplaces || []).map((marketplace) => (
                  <span
                    key={marketplace}
                    className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium capitalize text-blue-700"
                  >
                    {marketplace}
                  </span>
                ))
              )}
            </div>
          </Card>

          {/* Incidentes agrupados */}
          {groupedIncidents.length > 0 && (
            <Card
              header={
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Incidentes</p>
                    <h2 className="mt-1 text-lg font-semibold text-gray-950">Errores activos</h2>
                  </div>
                  <Badge variant="error" size="sm">{uniqueIncidentCount}</Badge>
                </div>
              }
            >
              <div className="space-y-3">
                {groupedIncidents.slice(0, 5).map((group, i) => {
                  const log = group.latest;
                  const errStr = typeof log.errors === 'string'
                    ? log.errors.includes('timeout') ? 'Timeout de API'
                    : log.errors.includes('500') ? 'Error 500'
                    : log.errors.includes('available_quantity') ? 'Multi-warehouse'
                    : log.errors.substring(0, 60)
                    : 'Error';

                  return (
                    <div key={i} className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {actionLabel(log.action)}
                            </p>
                            {log.marketplace && (
                              <span className="text-xs text-gray-500">{log.marketplace}</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-red-700">{errStr}</p>
                        </div>
                        {group.count > 1 && (
                          <span className="shrink-0 rounded-full bg-red-200 px-2 py-0.5 text-xs font-bold text-red-800">
                            x{group.count}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {groupedIncidents.length > 5 && (
                  <p className="text-center text-xs text-gray-400">
                    +{groupedIncidents.length - 5} mas — ver Historial
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
