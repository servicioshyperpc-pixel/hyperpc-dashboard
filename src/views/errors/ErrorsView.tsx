import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../../core/components/Card';
import { Badge } from '../../core/components/Badge';
import axiosInstance from '../../api/axiosInstance';
import { AlertTriangle, Clock3, RefreshCcw, ScrollText } from 'lucide-react';

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
}

const INCIDENT_STATUSES = new Set(['error', 'warning', 'partial']);
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function badgeVariant(status?: string): 'success' | 'error' | 'warning' | 'default' {
  if (status === 'error') return 'error';
  if (status === 'partial' || status === 'warning') return 'warning';
  if (status === 'success') return 'success';
  return 'default';
}

function stringifyError(value: any) {
  if (!value) return '-';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return 'Error';
  }
}

export function ErrorsView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
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

  const incidents = useMemo(() => {
    const now = Date.now();
    return [...logs]
      .filter((log) => {
        if (!log.status || !INCIDENT_STATUSES.has(log.status)) return false;
        if (!log.createdAt) return true;
        return now - new Date(log.createdAt).getTime() <= SEVEN_DAYS_MS;
      })
      .sort((a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0));
  }, [logs]);

  const orderIncidents = incidents.filter((log) => !!log.orderId).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">Historial</h1>
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
            <Clock3 className="h-4 w-4" />
            Ventana visible: 7 días
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card bodyClassName="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Incidentes</p>
          <p className="text-2xl font-bold text-gray-950 sm:text-3xl">{incidents.length}</p>
        </Card>
        <Card bodyClassName="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Órdenes afectadas</p>
          <p className="text-2xl font-bold text-gray-950 sm:text-3xl">{orderIncidents}</p>
        </Card>
      </div>

      {incidents.length === 0 ? (
        <Card bodyClassName="py-12 text-center">
          <ScrollText className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-4 font-medium text-gray-900">No hay incidentes visibles ahora mismo</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {incidents.map((log) => (
            <Card key={log._id || log.id || `${log.service}-${log.action}-${log.createdAt}`} bodyClassName="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-xl bg-red-50 p-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-950">{log.action || 'Evento'}</p>
                      <Badge variant={badgeVariant(log.status)}>{log.status || 'unknown'}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {log.service || 'servicio'}
                      {log.marketplace ? ` · ${log.marketplace}` : ''}
                      {log.orderId ? ` · orden ${log.orderId}` : ''}
                      {log.productSku ? ` · SKU ${log.productSku}` : ''}
                    </p>
                    <p className="mt-2 break-words text-sm text-gray-700">{stringifyError(log.errors)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{log.createdAt ? new Date(log.createdAt).toLocaleString('es-CL') : 'Sin fecha'}</p>
              </div>
              {log.response?.saleOrderId || log.response?.partnerId ? (
                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  {log.response?.saleOrderId ? <span className="rounded-full bg-gray-100 px-3 py-1">saleOrderId: {log.response.saleOrderId}</span> : null}
                  {log.response?.partnerId ? <span className="rounded-full bg-gray-100 px-3 py-1">partnerId: {log.response.partnerId}</span> : null}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
