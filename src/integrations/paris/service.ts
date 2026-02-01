import type { IProduct, IOrder, ISyncResult } from '../common/types';
import { mockProducts, mockSales } from '../../data/mock';

export const ParisService = {
  async getProducts(): Promise<IProduct[]> {
    await new Promise(r => setTimeout(r, 820));
    return mockProducts.filter(p => p.marketplaces.includes('paris'));
  },

  async getOrders(): Promise<IOrder[]> {
    await new Promise(r => setTimeout(r, 820));
    const parisSales = mockSales.filter(s => s.marketplace === 'paris');
    
    return parisSales.map(sale => ({
      id: sale.id,
      orderId: sale.orderId,
      marketplace: 'paris',
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
    await new Promise(r => setTimeout(r, 520));
    
    if (Math.random() > 0.07) {
      return {
        success: true,
        message: `Stock actualizado en Paris: ${sku} = ${quantity}`,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        message: `Error al actualizar stock en Paris: ${sku}`,
        timestamp: new Date().toISOString(),
      };
    }
  },
};
