import type { IProduct, IOrder, ISyncResult } from '../common/types';
import { mockProducts, mockSales } from '../../data/mock';

export const OdooService = {
  async getProducts(): Promise<IProduct[]> {
    await new Promise(r => setTimeout(r, 600));
    return mockProducts;
  },

  async getOrders(): Promise<IOrder[]> {
    await new Promise(r => setTimeout(r, 600));
    return mockSales.map(sale => ({
      id: sale.id,
      orderId: `SO-${sale.orderId}`,
      marketplace: 'odoo',
      customer: { name: sale.customer },
      items: [{
        sku: sale.sku,
        name: sale.product,
        quantity: 1,
        price: sale.amount,
        total: sale.amount,
      }],
      total: sale.amount,
      currency: sale.currency,
      status: sale.status === 'completed' ? 'completed' : 'processing',
      createdAt: sale.timestamp,
    }));
  },

  async updateStock(sku: string, quantity: number): Promise<ISyncResult> {
    await new Promise(r => setTimeout(r, 400));
    
    return {
      success: true,
      message: `Stock actualizado en Odoo: ${sku} = ${quantity}`,
      timestamp: new Date().toISOString(),
    };
  },

  async confirmSaleOrder(orderId: string): Promise<ISyncResult> {
    await new Promise(r => setTimeout(r, 700));
    
    return {
      success: true,
      message: `Orden de venta confirmada: ${orderId}`,
      timestamp: new Date().toISOString(),
    };
  },
};
