import { useState, useCallback } from 'react';
import { useSyncStore } from '../../store/useSyncStore';
import { Card } from '../../core/components/Card.tsx';
import { Button } from '../../core/components/Button.tsx';
import { Table } from '../../core/components/Table.tsx';
import type { IBulkUploadItem } from '../../integrations/common/types';
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  Store,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const AVAILABLE_MARKETPLACES = [
  { id: 'falabella', name: 'Falabella', color: 'bg-green-100 text-green-800' },
  { id: 'mercadolibre', name: 'MercadoLibre', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'ripley', name: 'Ripley', color: 'bg-red-100 text-red-800' },
  { id: 'paris', name: 'Paris', color: 'bg-blue-100 text-blue-800' },
  { id: 'walmart', name: 'Walmart', color: 'bg-blue-100 text-blue-900' },
];

// Mock data generator for preview
const generateMockPreview = (): IBulkUploadItem[] => [
  { sku: 'ZOR553', quantity: 15, warehouse: 'CD Principal' },
  { sku: 'ZOR554', quantity: 8, warehouse: 'CD Principal' },
  { sku: 'MON-001', quantity: 3, warehouse: 'CD Norte' },
  { sku: 'TEC-045', quantity: 25, warehouse: 'CD Principal' },
  { sku: 'MOU-123', quantity: 42, warehouse: 'CD Norte' },
];

export const BulkUpload: React.FC = () => {
  const {
    isProcessing,
    progress,
    totalItems,
    processedItems,
    currentItem,
    result,
    errors,
    selectedMarketplaces,
    setFile,
    setPreviewData,
    setSelectedMarketplaces,
    startSync,
    cancelSync,
    reset,
  } = useSyncStore();

  const [isDragging, setIsDragging] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setFile(file);
        setUploadedFileName(file.name);
        // Generate mock preview
        setPreviewData(generateMockPreview());
      }
    }
  }, [setFile, setPreviewData]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setUploadedFileName(file.name);
      setPreviewData(generateMockPreview());
    }
  }, [setFile, setPreviewData]);

  const toggleMarketplace = (marketplaceId: string) => {
    if (selectedMarketplaces.includes(marketplaceId)) {
      setSelectedMarketplaces(selectedMarketplaces.filter((id) => id !== marketplaceId));
    } else {
      setSelectedMarketplaces([...selectedMarketplaces, marketplaceId]);
    }
  };

  const handleReset = () => {
    reset();
    setUploadedFileName(null);
  };

  const previewColumns = [
    { key: 'sku', header: 'SKU' },
    { key: 'quantity', header: 'Cantidad', align: 'center' as const },
    { key: 'warehouse', header: 'Bodega' },
  ];



  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carga Masiva</h1>
          <p className="text-gray-600">Sincroniza stock masivamente a marketplaces</p>
        </div>
        {result && (
          <Button variant="secondary" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Nueva Carga
          </Button>
        )}
      </div>

      {/* File Upload Area */}
      {!result && (
        <Card>
          {!uploadedFileName ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-colors
                ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'}
              `}
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Arrastra tu archivo aquí
              </h3>
              <p className="text-gray-500 mb-4">o</p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button type="button">Seleccionar archivo</Button>
              </label>
              <p className="text-sm text-gray-400 mt-4">
                Formatos soportados: CSV, Excel (.xlsx, .xls)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{uploadedFileName}</p>
                  <p className="text-sm text-gray-500">Listo para procesar</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Marketplace Selector */}
      {uploadedFileName && !result && !isProcessing && (
        <Card header={<h3 className="font-semibold text-gray-900">Seleccionar Marketplaces Destino</h3>}>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_MARKETPLACES.map((mp) => (
              <button
                key={mp.id}
                onClick={() => toggleMarketplace(mp.id)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                  ${selectedMarketplaces.includes(mp.id)
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <Store className="w-4 h-4" />
                <span className="font-medium text-sm">{mp.name}</span>
                {selectedMarketplaces.includes(mp.id) && (
                  <CheckCircle className="w-4 h-4 text-orange-600" />
                )}
              </button>
            ))}
          </div>
          {selectedMarketplaces.length === 0 && (
            <p className="text-sm text-red-600 mt-3 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Selecciona al menos un marketplace
            </p>
          )}
        </Card>
      )}

      {/* Preview Data */}
      {uploadedFileName && !result && (
        <Card
          header={
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Vista Previa de Datos</h3>
              <button
                onClick={() => setPreviewExpanded(!previewExpanded)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                {previewExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          }
        >
          {previewExpanded && (
            <Table
              columns={previewColumns}
              data={generateMockPreview()}
              emptyMessage="No hay datos para mostrar"
            />
          )}
          <p className="text-sm text-gray-500 mt-4">
            Total de items: <span className="font-medium text-gray-900">{generateMockPreview().length}</span>
          </p>
        </Card>
      )}

      {/* Processing State */}
      {isProcessing && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader className="w-6 h-6 text-orange-600 animate-spin" />
              <div>
                <h3 className="font-semibold text-gray-900">Sincronizando...</h3>
                <p className="text-sm text-gray-600">{currentItem}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progreso</span>
                <span className="font-medium text-gray-900">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                {processedItems} de {totalItems} items procesados
              </p>
            </div>

            <div className="flex justify-end">
              <Button variant="danger" onClick={cancelSync}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card
          header={
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-gray-900">Sincronización Completada</h3>
            </div>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-900">{result.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-700">{result.success}</p>
              <p className="text-sm text-green-600">Exitosos</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-700">{result.failed}</p>
              <p className="text-sm text-red-600">Fallidos</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-700">
                {Math.round((result.success / result.total) * 100)}%
              </p>
              <p className="text-sm text-blue-600">Tasa de éxito</p>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Errores ({errors.length})
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-700 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Action Button */}
      {uploadedFileName && !isProcessing && !result && (
        <div className="flex justify-end">
          <Button
            onClick={startSync}
            disabled={selectedMarketplaces.length === 0}
            className="px-8"
          >
            <Play className="w-4 h-4 mr-2" />
            Iniciar Sincronización
          </Button>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
