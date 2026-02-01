// ==========================================
// MOCK DATA - Dashboard HyperPC
// ==========================================

// Tipos de datos
export interface MockSale {
  id: string;
  timestamp: string;
  marketplace: 'falabella' | 'mercadolibre' | 'ripley' | 'paris' | 'walmart';
  orderId: string;
  customer: string;
  product: string;
  sku: string;
  amount: number;
  currency: string;
  status: 'completed' | 'processing' | 'error' | 'pending';
  flow: {
    step: 'order_received' | 'odoo_processing' | 'stock_deducted' | 'marketplaces_synced';
    status: 'success' | 'error' | 'pending';
    time?: string;
    error?: string;
  }[];
}

export interface MockProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  marketplaces: string[];
  imageUrl?: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface MockLog {
  id: string;
  timestamp: string;
  service: string;
  action: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

// ==========================================
// VENTAS MOCK
// ==========================================
export const mockSales: MockSale[] = [
  {
    id: "sale-001",
    timestamp: "2026-01-27T10:30:00Z",
    marketplace: "falabella",
    orderId: "1140958954",
    customer: "Yarela Carrera",
    product: "PC Gamer HyperPC Pro",
    sku: "ZOR553",
    amount: 843980,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: "10:30:00" },
      { step: "odoo_processing", status: "success", time: "10:31:15" },
      { step: "stock_deducted", status: "success", time: "10:32:00" },
      { step: "marketplaces_synced", status: "success", time: "10:33:00" }
    ]
  },
  {
    id: "sale-002",
    timestamp: "2026-01-27T11:15:00Z",
    marketplace: "mercadolibre",
    orderId: "2000003508419013",
    customer: "Juan Pérez",
    product: "Notebook Gaming RTX 4060",
    sku: "ZOR554",
    amount: 599990,
    currency: "CLP",
    status: "error",
    flow: [
      { step: "order_received", status: "success", time: "11:15:00" },
      { step: "odoo_processing", status: "success", time: "11:16:30" },
      { step: "stock_deducted", status: "error", time: "11:17:00", error: "Error conexión API Falabella" },
      { step: "marketplaces_synced", status: "pending" }
    ]
  },
  {
    id: "sale-003",
    timestamp: "2026-01-27T14:22:00Z",
    marketplace: "ripley",
    orderId: "ORD-78321",
    customer: "María González",
    product: "Monitor 27\" 165Hz",
    sku: "MON-001",
    amount: 249990,
    currency: "CLP",
    status: "processing",
    flow: [
      { step: "order_received", status: "success", time: "14:22:00" },
      { step: "odoo_processing", status: "success", time: "14:23:45" },
      { step: "stock_deducted", status: "pending" },
      { step: "marketplaces_synced", status: "pending" }
    ]
  },
  {
    id: "sale-004",
    timestamp: "2026-01-27T16:45:00Z",
    marketplace: "paris",
    orderId: "PAR-99234",
    customer: "Carlos Martínez",
    product: "Teclado Mecánico RGB",
    sku: "TEC-045",
    amount: 89990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: "16:45:00" },
      { step: "odoo_processing", status: "success", time: "16:46:20" },
      { step: "stock_deducted", status: "success", time: "16:47:00" },
      { step: "marketplaces_synced", status: "success", time: "16:48:30" }
    ]
  },
  {
    id: "sale-005",
    timestamp: "2026-01-27T09:10:00Z",
    marketplace: "walmart",
    orderId: "WM-45621",
    customer: "Ana Silva",
    product: "Mouse Gamer Logitech",
    sku: "MOU-123",
    amount: 45990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: "09:10:00" },
      { step: "odoo_processing", status: "success", time: "09:11:30" },
      { step: "stock_deducted", status: "success", time: "09:12:00" },
      { step: "marketplaces_synced", status: "success", time: "09:13:15" }
    ]
  }
];

// ==========================================
// PRODUCTOS MOCK
// ==========================================
export const mockProducts: MockProduct[] = [
  {
    id: "prod-001",
    sku: "ZOR553",
    name: "PC Gamer HyperPC Pro",
    description: "PC con RTX 4070, 32GB RAM, Intel i9-13900K, SSD 1TB NVMe",
    category: "Computadores",
    price: 843980,
    cost: 750000,
    stock: 15,
    minStock: 5,
    marketplaces: ["falabella", "mercadolibre", "ripley"],
    imageUrl: undefined,
    status: "active"
  },
  {
    id: "prod-002",
    sku: "ZOR554",
    name: "Notebook Gaming RTX 4060",
    description: "Laptop gamer con RTX 4060, 16GB RAM, Intel i7-13700H",
    category: "Notebooks",
    price: 599990,
    cost: 520000,
    stock: 8,
    minStock: 3,
    marketplaces: ["falabella", "mercadolibre", "paris", "walmart"],
    imageUrl: undefined,
    status: "active"
  },
  {
    id: "prod-003",
    sku: "MON-001",
    name: "Monitor 27\" 165Hz Gaming",
    description: "Monitor IPS 27 pulgadas, 165Hz, 1ms, QHD 2560x1440",
    category: "Monitores",
    price: 249990,
    cost: 195000,
    stock: 3,
    minStock: 5,
    marketplaces: ["ripley", "falabella", "mercadolibre"],
    imageUrl: undefined,
    status: "active"
  },
  {
    id: "prod-004",
    sku: "TEC-045",
    name: "Teclado Mecánico RGB HyperPC",
    description: "Teclado mecánico switches Red, RGB, layout español",
    category: "Periféricos",
    price: 89990,
    cost: 65000,
    stock: 25,
    minStock: 10,
    marketplaces: ["falabella", "paris", "walmart"],
    imageUrl: undefined,
    status: "active"
  },
  {
    id: "prod-005",
    sku: "MOU-123",
    name: "Mouse Gamer Logitech G502",
    description: "Mouse gaming 25K DPI, 11 botones programables, RGB",
    category: "Periféricos",
    price: 45990,
    cost: 35000,
    stock: 42,
    minStock: 15,
    marketplaces: ["walmart", "mercadolibre", "ripley"],
    imageUrl: undefined,
    status: "active"
  }
];

// ==========================================
// LOGS MOCK
// ==========================================
export const mockLogs: MockLog[] = [
  {
    id: "log-001",
    timestamp: "2026-01-27T10:33:00Z",
    service: "sync-service",
    action: "STOCK_SYNC",
    status: "success",
    message: "Stock sincronizado en 3 marketplaces (Falabella, ML, Ripley)"
  },
  {
    id: "log-002",
    timestamp: "2026-01-27T11:17:00Z",
    service: "falabella",
    action: "STOCK_UPDATE",
    status: "error",
    message: "Error de conexión API - Order #2000003508419013",
    details: { error: "401 Unauthorized", retry: true }
  },
  {
    id: "log-003",
    timestamp: "2026-01-27T14:25:00Z",
    service: "odoo",
    action: "SALE_CONFIRM",
    status: "success",
    message: "Orden de venta confirmada en Odoo - Order #ORD-78321"
  },
  {
    id: "log-004",
    timestamp: "2026-01-27T16:50:00Z",
    service: "stock-orchestrator",
    action: "INVENTORY_DEDUCT",
    status: "success",
    message: "Stock rebajado: TEC-045 (Cantidad: 1)"
  },
  {
    id: "log-005",
    timestamp: "2026-01-27T09:15:00Z",
    service: "walmart",
    action: "ORDER_SYNC",
    status: "success",
    message: "Orden sincronizada correctamente - WM-45621"
  }
];

// ==========================================
// UTILIDADES
// ==========================================
export const getSalesByStatus = (status: MockSale['status']) => {
  return mockSales.filter(sale => sale.status === status);
};

export const getSalesByMarketplace = (marketplace: MockSale['marketplace']) => {
  return mockSales.filter(sale => sale.marketplace === marketplace);
};

export const getTodaySales = () => {
  const today = new Date().toISOString().split('T')[0];
  return mockSales.filter(sale => sale.timestamp.startsWith(today));
};

export const getLowStockProducts = () => {
  return mockProducts.filter(prod => prod.stock <= prod.minStock);
};
