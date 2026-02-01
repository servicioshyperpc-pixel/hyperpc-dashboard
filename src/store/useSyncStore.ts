import { create } from 'zustand';
import type { IBulkUploadItem, IBulkUploadResult } from '../integrations/common/types';

interface SyncState {
  // Upload state
  isProcessing: boolean;
  progress: number;
  totalItems: number;
  processedItems: number;
  currentItem?: string;
  
  // Results
  result?: IBulkUploadResult;
  errors: string[];
  
  // File
  uploadedFile?: File;
  previewData?: IBulkUploadItem[];
  selectedMarketplaces: string[];
  
  // Actions
  setFile: (file: File) => void;
  setPreviewData: (data: IBulkUploadItem[]) => void;
  setSelectedMarketplaces: (marketplaces: string[]) => void;
  startSync: () => Promise<void>;
  cancelSync: () => void;
  reset: () => void;
}

const MARKETPLACES = ['falabella', 'mercadolibre', 'ripley', 'paris', 'walmart'];

export const useSyncStore = create<SyncState>((set, get) => ({
  isProcessing: false,
  progress: 0,
  totalItems: 0,
  processedItems: 0,
  currentItem: undefined,
  result: undefined,
  errors: [],
  uploadedFile: undefined,
  previewData: undefined,
  selectedMarketplaces: MARKETPLACES,

  setFile: (file: File) => {
    set({ uploadedFile: file });
  },

  setPreviewData: (data: IBulkUploadItem[]) => {
    set({ previewData: data });
  },

  setSelectedMarketplaces: (marketplaces: string[]) => {
    set({ selectedMarketplaces: marketplaces });
  },

  startSync: async () => {
    const { previewData, selectedMarketplaces } = get();
    
    if (!previewData || previewData.length === 0) {
      set({ errors: ['No hay datos para sincronizar'] });
      return;
    }

    set({ 
      isProcessing: true, 
      progress: 0, 
      totalItems: previewData.length,
      processedItems: 0,
      errors: [],
      result: undefined
    });

    // Simular procesamiento por marketplace
    for (const marketplace of selectedMarketplaces) {
      for (let i = 0; i < previewData.length; i++) {
        const item = previewData[i];
        
        set({ 
          currentItem: `${item.sku} → ${marketplace}`,
          processedItems: i + 1,
          progress: Math.round(((i + 1) / previewData.length) * 100)
        });
        
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Simular 10% de error aleatorio
        if (Math.random() < 0.1) {
          set(state => ({ 
            errors: [...state.errors, `Error en ${marketplace}: ${item.sku}`]
          }));
        }
      }
    }

    // Resultado final
    const success = previewData.length - get().errors.length;
    
    set({
      isProcessing: false,
      progress: 100,
      result: {
        total: previewData.length,
        processed: previewData.length,
        success,
        failed: get().errors.length,
        errors: get().errors.map(err => ({
          sku: err.replace('Error procesando SKU: ', ''),
          error: 'Error de sincronización'
        }))
      }
    });
  },

  cancelSync: () => {
    set({ 
      isProcessing: false,
      progress: 0,
      currentItem: undefined
    });
  },

  reset: () => {
    set({
      isProcessing: false,
      progress: 0,
      totalItems: 0,
      processedItems: 0,
      currentItem: undefined,
      result: undefined,
      errors: [],
      uploadedFile: undefined,
      previewData: undefined,
      selectedMarketplaces: MARKETPLACES
    });
  }
}));
