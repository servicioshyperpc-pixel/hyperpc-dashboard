import { create } from 'zustand';
import type { MockSale, MockLog } from '../data/mock';
import { mockSales, mockLogs } from '../data/mock';
import type { IDashboardStats } from '../integrations/common/types';

interface DashboardState {
  // Data
  sales: MockSale[];
  logs: MockLog[];
  selectedDate: Date;
  
  // Stats
  stats: IDashboardStats;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSales: (date?: Date) => void;
  refreshData: () => void;
  setSelectedDate: (date: Date) => void;
  getSalesByStatus: (status: MockSale['status']) => MockSale[];
  getSalesByMarketplace: (marketplace: MockSale['marketplace']) => MockSale[];
  getErrors: () => MockLog[];
}

const calculateStats = (sales: MockSale[]): IDashboardStats => {
  const totalSales = sales.length;
  const totalAmount = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const errors = sales.filter(s => s.status === 'error').length;
  const pendingOrders = sales.filter(s => s.status === 'pending' || s.status === 'processing').length;
  
  const ordersByMarketplace = sales.reduce((acc, sale) => {
    acc[sale.marketplace] = (acc[sale.marketplace] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalSales,
    totalAmount,
    ordersByMarketplace,
    errors,
    pendingOrders,
    lowStockCount: 1, // Mock
    lastSync: new Date().toISOString()
  };
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  sales: mockSales,
  logs: mockLogs,
  selectedDate: new Date(),
  stats: calculateStats(mockSales),
  isLoading: false,
  error: null,

  fetchSales: (date?: Date) => {
    set({ isLoading: true });
    
    // Simular delay de API
    setTimeout(() => {
      const targetDate = date || new Date();
      const dateStr = targetDate.toISOString().split('T')[0];
      
      // Filtrar ventas por fecha (mock)
      const filteredSales = mockSales.filter(sale => 
        sale.timestamp.startsWith(dateStr)
      );
      
      set({ 
        sales: filteredSales.length > 0 ? filteredSales : mockSales,
        stats: calculateStats(filteredSales.length > 0 ? filteredSales : mockSales),
        isLoading: false,
        selectedDate: targetDate
      });
    }, 500);
  },

  refreshData: () => {
    const { selectedDate } = get();
    get().fetchSales(selectedDate);
  },

  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
    get().fetchSales(date);
  },

  getSalesByStatus: (status) => {
    return get().sales.filter(sale => sale.status === status);
  },

  getSalesByMarketplace: (marketplace) => {
    return get().sales.filter(sale => sale.marketplace === marketplace);
  },

  getErrors: () => {
    return get().logs.filter(log => log.status === 'error');
  }
}));
