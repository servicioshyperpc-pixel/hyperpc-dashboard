import type { IProduct, IOrder } from '../common/types';

export interface FalabellaProduct {
  item_id: string;
  seller_sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface FalabellaOrder {
  order_id: string;
  order_number: string;
  customer_first_name: string;
  customer_last_name: string;
  price: string;
  status: string;
  created_at: string;
  items: Array<{
    sku: string;
    name: string;
    qty: number;
  }>;
}

export function adaptProduct(falabellaProduct: FalabellaProduct): IProduct {
  return {
    id: falabellaProduct.item_id,
    sku: falabellaProduct.seller_sku,
    name: falabellaProduct.name,
    price: falabellaProduct.price,
    stock: falabellaProduct.quantity,
    status: 'active',
  };
}

export function adaptOrder(falabellaOrder: FalabellaOrder): IOrder {
  return {
    id: falabellaOrder.order_id,
    orderId: falabellaOrder.order_number,
    marketplace: 'falabella',
    customer: {
      name: `${falabellaOrder.customer_first_name} ${falabellaOrder.customer_last_name}`,
    },
    items: falabellaOrder.items.map(item => ({
      sku: item.sku,
      name: item.name,
      quantity: item.qty,
      price: parseFloat(falabellaOrder.price) / item.qty,
      total: parseFloat(falabellaOrder.price),
    })),
    total: parseFloat(falabellaOrder.price),
    currency: 'CLP',
    status: mapStatus(falabellaOrder.status),
    createdAt: falabellaOrder.created_at,
  };
}

function mapStatus(falabellaStatus: string): IOrder['status'] {
  const statusMap: Record<string, IOrder['status']> = {
    'pending': 'pending',
    'ready_to_ship': 'processing',
    'shipped': 'completed',
    'cancelled': 'cancelled',
    'delivered': 'completed',
  };
  return statusMap[falabellaStatus] || 'pending';
}
