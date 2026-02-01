import type { IProduct, IOrder } from '../common/types';

export interface RipleyProduct {
  product_id: string;
  sku: string;
  name: string;
  price: number;
  stock_quantity: number;
  status: string;
}

export interface RipleyOrder {
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

export function adaptProduct(ripleyProduct: RipleyProduct): IProduct {
  return {
    id: ripleyProduct.product_id,
    sku: ripleyProduct.sku,
    name: ripleyProduct.name,
    price: ripleyProduct.price,
    stock: ripleyProduct.stock_quantity,
    status: ripleyProduct.status === 'active' ? 'active' : 'inactive',
  };
}

export function adaptOrder(ripleyOrder: RipleyOrder): IOrder {
  return {
    id: ripleyOrder.order_id,
    orderId: ripleyOrder.order_number,
    marketplace: 'ripley',
    customer: {
      name: ripleyOrder.customer_name,
      email: ripleyOrder.customer_email,
    },
    items: ripleyOrder.items.map(item => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
    })),
    total: ripleyOrder.total_amount,
    currency: 'CLP',
    status: mapStatus(ripleyOrder.status),
    createdAt: ripleyOrder.created_at,
  };
}

function mapStatus(ripleyStatus: string): IOrder['status'] {
  const statusMap: Record<string, IOrder['status']> = {
    'pending': 'pending',
    'processing': 'processing',
    'shipped': 'completed',
    'delivered': 'completed',
    'cancelled': 'cancelled',
  };
  return statusMap[ripleyStatus] || 'pending';
}
