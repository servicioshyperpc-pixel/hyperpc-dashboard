import type { IProduct, IOrder, ISyncResult } from '../common/types';
import { mockProducts, mockSales } from '../../data/mock';

export const FalabellaService = {
  async getProducts(): Promise<IProduct[]> {
    await new Promise(r => setTimeout(r, 900));
    return mockProducts.filter(p => p.marketplaces.includes('falabella'));
  },

  async getOrders(): Promise<IOrder[]> {
    await new Promise(r => setTimeout(r, 900));
    const falabellaSales = mockSales.filter(s => s.marketplace === 'falabella');
    
    return falabellaSales.map(sale => ({
      id: sale.id,
      orderId: sale.orderId,
      marketplace: 'falabella',
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
    await new Promise(r => setTimeout(r, 600));
    
    if (Math.random() > 0.05) {
      return {
        success: true,
        message: `Stock actualizado en Falabella: ${sku} = ${quantity}`,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        message: `Error al actualizar stock en Falabella: ${sku}`,
        timestamp: new Date().toISOString(),
      };
    }
  },
};
