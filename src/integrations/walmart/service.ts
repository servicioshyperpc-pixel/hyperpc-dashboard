import type { IProduct, IOrder, ISyncResult } from '../common/types';
import { mockProducts, mockSales } from '../../data/mock';

export const WalmartService = {
  async getProducts(): Promise<IProduct[]> {
    await new Promise(r => setTimeout(r, 950));
    return mockProducts.filter(p => p.marketplaces.includes('walmart'));
  },

  async getOrders(): Promise<IOrder[]> {
    await new Promise(r => setTimeout(r, 950));
    const walmartSales = mockSales.filter(s => s.marketplace === 'walmart');
    
    return walmartSales.map(sale => ({
      id: sale.id,
      orderId: sale.orderId,
      marketplace: 'walmart',
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
    await new Promise(r => setTimeout(r, 580));
    
    if (Math.random() > 0.06) {
      return {
        success: true,
        message: `Stock actualizado en Walmart: ${sku} = ${quantity}`,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        message: `Error al actualizar stock en Walmart: ${sku}`,
        timestamp: new Date().toISOString(),
      };
    }
  },
};
