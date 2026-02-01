import type { IProduct, IOrder } from '../common/types';

export interface OdooProduct {
  id: number;
  default_code: string;
  name: string;
  list_price: number;
  qty_available: number;
}

export interface OdooOrder {
  id: number;
  name: string;
  partner_id: [number, string];
  amount_total: number;
  state: string;
  order_line: Array<{
    product_id: [number, string];
    product_uom_qty: number;
    price_unit: number;
  }>;
}

export function adaptProduct(odooProduct: OdooProduct): IProduct {
  return {
    id: String(odooProduct.id),
    sku: odooProduct.default_code,
    name: odooProduct.name,
    price: odooProduct.list_price,
    stock: odooProduct.qty_available,
    status: 'active',
  };
}

export function adaptOrder(odooOrder: OdooOrder): IOrder {
  return {
    id: String(odooOrder.id),
    orderId: odooOrder.name,
    marketplace: 'odoo',
    customer: {
      name: odooOrder.partner_id[1],
    },
    items: odooOrder.order_line.map(line => ({
      sku: String(line.product_id[0]),
      name: line.product_id[1],
      quantity: line.product_uom_qty,
      price: line.price_unit,
      total: line.product_uom_qty * line.price_unit,
    })),
    total: odooOrder.amount_total,
    currency: 'CLP',
    status: mapStatus(odooOrder.state),
    createdAt: new Date().toISOString(),
  };
}

function mapStatus(odooState: string): IOrder['status'] {
  const statusMap: Record<string, IOrder['status']> = {
    'draft': 'pending',
    'sent': 'processing',
    'sale': 'completed',
    'done': 'completed',
    'cancel': 'cancelled',
  };
  return statusMap[odooState] || 'pending';
}
