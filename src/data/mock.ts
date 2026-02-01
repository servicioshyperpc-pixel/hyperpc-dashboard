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
// HELPER - Generar fecha relativa
// ==========================================
const getRelativeDate = (daysAgo: number, hour: number, minute: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

const formatTime = (hour: number, minute: number): string => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
};

// ==========================================
// VENTAS MOCK - Últimos 7 días
// ==========================================
export const mockSales: MockSale[] = [
  // === HOY (día 0) ===
  {
    id: "sale-001",
    timestamp: getRelativeDate(0, 10, 30),
    marketplace: "falabella",
    orderId: "1140958954",
    customer: "Yarela Carrera",
    product: "PC Gamer HyperPC Pro",
    sku: "ZOR553",
    amount: 843980,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(10, 30) },
      { step: "odoo_processing", status: "success", time: formatTime(10, 31) },
      { step: "stock_deducted", status: "success", time: formatTime(10, 32) },
      { step: "marketplaces_synced", status: "success", time: formatTime(10, 33) }
    ]
  },
  {
    id: "sale-002",
    timestamp: getRelativeDate(0, 11, 15),
    marketplace: "mercadolibre",
    orderId: "2000003508419013",
    customer: "Juan Pérez",
    product: "Notebook Gaming RTX 4060",
    sku: "ZOR554",
    amount: 599990,
    currency: "CLP",
    status: "error",
    flow: [
      { step: "order_received", status: "success", time: formatTime(11, 15) },
      { step: "odoo_processing", status: "success", time: formatTime(11, 16) },
      { step: "stock_deducted", status: "error", time: formatTime(11, 17), error: "Error conexión API Falabella" },
      { step: "marketplaces_synced", status: "pending" }
    ]
  },
  {
    id: "sale-003",
    timestamp: getRelativeDate(0, 14, 22),
    marketplace: "ripley",
    orderId: "ORD-78321",
    customer: "María González",
    product: "Monitor 27\" 165Hz",
    sku: "MON-001",
    amount: 249990,
    currency: "CLP",
    status: "processing",
    flow: [
      { step: "order_received", status: "success", time: formatTime(14, 22) },
      { step: "odoo_processing", status: "success", time: formatTime(14, 23) },
      { step: "stock_deducted", status: "pending" },
      { step: "marketplaces_synced", status: "pending" }
    ]
  },
  {
    id: "sale-004",
    timestamp: getRelativeDate(0, 16, 45),
    marketplace: "paris",
    orderId: "PAR-99234",
    customer: "Carlos Martínez",
    product: "Teclado Mecánico RGB",
    sku: "TEC-045",
    amount: 89990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(16, 45) },
      { step: "odoo_processing", status: "success", time: formatTime(16, 46) },
      { step: "stock_deducted", status: "success", time: formatTime(16, 47) },
      { step: "marketplaces_synced", status: "success", time: formatTime(16, 48) }
    ]
  },
  {
    id: "sale-005",
    timestamp: getRelativeDate(0, 9, 10),
    marketplace: "walmart",
    orderId: "WM-45621",
    customer: "Ana Silva",
    product: "Mouse Gamer Logitech",
    sku: "MOU-123",
    amount: 45990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(9, 10) },
      { step: "odoo_processing", status: "success", time: formatTime(9, 11) },
      { step: "stock_deducted", status: "success", time: formatTime(9, 12) },
      { step: "marketplaces_synced", status: "success", time: formatTime(9, 13) }
    ]
  },

  // === AYER (día 1) ===
  {
    id: "sale-006",
    timestamp: getRelativeDate(1, 9, 45),
    marketplace: "mercadolibre",
    orderId: "ML-99887766",
    customer: "Roberto Soto",
    product: "PC Gamer HyperPC Pro",
    sku: "ZOR553",
    amount: 843980,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(9, 45) },
      { step: "odoo_processing", status: "success", time: formatTime(9, 46) },
      { step: "stock_deducted", status: "success", time: formatTime(9, 47) },
      { step: "marketplaces_synced", status: "success", time: formatTime(9, 48) }
    ]
  },
  {
    id: "sale-007",
    timestamp: getRelativeDate(1, 12, 30),
    marketplace: "falabella",
    orderId: "FAL-112233",
    customer: "Lucía Fernández",
    product: "Monitor 27\" 165Hz",
    sku: "MON-001",
    amount: 249990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(12, 30) },
      { step: "odoo_processing", status: "success", time: formatTime(12, 31) },
      { step: "stock_deducted", status: "success", time: formatTime(12, 32) },
      { step: "marketplaces_synced", status: "success", time: formatTime(12, 33) }
    ]
  },
  {
    id: "sale-008",
    timestamp: getRelativeDate(1, 15, 20),
    marketplace: "paris",
    orderId: "PAR-556677",
    customer: "Diego Muñoz",
    product: "Teclado Mecánico RGB",
    sku: "TEC-045",
    amount: 89990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(15, 20) },
      { step: "odoo_processing", status: "success", time: formatTime(15, 21) },
      { step: "stock_deducted", status: "success", time: formatTime(15, 22) },
      { step: "marketplaces_synced", status: "success", time: formatTime(15, 23) }
    ]
  },

  // === HACE 2 DÍAS ===
  {
    id: "sale-009",
    timestamp: getRelativeDate(2, 10, 0),
    marketplace: "walmart",
    orderId: "WM-778899",
    customer: "Patricia Vega",
    product: "Mouse Gamer Logitech",
    sku: "MOU-123",
    amount: 45990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(10, 0) },
      { step: "odoo_processing", status: "success", time: formatTime(10, 1) },
      { step: "stock_deducted", status: "success", time: formatTime(10, 2) },
      { step: "marketplaces_synced", status: "success", time: formatTime(10, 3) }
    ]
  },
  {
    id: "sale-010",
    timestamp: getRelativeDate(2, 14, 15),
    marketplace: "ripley",
    orderId: "RIP-334455",
    customer: "Fernando Castro",
    product: "Notebook Gaming RTX 4060",
    sku: "ZOR554",
    amount: 599990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(14, 15) },
      { step: "odoo_processing", status: "success", time: formatTime(14, 16) },
      { step: "stock_deducted", status: "success", time: formatTime(14, 17) },
      { step: "marketplaces_synced", status: "success", time: formatTime(14, 18) }
    ]
  },

  // === HACE 3 DÍAS ===
  {
    id: "sale-011",
    timestamp: getRelativeDate(3, 11, 30),
    marketplace: "mercadolibre",
    orderId: "ML-445566",
    customer: "Valentina Ríos",
    product: "PC Gamer HyperPC Pro",
    sku: "ZOR553",
    amount: 843980,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(11, 30) },
      { step: "odoo_processing", status: "success", time: formatTime(11, 31) },
      { step: "stock_deducted", status: "success", time: formatTime(11, 32) },
      { step: "marketplaces_synced", status: "success", time: formatTime(11, 33) }
    ]
  },
  {
    id: "sale-012",
    timestamp: getRelativeDate(3, 16, 0),
    marketplace: "falabella",
    orderId: "FAL-998877",
    customer: "Andrés López",
    product: "Teclado Mecánico RGB",
    sku: "TEC-045",
    amount: 89990,
    currency: "CLP",
    status: "error",
    flow: [
      { step: "order_received", status: "success", time: formatTime(16, 0) },
      { step: "odoo_processing", status: "success", time: formatTime(16, 1) },
      { step: "stock_deducted", status: "success", time: formatTime(16, 2) },
      { step: "marketplaces_synced", status: "error", time: formatTime(16, 3), error: "Timeout API Ripley" }
    ]
  },

  // === HACE 4 DÍAS ===
  {
    id: "sale-013",
    timestamp: getRelativeDate(4, 9, 0),
    marketplace: "paris",
    orderId: "PAR-112244",
    customer: "Camila Torres",
    product: "Monitor 27\" 165Hz",
    sku: "MON-001",
    amount: 249990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(9, 0) },
      { step: "odoo_processing", status: "success", time: formatTime(9, 1) },
      { step: "stock_deducted", status: "success", time: formatTime(9, 2) },
      { step: "marketplaces_synced", status: "success", time: formatTime(9, 3) }
    ]
  },
  {
    id: "sale-014",
    timestamp: getRelativeDate(4, 13, 45),
    marketplace: "walmart",
    orderId: "WM-667788",
    customer: "Miguel Herrera",
    product: "Mouse Gamer Logitech",
    sku: "MOU-123",
    amount: 45990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(13, 45) },
      { step: "odoo_processing", status: "success", time: formatTime(13, 46) },
      { step: "stock_deducted", status: "success", time: formatTime(13, 47) },
      { step: "marketplaces_synced", status: "success", time: formatTime(13, 48) }
    ]
  },
  {
    id: "sale-015",
    timestamp: getRelativeDate(4, 17, 30),
    marketplace: "mercadolibre",
    orderId: "ML-223344",
    customer: "Sofía Mendoza",
    product: "Notebook Gaming RTX 4060",
    sku: "ZOR554",
    amount: 599990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(17, 30) },
      { step: "odoo_processing", status: "success", time: formatTime(17, 31) },
      { step: "stock_deducted", status: "success", time: formatTime(17, 32) },
      { step: "marketplaces_synced", status: "success", time: formatTime(17, 33) }
    ]
  },

  // === HACE 5 DÍAS ===
  {
    id: "sale-016",
    timestamp: getRelativeDate(5, 10, 15),
    marketplace: "ripley",
    orderId: "RIP-889900",
    customer: "Nicolás Vargas",
    product: "PC Gamer HyperPC Pro",
    sku: "ZOR553",
    amount: 843980,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(10, 15) },
      { step: "odoo_processing", status: "success", time: formatTime(10, 16) },
      { step: "stock_deducted", status: "success", time: formatTime(10, 17) },
      { step: "marketplaces_synced", status: "success", time: formatTime(10, 18) }
    ]
  },
  {
    id: "sale-017",
    timestamp: getRelativeDate(5, 14, 0),
    marketplace: "falabella",
    orderId: "FAL-445566",
    customer: "Isabella Rojas",
    product: "Teclado Mecánico RGB",
    sku: "TEC-045",
    amount: 89990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(14, 0) },
      { step: "odoo_processing", status: "success", time: formatTime(14, 1) },
      { step: "stock_deducted", status: "success", time: formatTime(14, 2) },
      { step: "marketplaces_synced", status: "success", time: formatTime(14, 3) }
    ]
  },

  // === HACE 6 DÍAS ===
  {
    id: "sale-018",
    timestamp: getRelativeDate(6, 11, 0),
    marketplace: "mercadolibre",
    orderId: "ML-778800",
    customer: "Matías Pinto",
    product: "Monitor 27\" 165Hz",
    sku: "MON-001",
    amount: 249990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(11, 0) },
      { step: "odoo_processing", status: "success", time: formatTime(11, 1) },
      { step: "stock_deducted", status: "success", time: formatTime(11, 2) },
      { step: "marketplaces_synced", status: "success", time: formatTime(11, 3) }
    ]
  },
  {
    id: "sale-019",
    timestamp: getRelativeDate(6, 15, 30),
    marketplace: "paris",
    orderId: "PAR-990011",
    customer: "Javiera Sánchez",
    product: "Mouse Gamer Logitech",
    sku: "MOU-123",
    amount: 45990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(15, 30) },
      { step: "odoo_processing", status: "success", time: formatTime(15, 31) },
      { step: "stock_deducted", status: "success", time: formatTime(15, 32) },
      { step: "marketplaces_synced", status: "success", time: formatTime(15, 33) }
    ]
  },
  {
    id: "sale-020",
    timestamp: getRelativeDate(6, 18, 15),
    marketplace: "walmart",
    orderId: "WM-112233",
    customer: "Benjamin Araya",
    product: "Notebook Gaming RTX 4060",
    sku: "ZOR554",
    amount: 599990,
    currency: "CLP",
    status: "completed",
    flow: [
      { step: "order_received", status: "success", time: formatTime(18, 15) },
      { step: "odoo_processing", status: "success", time: formatTime(18, 16) },
      { step: "stock_deducted", status: "success", time: formatTime(18, 17) },
      { step: "marketplaces_synced", status: "success", time: formatTime(18, 18) }
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
    timestamp: getRelativeDate(0, 10, 33),
    service: "sync-service",
    action: "STOCK_SYNC",
    status: "success",
    message: "Stock sincronizado en 3 marketplaces (Falabella, ML, Ripley)"
  },
  {
    id: "log-002",
    timestamp: getRelativeDate(0, 11, 17),
    service: "falabella",
    action: "STOCK_UPDATE",
    status: "error",
    message: "Error de conexión API - Order #2000003508419013",
    details: { error: "401 Unauthorized", retry: true }
  },
  {
    id: "log-003",
    timestamp: getRelativeDate(0, 14, 25),
    service: "odoo",
    action: "SALE_CONFIRM",
    status: "success",
    message: "Orden de venta confirmada en Odoo - Order #ORD-78321"
  },
  {
    id: "log-004",
    timestamp: getRelativeDate(0, 16, 50),
    service: "stock-orchestrator",
    action: "INVENTORY_DEDUCT",
    status: "success",
    message: "Stock rebajado: TEC-045 (Cantidad: 1)"
  },
  {
    id: "log-005",
    timestamp: getRelativeDate(0, 9, 15),
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

export const getSalesByDate = (date: Date): MockSale[] => {
  const dateStr = date.toISOString().split('T')[0];
  return mockSales.filter(sale => sale.timestamp.split('T')[0] === dateStr);
};

export const getTodaySales = () => {
  return getSalesByDate(new Date());
};

export const getLowStockProducts = () => {
  return mockProducts.filter(prod => prod.stock <= prod.minStock);
};
