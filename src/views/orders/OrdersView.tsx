import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../../core/components/Card';
import { Badge } from '../../core/components/Badge';
import { Table } from '../../core/components/Table';
import axiosInstance from '../../api/axiosInstance';
import {
  Clock3,
  FileWarning,
  RefreshCcw,
  User,
  ShoppingCart,
  PackageCheck,
  XCircle,
  ArrowDownUp,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

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
  request?: any;
  response?: any;
  orders?: any;
  duration?: number;
  metadata?: any;
}

interface OrderRow {
  orderId: string;
  marketplace: string;
  latestAction: string;
  status: string;
  sku: string;
  timestamp: string;
  customerName: string;
  isCancellation: boolean;
  lastError: string;
}

function badgeVariant(status?: string): 'success' | 'error' | 'warning' | 'default' {
  if (status === 'success') return 'success';
  if (status === 'error') return 'error';
  if (status === 'partial' || status === 'warning' || status === 'skipped') return 'warning';
  return 'default';
}

function actionLabel(action?: string): string {
  const map: Record<string, string> = {
    sale_cycle_completed: 'Venta completada',
    cancellation_completed: 'Cancelacion',
    stock_sync_completed: 'Stock sincronizado',
    stock_restore_sync_completed: 'Stock restaurado',
    marketplace_update_completed: 'Marketplace actualizado',
    out_of_stock: 'Sin stock',
  };
  return map[action || ''] || action || 'Evento';
}

function actionIcon(action?: string) {
  if (action?.includes('cancellation')) return XCircle;
  if (action?.includes('stock_sync') || action?.includes('stock_restore')) return ArrowDownUp;
  if (action?.includes('sale_cycle')) return ShoppingCart;
  if (action === 'out_of_stock') return PackageCheck;
  return ShoppingCart;
}

// Extraer nombre del cliente de cualquier marketplace
function extractCustomerName(log: LogEntry): string {
  // Falabella
  const customer = log.orders?.customer;
  if (customer?.CustomerFirstName || customer?.CustomerLastName) {
    return `${customer.CustomerFirstName || ''} ${customer.CustomerLastName || ''}`.trim();
  }
  const order = log.orders?.order;
  if (order?.CustomerFirstName || order?.CustomerLastName) {
    return `${order.CustomerFirstName || ''} ${order.CustomerLastName || ''}`.trim();
  }
  // Ripley (Mirakl)
  const ripleyCustomer = order?.customer;
  if (ripleyCustomer?.firstname || ripleyCustomer?.lastname) {
    return `${ripleyCustomer.firstname || ''} ${ripleyCustomer.lastname || ''}`.trim();
  }
  // MeLi
  const buyer = order?.buyer;
  if (buyer?.first_name || buyer?.last_name) {
    return `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim();
  }
  if (typeof log.orders?.buyer === 'string' && log.orders.buyer.trim()) {
    return log.orders.buyer.trim();
  }
  // Paris
  const parisCustomer = order?.customer || log.request?.customer;
  if (parisCustomer?.firstName || parisCustomer?.lastName) {
    return `${parisCustomer.firstName || ''} ${parisCustomer.lastName || ''}`.trim();
  }
  if (parisCustomer?.name) return parisCustomer.name;
  return '-';
}

function extractLastError(log: LogEntry): string {
  if (!log.errors) return '-';
  if (typeof log.errors === 'string') return log.errors;
  try {
    return JSON.stringify(log.errors);
  } catch {
    return 'Error';
  }
}

function friendlyError(log: LogEntry): string {
  const str = extractLastError(log);
  if (str === '-') return str;
  if (str.includes('timeout')) return `Timeout de ${log.marketplace || 'API'}`;
  if (str.includes('available_quantity')) return 'MeLi multi-warehouse';
  if (str.includes('Insufficient stock')) return 'Sin stock en Odoo';
  if (str.includes('500')) return `Error 500 de ${log.marketplace || 'API'}`;
  if (str.includes('requires_manual_review')) return 'Requiere revision manual';
  if (str.length > 80) return str.substring(0, 77) + '...';
  return str;
}

export function OrdersView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<LogEntry[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterMarketplace, setFilterMarketplace] = useState<string>('all');

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

  const rows = useMemo<OrderRow[]>(() => {
    // Agrupar TODOS los logs por orderId
    const allByOrder = new Map<string, LogEntry[]>();

    logs
      .filter((log) => !!log.orderId)
      .sort((a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0))
      .forEach((log) => {
        if (!log.orderId) return;
        const list = allByOrder.get(log.orderId) || [];
        list.push(log);
        allByOrder.set(log.orderId, list);
      });

    return Array.from(allByOrder.entries())
      .filter(([, orderLogs]) => filterMarketplace === 'all' || orderLogs[0].marketplace === filterMarketplace)
      .map(([orderId, orderLogs]) => {
        const latest = orderLogs[0]; // mas reciente (ya ordenados)

        // Buscar nombre del cliente en CUALQUIER log de esta orden (sale_cycle tiene los datos)
        let customerName = '-';
        for (const log of orderLogs) {
          const name = extractCustomerName(log);
          if (name !== '-') {
            customerName = name;
            break;
          }
        }

        // Buscar SKU en cualquier log
        const sku = orderLogs.find((l) => l.productSku)?.productSku || '-';

        return {
          orderId,
          marketplace: latest.marketplace || latest.service || '-',
          latestAction: latest.action || '-',
          status: latest.status || 'unknown',
          sku,
          timestamp: latest.createdAt ? new Date(latest.createdAt).toLocaleString('es-CL') : 'Sin fecha',
          customerName,
          isCancellation: (latest.action || '').includes('cancellation'),
          lastError: extractLastError(latest),
        };
      });
  }, [logs, filterMarketplace]);

  const marketplaces = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => { if (l.marketplace) set.add(l.marketplace); });
    return Array.from(set).sort();
  }, [logs]);

  useEffect(() => {
    if (!selectedOrderId) return;
    let mounted = true;
    setLoadingDetail(true);
    axiosInstance
      .get<LogEntry[]>(`/logs/order/${selectedOrderId}`)
      .then((response) => {
        if (!mounted) return;
        const data = Array.isArray(response.data) ? response.data : [];
        data.sort((a, b) => +new Date(a.createdAt || 0) - +new Date(b.createdAt || 0));
        setSelectedLogs(data);
      })
      .catch(() => {
        if (mounted) setSelectedLogs([]);
      })
      .finally(() => {
        if (mounted) setLoadingDetail(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedOrderId]);

  const salesCount = rows.filter((r) => !r.isCancellation).length;
  const cancellationCount = rows.filter((r) => r.isCancellation).length;
  const errorCount = rows.filter((r) => r.status === 'error').length;

  const columns = [
    {
      key: 'orderId',
      header: 'Orden',
      render: (row: OrderRow) => (
        <div>
          <span className="font-mono text-sm">{row.orderId}</span>
          {row.isCancellation && (
            <span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
              Cancelada
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Cliente',
      render: (row: OrderRow) => (
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-sm">{row.customerName}</span>
        </div>
      ),
    },
    {
      key: 'marketplace',
      header: 'Canal',
      render: (row: OrderRow) => (
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 capitalize">
          {row.marketplace}
        </span>
      ),
    },
    {
      key: 'latestAction',
      header: 'Ultimo evento',
      render: (row: OrderRow) => <span className="text-sm">{actionLabel(row.latestAction)}</span>,
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (row: OrderRow) => <span className="font-mono text-sm">{row.sku}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: OrderRow) => <Badge variant={badgeVariant(row.status)} size="sm">{row.status}</Badge>,
    },
    {
      key: 'timestamp',
      header: 'Fecha',
      render: (row: OrderRow) => <span className="text-sm text-gray-500">{row.timestamp}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (row: OrderRow) => (
        <button
          type="button"
          onClick={() => setSelectedOrderId(row.orderId)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
        >
          Ver flujo
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">Ordenes</h1>
          <p className="mt-1 text-sm text-gray-500">Seguimiento de ventas y cancelaciones por marketplace</p>
        </div>
        <div className="flex items-center gap-3">
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
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Total ordenes</p>
          <p className="text-2xl font-bold text-gray-950">{rows.length}</p>
        </Card>
        <Card bodyClassName="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Ventas</p>
          <p className="text-2xl font-bold text-green-600">{salesCount}</p>
        </Card>
        <Card bodyClassName="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Cancelaciones</p>
          <p className="text-2xl font-bold text-red-600">{cancellationCount}</p>
        </Card>
        <Card bodyClassName="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Con errores</p>
          <p className="text-2xl font-bold text-amber-600">{errorCount}</p>
        </Card>
      </div>

      {/* Marketplace filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterMarketplace('all')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            filterMarketplace === 'all'
              ? 'bg-gray-900 text-white'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        {marketplaces.map((mp) => (
          <button
            key={mp}
            type="button"
            onClick={() => setFilterMarketplace(mp)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              filterMarketplace === mp
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {mp}
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-400">{rows.length} ordenes</span>
      </div>

      {/* Table */}
      <Card>
        <Table columns={columns} data={rows} emptyMessage="Sin ordenes visibles." />
      </Card>

      {/* Order detail panel */}
      {selectedOrderId && (
        <Card bodyClassName="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">Flujo: {selectedOrderId}</h2>
              <p className="text-sm text-gray-500">Timeline completo de eventos para esta orden</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedOrderId(null)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>

          {loadingDetail ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              Cargando detalle...
            </div>
          ) : selectedLogs.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-8 text-center text-sm text-amber-800">
              No hay eventos persistidos para esta orden.
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Estado final</p>
                  <div className="mt-2">
                    <Badge variant={badgeVariant(selectedLogs[selectedLogs.length - 1]?.status)}>
                      {selectedLogs[selectedLogs.length - 1]?.status || 'unknown'}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Canal</p>
                  <p className="mt-2 text-sm font-medium capitalize text-gray-950">
                    {selectedLogs[0]?.marketplace || selectedLogs[0]?.service || '-'}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Eventos</p>
                  <p className="mt-2 text-sm font-medium text-gray-950">{selectedLogs.length}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Duracion total</p>
                  <p className="mt-2 text-sm font-medium text-gray-950">
                    {selectedLogs.reduce((sum, l) => sum + (l.duration || 0), 0)}ms
                  </p>
                </div>
              </div>

              {/* Stock info if available */}
              {selectedLogs.some((l) => l.response?.stockUpdates || l.response?.odooStock !== undefined || l.metadata?.stockBefore !== undefined) && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="mb-2 text-xs font-medium uppercase text-blue-500">Movimientos de stock</p>
                  <div className="space-y-1">
                    {selectedLogs
                      .filter((l) => l.response?.stockUpdates || l.metadata?.stockBefore !== undefined)
                      .map((l, i) => {
                        const updates = l.response?.stockUpdates || [];
                        const before = l.metadata?.stockBefore;
                        const after = l.metadata?.stockAfter;
                        const published = l.metadata?.stockPublished ?? l.response?.publishedStock;
                        return (
                          <div key={i} className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="font-medium text-blue-900">{actionLabel(l.action)}</span>
                            {updates.map?.((u: any, j: number) => (
                              <span key={j} className="text-blue-800">
                                {u.sku}: {u.previousStock} → {u.newStock}
                              </span>
                            ))}
                            {before !== undefined && after !== undefined && updates.length === 0 && (
                              <span className="text-blue-800">
                                Odoo: {before} → {after}
                                {published !== undefined && ` (marketplace: ${published})`}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Error banner */}
              {selectedLogs.some((l) => l.errors) && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                    <FileWarning className="h-4 w-4" />
                    Errores encontrados
                  </div>
                  {selectedLogs
                    .filter((l) => l.errors)
                    .map((l, i) => (
                      <p key={i} className="mt-2 text-sm text-red-700">
                        <span className="font-medium">{actionLabel(l.action)}:</span>{' '}
                        {friendlyError(l)}
                      </p>
                    ))}
                </div>
              )}

              {/* Timeline */}
              <div className="relative space-y-0">
                {selectedLogs.map((log, index) => {
                  const IconComponent = actionIcon(log.action);
                  const isLast = index === selectedLogs.length - 1;
                  const isError = log.status === 'error';
                  const isWarning = log.status === 'warning' || log.status === 'partial';
                  const isSuccess = log.status === 'success';

                  const dotColor = isError
                    ? 'bg-red-500'
                    : isWarning
                    ? 'bg-amber-500'
                    : isSuccess
                    ? 'bg-green-500'
                    : 'bg-gray-400';

                  return (
                    <div key={log._id || log.id || `${log.action}-${log.createdAt}`} className="relative flex gap-4 pb-6">
                      {/* Timeline line */}
                      {!isLast && (
                        <div className="absolute left-[15px] top-[32px] h-[calc(100%-24px)] w-px bg-gray-200" />
                      )}

                      {/* Timeline dot */}
                      <div className={`relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isError ? 'bg-red-100' : isWarning ? 'bg-amber-100' : isSuccess ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <IconComponent className="h-4 w-4 text-gray-500" />
                              <p className="font-medium text-gray-950">{actionLabel(log.action)}</p>
                              <Badge variant={badgeVariant(log.status)} size="sm">{log.status || 'unknown'}</Badge>
                            </div>

                            {/* Context info */}
                            <div className="mt-2 space-y-1">
                              {log.productSku && (
                                <p className="text-sm text-gray-600">
                                  SKU: <span className="font-mono">{log.productSku}</span>
                                </p>
                              )}

                              {/* Stock changes inline */}
                              {log.response?.stockUpdates?.map?.((u: any, j: number) => (
                                <p key={j} className="text-sm text-gray-600">
                                  Stock {u.sku}: <span className="font-mono">{u.previousStock} → {u.newStock}</span>
                                  {u.quantityReduced && <span className="text-gray-400"> (-{u.quantityReduced})</span>}
                                </p>
                              ))}

                              {/* Odoo IDs */}
                              {(log.response?.saleOrderId || log.response?.partnerId) && (
                                <div className="flex flex-wrap gap-2 text-xs">
                                  {log.response.saleOrderId && (
                                    <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
                                      Odoo Order: {log.response.saleOrderId}
                                    </span>
                                  )}
                                  {log.response.partnerId && (
                                    <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
                                      Partner: {log.response.partnerId}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Sync results */}
                              {log.response?.syncResults && (
                                <div className="flex flex-wrap gap-2 text-xs">
                                  {Object.entries(log.response.syncResults).map(([mp, res]: [string, any]) => (
                                    <span
                                      key={mp}
                                      className={`rounded px-2 py-0.5 ${
                                        res.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                      }`}
                                    >
                                      {res.success ? <CheckCircle2 className="mr-1 inline h-3 w-3" /> : <AlertTriangle className="mr-1 inline h-3 w-3" />}
                                      {mp}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Error */}
                              {log.errors && (
                                <p className="text-sm text-red-600">{friendlyError(log)}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2 text-xs text-gray-400">
                            <Clock3 className="h-3.5 w-3.5" />
                            {log.createdAt ? new Date(log.createdAt).toLocaleString('es-CL') : 'Sin fecha'}
                            {log.duration ? <span className="text-gray-300">({log.duration}ms)</span> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
