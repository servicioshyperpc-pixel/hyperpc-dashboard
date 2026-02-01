import type { IProduct, IOrder, ISyncResult } from '../common/types';
import { mockProducts, mockSales } from '../../data/mock';

export const RipleyService = {
  async getProducts(): Promise<IProduct[]> {
    await new Promise(r => setTimeout(r, 850));
    return mockProducts.filter(p => p.marketplaces.includes('ripley'));
  },

  async getOrders(): Promise<IOrder[]> {
    await new Promise(r => setTimeout(r, 850));
    const ripleySales = mockSales.filter(s => s.marketplace === 'ripley');
    
    return ripleySales.map(sale => ({
      id: sale.id,
      orderId: sale.orderId,
      marketplace: 'ripley',
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
      status: sale.status === 'completed' ? 'completed' : 
               sale.status === 'error' ? 'cancelled' : 'processing',
      createdAt: sale.timestamp,
    }));
  },

  async updateStock(sku: string, quantity: number): Promise<ISyncResult> {
    await new Promise(r => setTimeout(r, 550));
    
    if (Math.random() > 0.08) {
      return {
        success: true,
        message: `Stock actualizado en Ripley: ${sku} = ${quantity}`,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        message: `Error al actualizar stock en Ripley: ${sku}`,
        timestamp: new Date().toISOString(),
      };
    }
  },
};
