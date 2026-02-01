import { useState, useMemo } from 'react';
import { Card } from '../../core/components/Card.tsx';
import { Table } from '../../core/components/Table.tsx';
import { Badge } from '../../core/components/Badge.tsx';
import { Input } from '../../core/components/Input.tsx';
import { Button } from '../../core/components/Button.tsx';
import { mockProducts } from '../../data/mock';
import type { MockProduct } from '../../data/mock';
import {
  Search,
  Filter,
  Package,
  Camera,
  AlertTriangle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const MARKETPLACE_CONFIG: Record<string, { label: string; color: string }> = {
  falabella: { label: 'Falabella', color: 'bg-green-100 text-green-800' },
  mercadolibre: { label: 'ML', color: 'bg-yellow-100 text-yellow-800' },
  ripley: { label: 'Ripley', color: 'bg-red-100 text-red-800' },
  paris: { label: 'Paris', color: 'bg-blue-100 text-blue-800' },
  walmart: { label: 'Walmart', color: 'bg-blue-100 text-blue-900' },
};



export const ProductList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesSearch =
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMarketplace =
        selectedMarketplace === 'all' ||
        product.marketplaces.includes(selectedMarketplace);

      return matchesSearch && matchesMarketplace;
    });
  }, [searchQuery, selectedMarketplace]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const columns = [
    {
      key: 'image',
      header: 'Imagen',
      width: '80px',
      render: (product: MockProduct) => (
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (product: MockProduct) => (
        <span className="font-mono text-sm font-medium text-gray-900">{product.sku}</span>
      ),
    },
    {
      key: 'name',
      header: 'Producto',
      render: (product: MockProduct) => (
        <div>
          <p className="font-medium text-gray-900">{product.name}</p>
          <p className="text-sm text-gray-500">{product.category}</p>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'center' as const,
      render: (product: MockProduct) => {
        const isLowStock = product.stock <= product.minStock;
        return (
          <div className="flex items-center justify-center gap-2">
            {isLowStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
            <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
              {product.stock}
            </span>
            <span className="text-xs text-gray-400">/ {product.minStock} min</span>
          </div>
        );
      },
    },
    {
      key: 'marketplaces',
      header: 'Marketplaces',
      render: (product: MockProduct) => (
        <div className="flex flex-wrap gap-1">
          {product.marketplaces.map((mp) => (
            <span
              key={mp}
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${MARKETPLACE_CONFIG[mp]?.color || 'bg-gray-100 text-gray-800'
                }`}
            >
              {MARKETPLACE_CONFIG[mp]?.label || mp}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center' as const,
      render: (product: MockProduct) => {
        const variants: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
          active: 'success',
          inactive: 'default',
          pending: 'warning',
        };
        const labels: Record<string, string> = {
          active: 'Activo',
          inactive: 'Inactivo',
          pending: 'Pendiente',
        };
        return <Badge variant={variants[product.status] || 'default'}>{labels[product.status] || product.status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center' as const,
      render: () => (
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          <Camera className="w-4 h-4" />
          Editar foto
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">Gestiona tus productos y su sincronización</p>
        </div>
        <Button>
          <Package className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters */}
      <Card bodyClassName="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar por SKU o nombre..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedMarketplace}
            onChange={(e) => setSelectedMarketplace(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="all">Todos los marketplaces</option>
            <option value="falabella">Falabella</option>
            <option value="mercadolibre">MercadoLibre</option>
            <option value="ripley">Ripley</option>
            <option value="paris">Paris</option>
            <option value="walmart">Walmart</option>
          </select>
        </div>
      </Card>



      {/* Products Table */}
      <Card>
        <Table
          columns={columns}
          data={paginatedProducts}
          emptyMessage="No se encontraron productos"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de{' '}
              {filteredProducts.length} productos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductList;
