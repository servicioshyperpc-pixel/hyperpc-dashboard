import React from 'react';
import { Card } from '../../core/components/Card.tsx';
import { Badge } from '../../core/components/Badge.tsx';
import { Button } from '../../core/components/Button.tsx';
import { Table } from '../../core/components/Table.tsx';
import type { MockProduct } from '../../data/mock';
import {
  ArrowLeft,
  Package,
  Tag,
  Store,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  RefreshCw,
  Image as ImageIcon,
  BarChart3,
} from 'lucide-react';

interface ProductDetailProps {
  product: MockProduct;
  onBack?: () => void;
  onEdit?: () => void;
  onSync?: () => void;
}

const MARKETPLACE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  falabella: { 
    label: 'Falabella', 
    color: 'bg-green-100 text-green-800',
    icon: <span className="font-bold text-green-600">F</span>
  },
  mercadolibre: { 
    label: 'MercadoLibre', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: <span className="font-bold text-yellow-500">ML</span>
  },
  ripley: { 
    label: 'Ripley', 
    color: 'bg-red-100 text-red-800',
    icon: <span className="font-bold text-red-600">R</span>
  },
  paris: { 
    label: 'Paris', 
    color: 'bg-blue-100 text-blue-800',
    icon: <span className="font-bold text-blue-600">P</span>
  },
  walmart: { 
    label: 'Walmart', 
    color: 'bg-blue-100 text-blue-900',
    icon: <span className="font-bold text-blue-800">W</span>
  },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'error' | 'warning' | 'default' }> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'default' },
  pending: { label: 'Pendiente', variant: 'warning' },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onBack,
  onEdit,
  onSync,
}) => {
  const isLowStock = product.stock <= product.minStock;
  const status = STATUS_CONFIG[product.status];

  const stockColumns = [
    {
      key: 'warehouse',
      header: 'Bodega',
      render: () => (
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">CD Principal</span>
        </div>
      ),
    },
    {
      key: 'available',
      header: 'Disponible',
      align: 'center' as const,
      render: () => (
        <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
          {product.stock}
        </span>
      ),
    },
    {
      key: 'min',
      header: 'Mínimo',
      align: 'center' as const,
      render: () => (
        <span className="text-sm text-gray-500">{product.minStock}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center' as const,
      render: () => (
        <div className="flex items-center justify-center gap-1">
          {isLowStock ? (
            <>
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600">Stock bajo</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600">OK</span>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle del Producto</h1>
            <p className="text-gray-600">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onEdit && (
            <Button variant="secondary" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
          {onSync && (
            <Button onClick={onSync}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronizar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Image & Basic Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <ImageIcon className="w-24 h-24 text-gray-300" />
              )}
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">{product.name}</h2>
              <p className="text-sm text-gray-500">{product.category}</p>
              <div className="pt-2">
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>
          </Card>

          {/* Pricing Card */}
          <Card header={<h3 className="font-semibold text-gray-900 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Precios</h3>}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Precio venta</span>
                <span className="text-lg font-semibold text-gray-900">{formatCurrency(product.price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Costo</span>
                <span className="text-gray-900">{formatCurrency(product.cost)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-gray-600">Margen</span>
                <span className="font-medium text-green-600">
                  {((product.price - product.cost) / product.price * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Stock & Marketplaces */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stock Info */}
          <Card 
            header={
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <h3 className="font-semibold text-gray-900">Inventario</h3>
              </div>
            }
          >
            {isLowStock && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-700">Stock por debajo del mínimo ({product.minStock})</span>
              </div>
            )}
            <Table
              columns={stockColumns}
              data={[product]}
              emptyMessage="No hay información de stock"
            />
          </Card>

          {/* Marketplaces */}
          <Card
            header={
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                <h3 className="font-semibold text-gray-900">Marketplaces ({product.marketplaces.length})</h3>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.marketplaces.map((mp) => {
                const config = MARKETPLACE_CONFIG[mp];
                return (
                  <div key={mp} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-white rounded shadow-sm flex items-center justify-center">
                      {config?.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{config?.label || mp}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Sync: hace 2 horas</span>
                      </div>
                    </div>
                    <Badge variant="success" className="text-xs">Activo</Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Description */}
          <Card
            header={
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <h3 className="font-semibold text-gray-900">Descripción</h3>
              </div>
            }
          >
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
