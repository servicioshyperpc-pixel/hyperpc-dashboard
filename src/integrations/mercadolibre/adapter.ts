import type { IProduct, IOrder } from '../common/types';

export interface MercadoLibreProduct {
  id: string;
  title: string;
  price: number;
  available_quantity: number;
  sku?: string;
}

export interface MercadoLibreOrder {
  id: string;
  status: string;
  total_amount: number;
  buyer: {
    nickname: string;
    email?: string;
  };
  order_items: Array<{
    item: {
      id: string;
      title: string;
    };
    quantity: number;
    unit_price: number;
  }>;
}

export function adaptProduct(mlProduct: MercadoLibreProduct): IProduct {
  return {
    id: mlProduct.id,
    sku: mlProduct.sku || mlProduct.id,
    name: mlProduct.title,
    price: mlProduct.price,
    stock: mlProduct.available_quantity,
    status: 'active',
  };
}

export function adaptOrder(mlOrder: MercadoLibreOrder): IOrder {
  return {
    id: mlOrder.id,
    orderId: mlOrder.id,
    marketplace: 'mercadolibre',
    customer: {
      name: mlOrder.buyer.nickname,
      email: mlOrder.buyer.email,
    },
    items: mlOrder.order_items.map(item => ({
      sku: item.item.id,
      name: item.item.title,
      quantity: item.quantity,
      price: item.unit_price,
      total: item.quantity * item.unit_price,
    })),
    total: mlOrder.total_amount,
    currency: 'CLP',
    status: mapStatus(mlOrder.status),
    createdAt: new Date().toISOString(),
  };
}

function mapStatus(mlStatus: string): IOrder['status'] {
  const statusMap: Record<string, IOrder['status']> = {
    'paid': 'processing',
    'confirmed': 'processing',
    'shipped': 'completed',
    'cancelled': 'cancelled',
    'pending': 'pending',
  };
  return statusMap[mlStatus] || 'pending';
}
