import type { IProduct, IOrder } from '../common/types';

export interface WalmartProduct {
  upc: string;
  sku: string;
  product_name: string;
  price: number;
  inventory_count: number;
  published_status: string;
}

export interface WalmartOrder {
  purchase_order_id: string;
  customer_order_id: string;
  customer_email?: string;
  customer_name: string;
  order_total: number;
  order_date: string;
  order_lines: Array<{
    item_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
}

export function adaptProduct(walmartProduct: WalmartProduct): IProduct {
  return {
    id: walmartProduct.upc,
    sku: walmartProduct.sku,
    name: walmartProduct.product_name,
    price: walmartProduct.price,
    stock: walmartProduct.inventory_count,
    status: walmartProduct.published_status === 'PUBLISHED' ? 'active' : 'inactive',
  };
}

export function adaptOrder(walmartOrder: WalmartOrder): IOrder {
  return {
    id: walmartOrder.purchase_order_id,
    orderId: walmartOrder.customer_order_id,
    marketplace: 'walmart',
    customer: {
      name: walmartOrder.customer_name,
      email: walmartOrder.customer_email,
    },
    items: walmartOrder.order_lines.map(line => ({
      sku: line.item_id,
      name: line.product_name,
      quantity: line.quantity,
      price: line.unit_price,
      total: line.quantity * line.unit_price,
    })),
    total: walmartOrder.order_total,
    currency: 'CLP',
    status: 'completed',
    createdAt: walmartOrder.order_date,
  };
}
