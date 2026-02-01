import React from 'react';
import { Card } from '../../../core/components/Card.tsx';
import { Badge } from '../../../core/components/Badge.tsx';
import { RefreshCw, CheckCircle, XCircle, Store, ArrowUpRight } from 'lucide-react';

interface MarketCardProps {
  marketplace: string;
  name: string;
  salesCount: number;
  syncStatus: 'synced' | 'pending' | 'error';
  lastSync?: string;
  icon?: React.ReactNode;
  onSync?: () => void;
}

const MARKETPLACE_ICONS: Record<string, React.ReactNode> = {
  falabella: <span className="font-bold text-green-600 text-lg">F</span>,
  mercadolibre: <span className="font-bold text-yellow-500 text-lg">ML</span>,
  ripley: <span className="font-bold text-red-600 text-lg">R</span>,
  paris: <span className="font-bold text-blue-600 text-lg">P</span>,
  walmart: <span className="font-bold text-blue-800 text-lg">W</span>,
};

const STATUS_CONFIG = {
  synced: {
    icon: <CheckCircle className="w-4 h-4 text-green-600" />,
    badge: <Badge variant="success">Sincronizado</Badge>,
    bgColor: 'bg-green-50',
  },
  pending: {
    icon: <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />,
    badge: <Badge variant="warning">Pendiente</Badge>,
    bgColor: 'bg-yellow-50',
  },
  error: {
    icon: <XCircle className="w-4 h-4 text-red-600" />,
    badge: <Badge variant="error">Error</Badge>,
    bgColor: 'bg-red-50',
  },
};

export const MarketCard: React.FC<MarketCardProps> = ({
  marketplace,
  name,
  salesCount,
  syncStatus,
  lastSync,
  icon,
  onSync,
}) => {
  const status = STATUS_CONFIG[syncStatus];
  const marketIcon = icon || MARKETPLACE_ICONS[marketplace] || <Store className="w-6 h-6 text-gray-600" />;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              {marketIcon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{name}</h3>
              <p className="text-sm text-gray-500 capitalize">{marketplace}</p>
            </div>
          </div>
          <div className={status.bgColor + ' p-2 rounded-lg'}>
            {status.icon}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Ventas hoy</p>
            <p className="text-2xl font-bold text-gray-900">{salesCount}</p>
          </div>
          <div className="text-right">
            {status.badge}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {lastSync ? `Última sync: ${new Date(lastSync).toLocaleTimeString('es-CL')}` : 'Sin sincronizar'}
          </p>
          {onSync && (
            <button
              onClick={onSync}
              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              Sincronizar
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MarketCard;
