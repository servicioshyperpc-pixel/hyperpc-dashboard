import type { IProduct, IOrder } from '../common/types';

export interface ParisProduct {
  id: string;
  reference: string;
  designation: string;
  sale_price: number;
  stock: number;
  active: boolean;
}

export interface ParisOrder {
  id: string;
  reference: string;
  client_name: string;
  client_email?: string;
  total: number;
  state: string;
  date_order: string;
  lines: Array<{
    product_ref: string;
    product_name: string;
    qty: number;
    unit_price: number;
  }>;
}

export function adaptProduct(parisProduct: ParisProduct): IProduct {
  return {
    id: parisProduct.id,
    sku: parisProduct.reference,
    name: parisProduct.designation,
    price: parisProduct.sale_price,
    stock: parisProduct.stock,
    status: parisProduct.active ? 'active' : 'inactive',
  };
}

export function adaptOrder(parisOrder: ParisOrder): IOrder {
  return {
    id: parisOrder.id,
    orderId: parisOrder.reference,
    marketplace: 'paris',
    customer: {
      name: parisOrder.client_name,
      email: parisOrder.client_email,
    },
    items: parisOrder.lines.map(line => ({
      sku: line.product_ref,
      name: line.product_name,
      quantity: line.qty,
      price: line.unit_price,
      total: line.qty * line.unit_price,
    })),
    total: parisOrder.total,
    currency: 'CLP',
    status: mapStatus(parisOrder.state),
    createdAt: parisOrder.date_order,
  };
}

function mapStatus(parisState: string): IOrder['status'] {
  const statusMap: Record<string, IOrder['status']> = {
    'draft': 'pending',
    'confirmed': 'processing',
    'done': 'completed',
    'cancel': 'cancelled',
  };
  return statusMap[parisState] || 'pending';
}
