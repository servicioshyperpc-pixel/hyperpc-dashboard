import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../core/components/Card';
import { Badge } from '../../core/components/Badge';
import axiosInstance from '../../api/axiosInstance';
import { BellRing, Boxes, CircleAlert, Package, RefreshCw, ScrollText } from 'lucide-react';

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
}

const ERROR_STATUSES = new Set(['error', 'warning', 'partial']);
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const DashboardView: React.FC = () => {
  const [catalog, setCatalog] = useState<CatalogResponse>({ total: 0, marketplaces: [] });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [catalogResponse, logsResponse] = await Promise.all([
          axiosInstance.get<CatalogResponse>('/catalog/products?limit=1'),
          axiosInstance.get<LogEntry[]>('/logs'),
        ]);

        if (!mounted) return;

        setCatalog({
          total: catalogResponse.data?.total || 0,
          marketplaces: catalogResponse.data?.marketplaces || [],
        });
        setLogs(Array.isArray(logsResponse.data) ? logsResponse.data : []);
      } catch {
        if (!mounted) return;
        setCatalog({ total: 0, marketplaces: [] });
        setLogs([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
  }, []);

  const recentLogs = useMemo(
    () => [...logs].sort((a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0)).slice(0, 6),
    [logs],
  );

  const recentIncidentCount = useMemo(() => {
    const now = Date.now();
    return logs.filter((log) => {
      if (!log.status || !ERROR_STATUSES.has(log.status)) return false;
      if (!log.createdAt) return true;
      return now - new Date(log.createdAt).getTime() <= SEVEN_DAYS_MS;
    }).length;
  }, [logs]);

  const cards = [
    { label: 'Productos catálogo Odoo', value: catalog.total, helper: '', icon: Package },
    { label: 'Canales configurados', value: catalog.marketplaces?.length || 0, helper: '', icon: Boxes },
    { label: 'Eventos registrados', value: logs.length, helper: '', icon: ScrollText },
    { label: 'Incidentes 7 días', value: recentIncidentCount, helper: '', icon: CircleAlert },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Centro de operación</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">Resumen operativo real</h1>
        </div>
        <button
          onClick={() => window.location.reload()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

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
              <p className="text-2xl font-bold text-gray-950 sm:text-3xl">{card.value}</p>
              {card.helper ? <p className="text-sm text-gray-500">{card.helper}</p> : null}
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card
          header={
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Actividad</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-950">Historial reciente del orquestador</h2>
            </div>
          }
        >
          {recentLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
              <BellRing className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-4 font-medium text-gray-900">Todavía no hay eventos visibles</p>
              <p className="mt-2 text-sm text-gray-500">
                Cuando el backend registre órdenes, sincronizaciones o errores, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log._id || log.id || `${log.service}-${log.action}-${log.createdAt}`} className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-950">{log.action || 'Evento'}</p>
                        <Badge variant={log.status === 'success' ? 'success' : ERROR_STATUSES.has(log.status || '') ? 'error' : 'default'} size="sm">
                          {log.status || 'unknown'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {log.service || 'servicio'}
                        {log.marketplace ? ` · ${log.marketplace}` : ''}
                        {log.orderId ? ` · orden ${log.orderId}` : ''}
                        {log.productSku ? ` · SKU ${log.productSku}` : ''}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('es-CL') : 'Sin fecha'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          header={
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Canales</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-950">Canales disponibles</h2>
            </div>
          }
        >
          <div className="flex flex-wrap gap-2">
            {(catalog.marketplaces || []).length === 0 ? (
              <p className="text-sm text-gray-500">Sin canales.</p>
            ) : (
              (catalog.marketplaces || []).map((marketplace) => (
                <Badge key={marketplace} variant="info">{marketplace}</Badge>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};