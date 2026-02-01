import React, { useEffect } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { Card } from '../../core/components/Card.tsx';
import { Badge } from '../../core/components/Badge.tsx';
import type { MockSale } from '../../data/mock';
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader,
  ArrowRight,
  Package,
  Store,
  ShoppingBag,
  Zap
} from 'lucide-react';

const MARKETPLACE_ICONS: Record<string, React.ReactNode> = {
  falabella: <span className="font-bold text-green-600">F</span>,
  mercadolibre: <span className="font-bold text-yellow-500">ML</span>,
  ripley: <span className="font-bold text-red-600">R</span>,
  paris: <span className="font-bold text-blue-600">P</span>,
  walmart: <span className="font-bold text-blue-800">W</span>,
};

const MARKETPLACE_NAMES: Record<string, string> = {
  falabella: 'Falabella',
  mercadolibre: 'MercadoLibre',
  ripley: 'Ripley',
  paris: 'Paris',
  walmart: 'Walmart',
};

const STEP_CONFIG = {
  order_received: { icon: ShoppingBag, label: 'Venta' },
  odoo_processing: { icon: Zap, label: 'Odoo' },
  stock_deducted: { icon: Package, label: 'Stock' },
  marketplaces_synced: { icon: Store, label: 'Marketplaces' },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
};

const getStatusBadge = (status: MockSale['status']) => {
  switch (status) {
    case 'completed':
      return <Badge variant="success">Completado</Badge>;
    case 'processing':
      return <Badge variant="info">Procesando</Badge>;
    case 'error':
      return <Badge variant="error">Error</Badge>;
    case 'pending':
      return <Badge variant="warning">Pendiente</Badge>;
    default:
      return <Badge>Desconocido</Badge>;
  }
};

const getStepIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'pending':
      return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />;
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
};

export const DashboardView: React.FC = () => {
  const { sales, stats, isLoading, refreshData, getErrors } = useDashboardStore();
  const errors = getErrors();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Vista general de ventas y sincronización</p>
        </div>
        <button
          onClick={refreshData}
          disabled={isLoading}
          className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card bodyClassName="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Ventas</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
          </div>
        </Card>

        <Card bodyClassName="flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Monto Total</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
          </div>
        </Card>

        <Card bodyClassName="flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Errores</p>
            <p className="text-2xl font-bold text-gray-900">{stats.errors}</p>
          </div>
        </Card>

        <Card bodyClassName="flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
          </div>
        </Card>
      </div>

      {/* Error Alerts */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Alertas de Error ({errors.length})</h3>
          </div>
          <div className="space-y-2">
            {errors.slice(0, 3).map((log) => (
              <div key={log.id} className="flex items-center gap-3 text-sm">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700">{log.message}</span>
                <span className="text-red-400">{new Date(log.timestamp).toLocaleTimeString('es-CL')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales Timeline */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Timeline de Ventas del Día</h2>
            <Badge variant="info">{sales.length} ventas</Badge>
          </div>
        }
      >
        <div className="space-y-6">
          {sales.map((sale) => (
            <div key={sale.id} className="border-l-2 border-gray-200 pl-4 pb-6 last:pb-0">
              {/* Sale Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    {MARKETPLACE_ICONS[sale.marketplace]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sale.customer}</p>
                    <p className="text-sm text-gray-500">{sale.product}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(sale.amount)}</p>
                  <p className="text-sm text-gray-500">{formatTime(sale.timestamp)}</p>
                </div>
              </div>

              {/* Flow Steps */}
              <div className="flex items-center gap-2 mb-3">
                {sale.flow.map((step, index) => {
                  const config = STEP_CONFIG[step.step];
                  const Icon = config.icon;
                  const isLast = index === sale.flow.length - 1;

                  return (
                    <React.Fragment key={step.step}>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md ${step.status === 'success' ? 'bg-green-50' :
                        step.status === 'error' ? 'bg-red-50' :
                          'bg-yellow-50'
                        }`}>
                        <Icon className={`w-4 h-4 ${step.status === 'success' ? 'text-green-600' :
                          step.status === 'error' ? 'text-red-600' :
                            'text-yellow-600'
                          }`} />
                        <span className={`text-xs font-medium ${step.status === 'success' ? 'text-green-700' :
                          step.status === 'error' ? 'text-red-700' :
                            'text-yellow-700'
                          }`}>
                          {config.label}
                        </span>
                        {getStepIcon(step.status)}
                      </div>
                      {!isLast && <ArrowRight className="w-4 h-4 text-gray-400" />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Error Details */}
              {sale.flow.some(step => step.error) && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    {sale.flow.find(step => step.error)?.error}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>Order: {sale.orderId}</span>
                <span>SKU: {sale.sku}</span>
                <span className="ml-auto">{getStatusBadge(sale.status)}</span>
              </div>
            </div>
          ))}

          {sales.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay ventas registradas hoy</p>
            </div>
          )}
        </div>
      </Card>

      {/* Marketplace Stats */}
      <Card header={<h2 className="text-lg font-semibold text-gray-900">Ventas por Marketplace</h2>}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.ordersByMarketplace).map(([marketplace, count]) => (
            <div key={marketplace} className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-white rounded shadow-sm flex items-center justify-center">
                {MARKETPLACE_ICONS[marketplace]}
              </div>
              <p className="text-sm text-gray-600">{MARKETPLACE_NAMES[marketplace]}</p>
              <p className="text-xl font-bold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardView;
