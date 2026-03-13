import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../../core/components/Card';
import { Badge } from '../../core/components/Badge';
import { Table } from '../../core/components/Table';
import axiosInstance from '../../api/axiosInstance';
import { Clock3, FileWarning, Package2, RefreshCcw } from 'lucide-react';

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
}

interface OrderRow {
  orderId: string;
  marketplace: string;
  latestAction: string;
  status: string;
  sku: string;
  timestamp: string;
  customerName: string;
  orderNumber: string;
  lastError: string;
}

function formatStatus(status?: string) {
  if (!status) return 'unknown';
  return status;
}

function badgeVariant(status?: string): 'success' | 'error' | 'warning' | 'default' {
  if (status === 'success') return 'success';
  if (status === 'error') return 'error';
  if (status === 'partial' || status === 'warning') return 'warning';
  return 'default';
}

function extractCustomerName(log: LogEntry): string {
  const customer = log.orders?.customer;
  if (customer?.CustomerFirstName || customer?.CustomerLastName) {
    return `${customer.CustomerFirstName || ''} ${customer.CustomerLastName || ''}`.trim();
  }
  const order = log.orders?.order;
  if (order?.CustomerFirstName || order?.CustomerLastName) {
    return `${order.CustomerFirstName || ''} ${order.CustomerLastName || ''}`.trim();
  }
  const buyer = log.orders?.buyer;
  if (typeof buyer === 'string' && buyer.trim()) return buyer.trim();
  const customerObj = order?.customer || log.request?.customer;
  if (customerObj?.name) return customerObj.name;
  return '-';
}

function extractOrderNumber(log: LogEntry): string {
  return (
    log.request?.rawOrder?.SuccessResponse?.Body?.Orders?.Order?.OrderNumber ||
    log.orders?.order?.OrderNumber ||
    log.request?.rawOrder?.order_number ||
    '-'
  );
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

export function OrdersView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<LogEntry[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    const latestByOrder = new Map<string, LogEntry>();

    logs
      .filter((log) => !!log.orderId)
      .sort((a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0))
      .forEach((log) => {
        if (!log.orderId || latestByOrder.has(log.orderId)) return;
        latestByOrder.set(log.orderId, log);
      });

    return Array.from(latestByOrder.values()).map((log) => ({
      orderId: log.orderId || '-',
      marketplace: log.marketplace || log.service || '-',
      latestAction: log.action || '-',
      status: formatStatus(log.status),
      sku: log.productSku || '-',
      timestamp: log.createdAt ? new Date(log.createdAt).toLocaleString('es-CL') : 'Sin fecha',
      customerName: extractCustomerName(log),
      orderNumber: extractOrderNumber(log),
      lastError: extractLastError(log),
    }));
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

  const columns = [
    { key: 'orderId', header: 'Orden', render: (row: OrderRow) => <span className="font-mono text-sm">{row.orderId}</span> },
    { key: 'orderNumber', header: 'N° comercial', render: (row: OrderRow) => <span className="font-mono text-sm">{row.orderNumber}</span> },
    { key: 'customerName', header: 'Cliente', render: (row: OrderRow) => row.customerName },
    { key: 'marketplace', header: 'Canal', render: (row: OrderRow) => row.marketplace },
    { key: 'latestAction', header: 'Último evento', render: (row: OrderRow) => row.latestAction },
    { key: 'sku', header: 'SKU', render: (row: OrderRow) => <span className="font-mono text-sm">{row.sku}</span> },
    {
      key: 'status',
      header: 'Estado',
      render: (row: OrderRow) => <Badge variant={badgeVariant(row.status)}>{row.status}</Badge>,
    },
    { key: 'timestamp', header: 'Fecha', render: (row: OrderRow) => row.timestamp },
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

  const selectedSummary = selectedLogs[selectedLogs.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Órdenes</h1>
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
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
            <Package2 className="h-4 w-4" />
            {rows.length} órdenes visibles
          </div>
        </div>
      </div>

      <Card>
        <Table columns={columns} data={rows} emptyMessage="Sin órdenes visibles." />
      </Card>

      {selectedOrderId ? (
        <Card bodyClassName="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">Flujo de la orden {selectedOrderId}</h2>
              <p className="text-sm text-gray-500">Eventos reales guardados en Mongo para esta orden.</p>
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
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-500">Cargando detalle…</div>
          ) : selectedLogs.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-8 text-sm text-amber-800">No hay eventos persistidos para esta orden.</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Último estado</p>
                  <div className="mt-2"><Badge variant={badgeVariant(selectedSummary?.status)}>{selectedSummary?.status || 'unknown'}</Badge></div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Último evento</p>
                  <p className="mt-2 text-sm font-medium text-gray-950">{selectedSummary?.action || '-'}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Canal</p>
                  <p className="mt-2 text-sm font-medium text-gray-950">{selectedSummary?.marketplace || selectedSummary?.service || '-'}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Duración</p>
                  <p className="mt-2 text-sm font-medium text-gray-950">{selectedSummary?.duration ? `${selectedSummary.duration} ms` : '-'}</p>
                </div>
              </div>

              {selectedSummary?.errors ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <div className="flex items-center gap-2 font-medium"><FileWarning className="h-4 w-4" /> Error final</div>
                  <p className="mt-2 break-words">{extractLastError(selectedSummary)}</p>
                </div>
              ) : null}

              <div className="space-y-3">
                {selectedLogs.map((log) => (
                  <div key={log._id || log.id || `${log.action}-${log.createdAt}`} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-gray-950">{log.action || 'Evento'}</p>
                          <Badge variant={badgeVariant(log.status)}>{log.status || 'unknown'}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {log.marketplace || log.service || '-'}
                          {log.productSku ? ` · SKU ${log.productSku}` : ''}
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                        <Clock3 className="h-4 w-4" />
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('es-CL') : 'Sin fecha'}
                      </div>
                    </div>
                    {log.errors ? <p className="mt-3 text-sm text-red-700">{extractLastError(log)}</p> : null}
                    {log.response?.saleOrderId || log.response?.partnerId ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                        {log.response?.saleOrderId ? <span className="rounded-full bg-gray-100 px-3 py-1">saleOrderId: {log.response.saleOrderId}</span> : null}
                        {log.response?.partnerId ? <span className="rounded-full bg-gray-100 px-3 py-1">partnerId: {log.response.partnerId}</span> : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      ) : null}
    </div>
  );
}
