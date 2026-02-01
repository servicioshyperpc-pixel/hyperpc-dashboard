// ==========================================
// TIPOS COMUNES - Integraciones
// ==========================================

export interface IProduct {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock?: number;
  status: 'active' | 'inactive' | 'pending';
  imageUrl?: string;
}

export interface IOrder {
  id: string;
  orderId: string;
  marketplace: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  items: IOrderItem[];
  total: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'error';
  createdAt: string;
  updatedAt?: string;
  shippingAddress?: IAddress;
  billingAddress?: IAddress;
}

export interface IOrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
  phone?: string;
}

export interface IInventoryUpdate {
  sku: string;
  quantity: number;
  warehouseId?: string;
}

export interface ISyncResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export interface IMarketplaceConfig {
  name: string;
  key: string;
  apiUrl: string;
  enabled: boolean;
  authType: 'oauth' | 'apikey' | 'signature';
}

export interface ILogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  service: string;
  action: string;
  message: string;
  metadata?: any;
}

// Tipos para el flujo de ventas
export type SaleStep = 
  | 'order_received' 
  | 'odoo_processing' 
  | 'stock_deducted' 
  | 'marketplaces_synced';

export type StepStatus = 'success' | 'error' | 'pending';

export interface ISaleFlow {
  step: SaleStep;
  status: StepStatus;
  timestamp?: string;
  error?: string;
  duration?: number; // en segundos
}

// Tipos para estadísticas del dashboard
export interface IDashboardStats {
  totalSales: number;
  totalAmount: number;
  ordersByMarketplace: Record<string, number>;
  errors: number;
  pendingOrders: number;
  lowStockCount: number;
  lastSync: string;
}

// Tipos para carga masiva
export interface IBulkUploadItem {
  sku: string;
  quantity: number;
  warehouse?: string;
}

export interface IBulkUploadResult {
  total: number;
  processed: number;
  success: number;
  failed: number;
  errors: Array<{
    sku: string;
    error: string;
  }>;
}
