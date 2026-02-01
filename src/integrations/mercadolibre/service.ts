import type { IProduct, IOrder, ISyncResult } from '../common/types';
import { mockProducts, mockSales } from '../../data/mock';

export const MercadoLibreService = {
  async getProducts(): Promise<IProduct[]> {
    await new Promise(r => setTimeout(r, 800));
    return mockProducts.filter(p => p.marketplaces.includes('mercadolibre'));
  },

  async getOrders(): Promise<IOrder[]> {
    await new Promise(r => setTimeout(r, 800));
    const mlSales = mockSales.filter(s => s.marketplace === 'mercadolibre');
    
    return mlSales.map(sale => ({
      id: sale.id,
      orderId: sale.orderId,
      marketplace: 'mercadolibre',
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
    await new Promise(r => setTimeout(r, 500));
    
    if (Math.random() > 0.1) {
      return {
        success: true,
        message: `Stock actualizado en MercadoLibre: ${sku} = ${quantity}`,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        message: `Error al actualizar stock en MercadoLibre: ${sku}`,
        timestamp: new Date().toISOString(),
      };
    }
  },
};
