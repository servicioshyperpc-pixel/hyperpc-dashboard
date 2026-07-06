import { useCallback, useEffect, useState } from 'react';
import { Card } from '../../core/components/Card.tsx';
import { Table } from '../../core/components/Table.tsx';
import { Badge } from '../../core/components/Badge.tsx';
import { Input } from '../../core/components/Input.tsx';
import { Button } from '../../core/components/Button.tsx';
import axiosInstance from '../../api/axiosInstance';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Pencil,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  Upload,
  X,
} from 'lucide-react';

type MarketplaceKey = 'falabella' | 'mercadolibre' | 'ripley' | 'paris' | 'walmart';
type PublicationStatus = 'missing' | 'draft' | 'ready' | 'processing' | 'published' | 'error' | 'disabled';

interface PublicationSummary {
  sku: string;
  marketplace: MarketplaceKey;
  status: PublicationStatus;
  existsInMarketplace: boolean;
  externalProductId: string | null;
  lastError: string | null;
  lastSyncedAt: string | null;
}

interface ProductAttribute {
  attribute: string;
  values: string[];
}

interface CatalogProduct {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  active: boolean;
  hasImage: boolean;
  imageThumbBase64?: string | null;
  images?: string[] | null;
  productTemplateId: number | null;
  attributes?: ProductAttribute[];
  publications: PublicationSummary[];
}

interface CatalogResponse {
  items: CatalogProduct[];
  page: number;
  limit: number;
  total: number;
  marketplaces: MarketplaceKey[];
}


interface ProductDetailResponse extends CatalogProduct {
  attributes?: ProductAttribute[];
  odooDetails?: {
    product?: Record<string, any> | null;
    template?: Record<string, any> | null;
  };
  marketplaceDetails: Record<
    MarketplaceKey,
    {
      marketplace: MarketplaceKey;
      status: PublicationStatus;
      existsInMarketplace: boolean;
      externalProductId: string | null;
      title: string | null;
      description: string | null;
      price: number | null;
      imageUrl: string | null;
      payload: Record<string, any> | null;
      lastError: string | null;
      lastSyncedAt: string | null;
      validation?: {
        status: 'ready' | 'missing_data' | 'exists' | 'unknown';
        message: string;
        missingFields: string[];
        checkedWith: 'api' | 'local';
      };
    }
  >;
  imageBase64?: string | null;
}

interface BulkMarketplaceResult {
  sku: string;
  marketplace: MarketplaceKey;
  operation: 'create' | 'update';
  status: string;
  message: string;
  payload?: {
    missingFields?: string[];
    externalProductId?: string | null;
    existsInMarketplace?: boolean;
    currentStatus?: string;
    checkedWith?: 'api' | 'local';
  };
}

interface BulkPublishSkuResult {
  sku: string;
  status: string;
  message: string;
  marketplaces: BulkMarketplaceResult[];
}

interface BulkPublishResponse {
  dryRun: boolean;
  skipExisting: boolean;
  batchSize: number;
  requested: number;
  marketplaces: MarketplaceKey[];
  results: BulkPublishSkuResult[];
}

interface BulkUpdateResponse {
  requested: number;
  marketplaces: MarketplaceKey[];
  updated: number;
  failed: number;
  skipped: number;
  results: BulkPublishSkuResult[];
}

type BulkImportMarketplaceKey = 'falabella' | 'ripley' | 'paris' | 'walmart' | 'meli';
type BulkImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
type BulkUpdateField = 'stock' | 'price' | 'title' | 'description' | 'images';

interface BulkImportMarketplaceProgress {
  status: BulkImportStatus;
  total: number;
  processed: number;
  success: number;
  failed: number;
  errors?: Array<{ sku: string; reason: string }>;
  startedAt?: string;
  completedAt?: string;
}

interface BulkImportUploadResponse {
  ok: boolean;
  jobId: string;
  message: string;
  products: Record<BulkImportMarketplaceKey, number>;
  order: BulkImportMarketplaceKey[];
}

interface BulkImportStatusResponse {
  ok: boolean;
  jobId: string;
  filename: string;
  status: BulkImportStatus;
  marketplaces: Record<BulkImportMarketplaceKey, BulkImportMarketplaceProgress>;
  startedAt?: string;
  completedAt?: string;
}

const MARKETPLACES: MarketplaceKey[] = ['falabella', 'mercadolibre', 'ripley', 'paris', 'walmart'];

const MARKETPLACE_LABELS: Record<MarketplaceKey, string> = {
  falabella: 'Falabella',
  mercadolibre: 'MercadoLibre',
  ripley: 'Ripley',
  paris: 'Paris',
  walmart: 'Walmart',
};

const BULK_IMPORT_LABELS: Record<BulkImportMarketplaceKey, string> = {
  falabella: 'Falabella',
  ripley: 'Ripley',
  paris: 'Paris',
  walmart: 'Walmart',
  meli: 'MercadoLibre',
};

const BULK_IMPORT_STATUS_LABELS: Record<BulkImportStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Falló',
  skipped: 'Omitido',
};

const BULK_UPDATE_FIELD_LABELS: Record<BulkUpdateField, string> = {
  stock: 'Stock',
  price: 'Precio',
  title: 'Titulo',
  description: 'Descripcion',
  images: 'Imagenes',
};

const BULK_UPDATE_FIELDS_BY_MARKETPLACE: Record<MarketplaceKey, BulkUpdateField[]> = {
  falabella: ['stock', 'price', 'title', 'description', 'images'],
  mercadolibre: ['stock', 'price', 'images'],
  ripley: ['stock', 'price', 'title', 'description', 'images'],
  paris: ['stock', 'price', 'title', 'description', 'images'],
  walmart: ['stock', 'price', 'title', 'description'],
};

// Ocultar (sin eliminar) los botones de publicar del panel de detalle.
// Cambiar a true para volver a mostrarlos.
const SHOW_PUBLISH_BUTTONS = false;

// Ocultar (sin eliminar) el botón "Crear masivo". Cambiar a true para mostrarlo.
const SHOW_CREAR_MASIVO = false;

// Convierte HTML a texto plano. El cliente quiere la descripción de MercadoLibre
// en texto plano; el resto de los canales la muestran en HTML.
const stripHtml = (value: string) =>
  String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();

const bulkImportStatusClass = (status: BulkImportStatus) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'skipped':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-amber-100 text-amber-800';
  }
};

const STATUS_META: Record<PublicationStatus, { label: string; variant: 'success' | 'error' | 'warning' | 'info' | 'default'; helper: string }> = {
  missing: { label: 'Pendiente', variant: 'default', helper: 'Este canal todavía no está listo para publicar.' },
  draft: { label: 'En preparación', variant: 'warning', helper: 'Información guardada, pendiente de publicar.' },
  ready: { label: 'Listo', variant: 'info', helper: 'La información está preparada para publicar.' },
  processing: { label: 'Procesando', variant: 'info', helper: 'El marketplace está procesando la publicación de forma asíncrona.' },
  published: { label: 'Publicado', variant: 'success', helper: 'Producto publicado o actualizado en el marketplace.' },
  error: { label: 'Error', variant: 'error', helper: 'Falló la última operación en el marketplace.' },
  disabled: { label: 'Deshabilitado', variant: 'default', helper: 'Este canal no se usará para el SKU.' },
};

const getEffectiveStatusMeta = (publication: {
  status: PublicationStatus;
  existsInMarketplace: boolean;
  externalProductId?: string | null;
  lastSyncedAt: string | null;
}) => {
  if (
    publication.existsInMarketplace ||
    publication.externalProductId ||
    publication.status === 'published'
  ) {
    return STATUS_META.published;
  }
  if (!publication.lastSyncedAt) return STATUS_META[publication.status];
  return {
    label: 'No publicado',
    variant: 'error' as const,
    helper: 'La última verificación no encontró el producto en el marketplace.',
  };
};

const isMarketplacePublished = (publication: {
  status: PublicationStatus;
  existsInMarketplace: boolean;
  externalProductId?: string | null;
  validation?: { status: 'ready' | 'missing_data' | 'exists' | 'unknown' };
}) =>
  publication.existsInMarketplace ||
  Boolean(publication.externalProductId) ||
  publication.status === 'published' ||
  publication.validation?.status === 'exists';

const VALIDATION_META: Record<
  'ready' | 'missing_data' | 'exists' | 'unknown',
  { label: string; variant: 'success' | 'error' | 'warning' | 'default'; helper: string }
> = {
  ready: { label: 'Listo para publicar', variant: 'success', helper: 'La configuración mínima está completa.' },
  missing_data: { label: 'Requiere información', variant: 'error', helper: 'Información pendiente para este canal.' },
  exists: { label: 'Ya existe', variant: 'warning', helper: 'El producto ya figura creado en el marketplace.' },
  unknown: { label: 'Sin verificar', variant: 'default', helper: 'Todavía no se evaluó este canal en forma real.' },
};

const IVA_RATE = 1.19;
const CATALOG_PAGE_SIZE = 100;
const MARKETPLACE_STATUS_SYNC_LIMIT = 20;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

const priceWithIva = (price: number) => Math.round((price || 0) * IVA_RATE);

const parseLinesToAttributes = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [key, ...rest] = line.split('=');
      return {
        key: (key || '').trim(),
        value: rest.join('=').trim(),
      };
    })
    .filter((entry) => entry.key && entry.value);

const attributesToMultiline = (attributes?: Array<{ key?: string; value?: string; id?: string; name?: string; values?: string[] }>) =>
  Array.isArray(attributes)
    ? attributes
        .map((attribute) => {
          const key = attribute.key || attribute.id || attribute.name || '';
          const value = attribute.value || attribute.values?.[0] || '';
          return key && value ? `${key}=${value}` : '';
        })
        .filter(Boolean)
        .join('\n')
    : '';

const parseImageUrls = (value: string) =>
  value
    .split(/[\n,;]+/)
    .map((url) => url.trim())
    .filter((url) => /^https?:\/\//i.test(url));

const imageUrlsToMultiline = (...sources: any[]) => {
  const urls: string[] = [];
  for (const source of sources) {
    const list = Array.isArray(source) ? source : source ? [source] : [];
    for (const item of list) {
      const raw = typeof item === 'string' ? item : item?.src || item?.source || item?.url || '';
      const url = String(raw || '').trim();
      if (/^https?:\/\//i.test(url) && !urls.includes(url)) urls.push(url);
    }
  }
  return urls.join('\n');
};

const friendlyFieldName = (raw: string): string => {
  const map: Record<string, string> = {
    'title': 'Título',
    'description': 'Descripción',
    'price': 'Precio',
    'imageUrl': 'Imagen',
    'payload.configuration.familyId': 'Familia',
    'payload.configuration.category': 'Categoría',
    'payload.configuration.categoryId': 'Categoría',
    'payload.configuration.categoryCode': 'Categoría',
    'payload.configuration.primaryCategory': 'Categoría principal',
    'payload.configuration.brand': 'Marca',
    'payload.configuration.gtin': 'Código de barras',
    'payload.configuration.productId': 'Código del producto',
    'payload.configuration.operatorCode': 'Código de integración',
    'payload.configuration.listingTypeId': 'Tipo de publicación',
    'payload.configuration.condition': 'Condición',
    'payload.configuration.currencyId': 'Moneda',
    'payload.configuration.variantId': 'SKU de variante',
    'payload.configuration.leadtimeToShip': 'Tiempo de despacho',
    'payload.configuration.mediaName': 'Nombre de imagen',
    'payload.configuration.thumbnailUrl': 'Imagen miniatura',
    'payload.configuration.productData': 'Características del producto',
    'payload.configuration.productAttributes': 'Características del producto',
    'payload.configuration.variantAttributes': 'Características de variante',
    'payload.configuration.attributes': 'Atributos',
    'payload.configuration.imageUrl': 'Imagen',
  };
  // Try exact match, then strip prefix and try, then humanize the last segment
  if (map[raw]) return map[raw];
  const stripped = raw.replace('payload.configuration.', '');
  if (map[stripped]) return map[stripped];
  // Humanize: camelCase → "Camel Case"
  return stripped.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
};

// Traduce los status crudos que devuelve el backend (bulk-update / bulk-create)
// a una etiqueta legible en español con el color correcto. Cubre tanto el estado
// por SKU como el estado por canal. 'processing' (Ripley async) se muestra como
// éxito porque la publicación fue aceptada y quedó en moderación.
const resultStatusMeta = (
  raw: string,
): { label: string; variant: 'success' | 'error' | 'warning' | 'info' | 'default' } => {
  const key = String(raw || '').toLowerCase();
  const map: Record<string, { label: string; variant: 'success' | 'error' | 'warning' | 'info' | 'default' }> = {
    updated: { label: 'Actualizado', variant: 'success' },
    created: { label: 'Creado', variant: 'success' },
    published: { label: 'Publicado', variant: 'success' },
    processing: { label: 'En proceso', variant: 'info' },
    partial: { label: 'Parcial', variant: 'warning' },
    skipped: { label: 'Omitido', variant: 'warning' },
    skipped_existing: { label: 'Ya existía', variant: 'warning' },
    error: { label: 'Error', variant: 'error' },
    failed: { label: 'Error', variant: 'error' },
  };
  return map[key] || { label: raw || 'Sin estado', variant: 'default' };
};

const emptyForm = {
  title: '',
  description: '',
  price: '',
  status: 'draft' as PublicationStatus,
  imageUrl: '',
  imageUrls: '',
  falabellaPrimaryCategory: '',
  falabellaCategories: '',
  falabellaBrand: '',
  falabellaProductId: '',
  falabellaOperatorCode: '',
  falabellaProductData: '',
  meliCategoryId: '',
  meliListingTypeId: '',
  meliCondition: 'new',
  meliCurrencyId: 'CLP',
  meliAttributes: '',
  walmartCategory: '',
  walmartBrand: '',
  walmartGtin: '',
  walmartAttributes: '',
  parisFamilyId: '',
  parisCategory: '',
  parisBrand: '',
  parisProductAttributes: '',
  parisVariantAttributes: '',
  parisMediaName: '',
  ripleyCategoryCode: '',
  ripleyBrand: '',
  ripleyThumbnailUrl: '',
  ripleyVariantId: '',
  ripleyLeadtimeToShip: '',
  ripleyAttributes: '',
};

export const ProductList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [catalog, setCatalog] = useState<CatalogResponse>({
    items: [],
    page: 1,
    limit: CATALOG_PAGE_SIZE,
    total: 0,
    marketplaces: MARKETPLACES,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetailResponse | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceKey>('falabella');
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailNotice, setDetailNotice] = useState<string | null>(null);
  const [formState, setFormState] = useState(emptyForm);
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMarketplaces, setBulkMarketplaces] = useState<MarketplaceKey[]>(MARKETPLACES);
  const [bulkBatchSize, setBulkBatchSize] = useState(50);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResults, setBulkResults] = useState<BulkPublishSkuResult[]>([]);
  const [isProductPublishModalOpen, setIsProductPublishModalOpen] = useState(false);
  const [productPublishMarketplaces, setProductPublishMarketplaces] = useState<MarketplaceKey[]>(MARKETPLACES);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [bulkForceUpdate, setBulkForceUpdate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished' | 'error'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'with_stock' | 'no_stock'>('all');
  const [stockSort, setStockSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFalabellaCatalogSyncing, setIsFalabellaCatalogSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [isBulkStatusRefreshing, setIsBulkStatusRefreshing] = useState(false);
  const [bulkUpdateMarketplaces, setBulkUpdateMarketplaces] = useState<MarketplaceKey[]>(MARKETPLACES);
  const [expandedBulkUpdateMarketplaces, setExpandedBulkUpdateMarketplaces] = useState<MarketplaceKey[]>(['falabella']);
  const [bulkUpdateFieldsByMarketplace, setBulkUpdateFieldsByMarketplace] = useState<Record<MarketplaceKey, BulkUpdateField[]>>(
    () => Object.fromEntries(
      MARKETPLACES.map((marketplace) => [marketplace, BULK_UPDATE_FIELDS_BY_MARKETPLACE[marketplace]]),
    ) as Record<MarketplaceKey, BulkUpdateField[]>,
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportUploadResponse | null>(null);
  const [importJobStatus, setImportJobStatus] = useState<BulkImportStatusResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const { data } = await axiosInstance.get<CatalogResponse>('/catalog/products', {
        params: {
          search: searchQuery || undefined,
          page: currentPage,
          limit: CATALOG_PAGE_SIZE,
          stockFilter: stockFilter !== 'all' ? stockFilter : undefined,
          sortBy: stockSort !== 'none' ? `stock_${stockSort}` : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
        },
      });

      setCatalog(data);
    } catch (error: any) {
      setLoadError(error.response?.data?.message || error.message || 'No se pudo cargar el catálogo');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, currentPage, searchQuery, stockFilter, stockSort]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCatalog();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadCatalog]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchQuery, stockFilter, stockSort]);

  const syncMarketplaceStatus = async () => {
    if (catalog.items.length === 0) return;
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const skus = catalog.items.slice(0, MARKETPLACE_STATUS_SYNC_LIMIT).map((item) => item.sku);
      const { data } = await axiosInstance.post<Record<string, Record<string, { exists: boolean; externalId: string | null }>>>('/marketplace-sync/status', { skus });

      setCatalog((prev) => ({
        ...prev,
        items: prev.items.map((item) => ({
          ...item,
          publications: item.publications.map((pub) => {
            const syncResult = data[item.sku]?.[pub.marketplace];
            if (!syncResult) return pub;
            return {
              ...pub,
              existsInMarketplace: syncResult.exists,
              externalProductId: syncResult.externalId,
              lastSyncedAt: new Date().toISOString(),
            };
          }),
        })),
      }));
      setSyncNotice(`Sincronización ligera completada para ${skus.length} SKU(s).`);
    } catch (error) {
      console.error('Error syncing marketplace status:', error);
      setSyncNotice('No se pudo completar la sincronización ligera de marketplaces.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Capa 2: al abrir el modal de actualización masiva, refrescar en vivo el
  // estado de publicación de los SKUs seleccionados (chequeo contra la API real
  // vía /marketplace-sync/status) para no trabajar sobre data vieja del cache.
  // Best-effort y en segundo plano: si falla, el modal igual abre.
  const refreshSelectedMarketplaceStatus = async (skus: string[]) => {
    const uniqueSkus = Array.from(new Set(skus)).slice(0, MARKETPLACE_STATUS_SYNC_LIMIT);
    if (uniqueSkus.length === 0) return;
    setIsBulkStatusRefreshing(true);
    try {
      const { data } = await axiosInstance.post<Record<string, Record<string, { exists: boolean; externalId: string | null }>>>('/marketplace-sync/status', { skus: uniqueSkus });

      setCatalog((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (!data[item.sku]) return item;
          return {
            ...item,
            publications: item.publications.map((pub) => {
              const syncResult = data[item.sku]?.[pub.marketplace];
              if (!syncResult) return pub;
              return {
                ...pub,
                existsInMarketplace: syncResult.exists,
                externalProductId: syncResult.externalId,
                lastSyncedAt: new Date().toISOString(),
              };
            }),
          };
        }),
      }));
    } catch (error) {
      console.error('Error refreshing selected marketplace status:', error);
    } finally {
      setIsBulkStatusRefreshing(false);
    }
  };

  const syncFalabellaCatalogStatus = async () => {
    setIsFalabellaCatalogSyncing(true);
    setSyncNotice(null);
    try {
      const { data } = await axiosInstance.post<{
        found: number;
        updated: number;
      }>('/marketplace-sync/falabella/catalog-status', undefined, { timeout: 180000 });
      setSyncNotice(`Falabella sincronizado: ${data.found} productos encontrados, ${data.updated} registros actualizados.`);
      await loadCatalog();
    } catch (error: unknown) {
      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const errorMessage = error instanceof Error ? error.message : null;
      setSyncNotice(responseMessage || errorMessage || 'No se pudo sincronizar el catálogo Falabella');
    } finally {
      setIsFalabellaCatalogSyncing(false);
    }
  };

  const toggleSkuSelection = (sku: string) => {
    setSelectedSkus((current) =>
      current.includes(sku) ? current.filter((item) => item !== sku) : [...current, sku],
    );
  };

  const toggleAllVisible = () => {
    const visibleSkus = catalog.items.map((item) => item.sku);
    const allSelected = visibleSkus.every((sku) => selectedSkus.includes(sku));

    setSelectedSkus((current) => {
      if (allSelected) {
        return current.filter((sku) => !visibleSkus.includes(sku));
      }

      return Array.from(new Set([...current, ...visibleSkus]));
    });
  };

  const syncFormWithSelection = useCallback((product: ProductDetailResponse, marketplace: MarketplaceKey) => {
    const detail = product.marketplaceDetails[marketplace];
    const configuration = detail.payload?.configuration || {};
    const mainImageUrl = detail.imageUrl || configuration.imageUrl || '';

    setFormState({
      title: detail.title || product.name,
      // MeLi → texto plano; resto de canales → HTML (descripción real de Odoo).
      description: marketplace === 'mercadolibre'
        ? stripHtml(product.description || detail.description || '')
        : product.description || detail.description || '',
      price: detail.price !== null ? String(priceWithIva(detail.price)) : String(priceWithIva(product.price)),
      status: detail.status || 'draft',
      imageUrl: mainImageUrl,
      imageUrls: imageUrlsToMultiline(
        configuration.images,
        configuration.pictures,
        configuration.medias,
        configuration.imageUrl,
        detail.imageUrl,
      ),
      falabellaPrimaryCategory: String(configuration.primaryCategory || ''),
      falabellaCategories: String(configuration.categories || ''),
      falabellaBrand: String(configuration.brand || ''),
      falabellaProductId: String(configuration.productId || ''),
      falabellaOperatorCode: String(configuration.operatorCode || 'facl'),
      falabellaProductData: attributesToMultiline(
        Array.isArray(configuration.productData)
          ? configuration.productData
          : Object.entries(configuration.productData || {}).map(([key, value]) => ({ key, value: String(value) })),
      ),
      meliCategoryId: String(configuration.categoryId || ''),
      meliListingTypeId: String(configuration.listingTypeId || 'gold_special'),
      meliCondition: String(configuration.condition || 'new'),
      meliCurrencyId: String(configuration.currencyId || 'CLP'),
      meliAttributes: attributesToMultiline(configuration.attributes),
      walmartCategory: String(configuration.category || ''),
      walmartBrand: String(configuration.brand || ''),
      walmartGtin: String(configuration.gtin || ''),
      walmartAttributes: attributesToMultiline(configuration.attributes),
      parisFamilyId: String(configuration.familyId || ''),
      parisCategory: String(configuration.category || ''),
      parisBrand: String(configuration.brand || ''),
      parisProductAttributes: attributesToMultiline(configuration.productAttributes),
      parisVariantAttributes: attributesToMultiline(configuration.variantAttributes),
      parisMediaName: String(configuration.mediaName || ''),
      ripleyCategoryCode: String(configuration.categoryCode || configuration.category || ''),
      ripleyBrand: String(configuration.brand || ''),
      ripleyThumbnailUrl: String(configuration.thumbnailUrl || ''),
      ripleyVariantId: String(configuration.variantId || product.sku),
      ripleyLeadtimeToShip: String(configuration.leadtimeToShip || ''),
      ripleyAttributes: attributesToMultiline(configuration.additionalAttributes),
    });
  }, []);

  const loadProductDetail = useCallback(async (sku: string, preferredMarketplace?: MarketplaceKey) => {
    setIsDetailPanelOpen(true);
    setIsDetailLoading(true);
    setDetailError(null);
    setDetailNotice(null);

    try {
      const { data } = await axiosInstance.get<ProductDetailResponse>(`/catalog/products/${sku}`, { timeout: 30000 });
      const marketplace = preferredMarketplace || selectedMarketplace;
      setSelectedProduct(data);
      setSelectedMarketplace(marketplace);
      syncFormWithSelection(data, marketplace);
      setShowAdvancedConfig(false);
    } catch (error: any) {
      setDetailError(error.response?.data?.message || error.message || 'No se pudo cargar el detalle del producto');
    } finally {
      setIsDetailLoading(false);
    }
  }, [selectedMarketplace, syncFormWithSelection]);

  const handleImportExcel = useCallback(async () => {
    if (!importFile) return;
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    setImportJobStatus(null);
    try {
      const form = new FormData();
      form.append('file', importFile);
      const { data } = await axiosInstance.post<BulkImportUploadResponse>(
        '/bulk-import/upload',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 },
      );
      setImportResult(data);
      const marketplaces = Object.fromEntries(
        data.order.map((marketplace) => [
          marketplace,
          {
            status: data.products[marketplace] > 0 ? 'pending' : 'skipped',
            total: data.products[marketplace] || 0,
            processed: 0,
            success: 0,
            failed: 0,
            errors: [],
          },
        ]),
      ) as unknown as Record<BulkImportMarketplaceKey, BulkImportMarketplaceProgress>;
      setImportJobStatus({
        ok: true,
        jobId: data.jobId,
        filename: importFile.name,
        status: 'pending',
        marketplaces,
      });
    } catch (err: any) {
      setImportError(err?.response?.data?.message || err?.message || 'Error al importar');
    } finally {
      setIsImporting(false);
    }
  }, [
    importFile,
  ]);

  useEffect(() => {
    if (!importResult?.jobId || importJobStatus?.status === 'completed' || importJobStatus?.status === 'failed') {
      return;
    }

    let cancelled = false;
    let catalogRefreshed = false;

    const pollStatus = async () => {
      try {
        const { data } = await axiosInstance.get<BulkImportStatusResponse>(
          `/bulk-import/${importResult.jobId}/status`,
          { timeout: 30000 },
        );
        if (cancelled) return;
        setImportJobStatus(data);

        if (data.status === 'completed' && !catalogRefreshed) {
          catalogRefreshed = true;
          await loadCatalog();
          if (selectedProduct) {
            await loadProductDetail(selectedProduct.sku, selectedMarketplace);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setImportError(err?.response?.data?.message || err?.message || 'No se pudo consultar el estado de la importación');
        }
      }
    };

    void pollStatus();
    const interval = window.setInterval(() => void pollStatus(), 4000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    importResult?.jobId,
    importJobStatus?.status,
    loadCatalog,
    loadProductDetail,
    selectedMarketplace,
    selectedProduct,
  ]);

  const handleMarketplaceSelect = (marketplace: MarketplaceKey) => {
    if (!selectedProduct) {
      return;
    }

    setSelectedMarketplace(marketplace);
    syncFormWithSelection(selectedProduct, marketplace);
    setShowAdvancedConfig(false);
  };

  const handleSaveDraft = async () => {
    if (!selectedProduct) {
      return;
    }

    setIsSaving(true);
    setDetailError(null);
    setDetailNotice(null);

    try {
      const payload: Record<string, any> = {};
      const imageUrls = parseImageUrls(formState.imageUrls);
      const primaryImageUrl = formState.imageUrl.trim() || imageUrls[0] || '';

      if (selectedMarketplace === 'falabella') {
        payload.configuration = {
          primaryCategory: formState.falabellaPrimaryCategory.trim(),
          categories: formState.falabellaCategories.trim(),
          brand: formState.falabellaBrand.trim() || 'HyperPC',
          productId: formState.falabellaProductId.trim(),
          operatorCode: formState.falabellaOperatorCode.trim() || 'facl',
          productData: Object.fromEntries(
            parseLinesToAttributes(formState.falabellaProductData).map((attribute) => [attribute.key, attribute.value]),
          ),
          imageUrl: primaryImageUrl,
          images: imageUrls.length ? imageUrls : primaryImageUrl ? [primaryImageUrl] : [],
        };
      }

      if (selectedMarketplace === 'mercadolibre') {
        payload.configuration = {
          categoryId: formState.meliCategoryId.trim(),
          listingTypeId: formState.meliListingTypeId.trim() || 'gold_special',
          condition: formState.meliCondition.trim() || 'new',
          currencyId: formState.meliCurrencyId.trim() || 'CLP',
          imageUrl: primaryImageUrl,
          pictures: (imageUrls.length ? imageUrls : primaryImageUrl ? [primaryImageUrl] : []).map((source) => ({ source })),
          attributes: parseLinesToAttributes(formState.meliAttributes).map((attribute) => ({
            id: attribute.key,
            value_name: attribute.value,
          })),
        };
      }

      if (selectedMarketplace === 'walmart') {
        payload.configuration = {
          category: formState.walmartCategory.trim(),
          brand: formState.walmartBrand.trim() || 'HyperPC',
          gtin: formState.walmartGtin.trim(),
          attributes: Object.fromEntries(
            parseLinesToAttributes(formState.walmartAttributes).map((attribute) => [attribute.key, attribute.value]),
          ),
        };
      }

      if (selectedMarketplace === 'paris') {
        payload.configuration = {
          familyId: formState.parisFamilyId.trim(),
          category: formState.parisCategory.trim(),
          brand: formState.parisBrand.trim(),
          productAttributes: parseLinesToAttributes(formState.parisProductAttributes).map((attribute) => ({
            id: attribute.key,
            value: attribute.value,
          })),
          variantAttributes: parseLinesToAttributes(formState.parisVariantAttributes).map((attribute) => ({
            id: attribute.key,
            value: attribute.value,
          })),
          mediaName: formState.parisMediaName.trim() || formState.title.trim() || selectedProduct.name,
          imageUrl: primaryImageUrl,
          images: imageUrls.length ? imageUrls : primaryImageUrl ? [primaryImageUrl] : [],
          medias: (imageUrls.length ? imageUrls : primaryImageUrl ? [primaryImageUrl] : []).map((src, index) => ({
            position: index + 1,
            src,
            name: formState.parisMediaName.trim() || formState.title.trim() || selectedProduct.name,
          })),
        };
      }

      if (selectedMarketplace === 'ripley') {
        payload.configuration = {
          categoryCode: formState.ripleyCategoryCode.trim(),
          brand: formState.ripleyBrand.trim(),
          thumbnailUrl: formState.ripleyThumbnailUrl.trim(),
          variantId: formState.ripleyVariantId.trim() || selectedProduct.sku,
          leadtimeToShip: formState.ripleyLeadtimeToShip.trim(),
          imageUrl: primaryImageUrl,
          images: imageUrls.length ? imageUrls : primaryImageUrl ? [primaryImageUrl] : [],
          additionalAttributes: parseLinesToAttributes(formState.ripleyAttributes),
        };
      }

      await axiosInstance.put(`/catalog/products/${selectedProduct.sku}/marketplaces/${selectedMarketplace}`, {
        title: formState.title.trim(),
        description: formState.description.trim(),
        price: Math.round(Number(formState.price) / IVA_RATE),
        status: formState.status,
        imageUrl: primaryImageUrl || undefined,
        payload: Object.keys(payload).length ? payload : undefined,
        existsInMarketplace: selectedProduct.marketplaceDetails[selectedMarketplace].existsInMarketplace,
      });

      await loadProductDetail(selectedProduct.sku, selectedMarketplace);
      await loadCatalog();
    } catch (error: any) {
      setDetailError(error.response?.data?.message || error.message || 'No se pudo guardar el borrador');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishChannel = async () => {
    if (!selectedProduct) {
      return;
    }
    if (isMarketplacePublished(selectedProduct.marketplaceDetails[selectedMarketplace])) {
      setDetailNotice('Este canal ya está publicado. Puedes editar datos y guardar cambios, pero no volver a publicarlo desde aquí.');
      return;
    }

    setIsPublishing(true);
    setDetailError(null);
    setDetailNotice(null);

    try {
      const { data } = await axiosInstance.post(`/catalog/products/${selectedProduct.sku}/marketplaces/${selectedMarketplace}/publish`);
      setDetailNotice(data?.message || 'Canal preparado');
      await loadProductDetail(selectedProduct.sku, selectedMarketplace);
      await loadCatalog();
    } catch (error: any) {
      setDetailError(error.response?.data?.message || error.message || 'No se pudo preparar el canal');
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleBulkUpdateMarketplace = (marketplace: MarketplaceKey) => {
    const isSelected = bulkUpdateMarketplaces.includes(marketplace);
    setBulkUpdateMarketplaces((current) =>
      isSelected ? current.filter((item) => item !== marketplace) : [...current, marketplace],
    );
    if (!isSelected) {
      setExpandedBulkUpdateMarketplaces((current) =>
        current.includes(marketplace) ? current : [...current, marketplace],
      );
      setBulkUpdateFieldsByMarketplace((current) => ({
        ...current,
        [marketplace]: current[marketplace]?.length
          ? current[marketplace]
          : BULK_UPDATE_FIELDS_BY_MARKETPLACE[marketplace],
      }));
    }
  };

  const toggleBulkUpdateMarketplaceExpanded = (marketplace: MarketplaceKey) => {
    setExpandedBulkUpdateMarketplaces((current) =>
      current.includes(marketplace)
        ? current.filter((item) => item !== marketplace)
        : [...current, marketplace],
    );
  };

  const toggleBulkUpdateField = (marketplace: MarketplaceKey, field: BulkUpdateField) => {
    setBulkUpdateFieldsByMarketplace((current) => {
      const currentFields = current[marketplace] || [];
      const nextFields = currentFields.includes(field)
        ? currentFields.filter((item) => item !== field)
        : [...currentFields, field];
      return { ...current, [marketplace]: nextFields };
    });
  };

  const runBulkAction = async (dryRun: boolean, options?: { skus?: string[]; marketplaces?: MarketplaceKey[]; forceUpdate?: boolean }) => {
    const targetSkus = options?.skus?.length ? options.skus : selectedSkus;
    const targetMarketplaces = options?.marketplaces?.length ? options.marketplaces : bulkMarketplaces;
    const skipExisting = options?.forceUpdate ? false : !bulkForceUpdate;

    if (targetSkus.length === 0 || targetMarketplaces.length === 0) {
      return;
    }

    setIsBulkSubmitting(true);
    setBulkError(null);
    setBulkNotice(null);

    try {
      const { data } = await axiosInstance.post<BulkPublishResponse>(
        '/catalog/products/bulk-publish',
        {
          skus: targetSkus,
          marketplaces: targetMarketplaces,
          batchSize: bulkBatchSize,
          dryRun,
          skipExisting,
        },
        { timeout: 120000 },
      );

      setBulkResults(data.results || []);
      setBulkNotice(
        dryRun
          ? `Validación completada para ${data.requested || targetSkus.length} SKU(s)`
          : `Publicación preparada para ${data.requested || targetSkus.length} SKU(s)`,
      );
      await loadCatalog();
      if (selectedProduct) {
        await loadProductDetail(selectedProduct.sku, selectedMarketplace);
      }
    } catch (error: any) {
      setBulkError(error.response?.data?.message || error.message || 'No se pudo ejecutar la publicación masiva');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const runBulkUpdateAction = async () => {
    const marketplaces = Object.fromEntries(
      bulkUpdateMarketplaces
        .map((marketplace) => [marketplace, bulkUpdateFieldsByMarketplace[marketplace] || []])
        .filter(([, fields]) => Array.isArray(fields) && fields.length > 0),
    );

    if (selectedSkus.length === 0 || Object.keys(marketplaces).length === 0) {
      return;
    }

    setIsBulkSubmitting(true);
    setBulkError(null);
    setBulkNotice(null);

    try {
      const { data } = await axiosInstance.post<BulkUpdateResponse>(
        '/catalog/products/bulk-update',
        {
          skus: selectedSkus,
          marketplaces,
        },
        { timeout: 180000 },
      );

      setBulkResults(data.results || []);
      setBulkNotice(
        `Actualización completada: ${data.updated || 0} OK, ${data.failed || 0} fallidos, ${data.skipped || 0} omitidos`,
      );
      await loadCatalog();
      if (selectedProduct) {
        await loadProductDetail(selectedProduct.sku, selectedMarketplace);
      }
    } catch (error: any) {
      setBulkError(error.response?.data?.message || error.message || 'No se pudo ejecutar la actualización masiva');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(catalog.total / catalog.limit || 1));
  const productsWithImage = catalog.items.filter((product) => product.hasImage).length;
  const categoryOptions = Array.from(
    new Set(catalog.items.map((product) => product.category).filter((category): category is string => Boolean(category))),
  ).sort((a, b) => a.localeCompare(b));

  // Estado global del producto: publicado (al menos 1 marketplace), con error, no publicado
  const getProductGlobalStatus = (product: CatalogProduct): 'published' | 'error' | 'unpublished' => {
    if (product.publications.some((p) => p.status === 'error')) return 'error';
    if (product.publications.some((p) => p.status === 'published' || p.status === 'processing')) return 'published';
    return 'unpublished';
  };

  const filteredItems = statusFilter === 'all'
    ? catalog.items
    : catalog.items.filter((product) => getProductGlobalStatus(product) === statusFilter);

  const statusCounts = {
    published: catalog.items.filter((p) => getProductGlobalStatus(p) === 'published').length,
    unpublished: catalog.items.filter((p) => getProductGlobalStatus(p) === 'unpublished').length,
    error: catalog.items.filter((p) => getProductGlobalStatus(p) === 'error').length,
  };
  const hasBulkUpdateFieldsSelected = bulkUpdateMarketplaces.some(
    (marketplace) => (bulkUpdateFieldsByMarketplace[marketplace] || []).length > 0,
  );

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={catalog.items.length > 0 && catalog.items.every((item) => selectedSkus.includes(item.sku))}
          onClick={(event) => event.stopPropagation()}
          onChange={toggleAllVisible}
          aria-label="Seleccionar visibles"
          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
        />
      ),
      width: '56px',
      align: 'center' as const,
      render: (product: CatalogProduct) => (
        <input
          type="checkbox"
          checked={selectedSkus.includes(product.sku)}
          onClick={(event) => event.stopPropagation()}
          onChange={() => toggleSkuSelection(product.sku)}
          aria-label={`Seleccionar ${product.sku}`}
          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
        />
      ),
    },
    {
      key: 'image',
      header: 'Imagen',
      width: '96px',
      render: (product: CatalogProduct) => (
        <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
          {product.imageThumbBase64 ? (
            <img
              src={`data:image/png;base64,${product.imageThumbBase64}`}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : product.hasImage ? (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-800">Foto</span>
          ) : (
            <div className="flex flex-col items-center justify-center gap-0.5 text-amber-500" title="Falta imagen">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[9px] font-semibold leading-none">Falta</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (product: CatalogProduct) => (
        <div>
          <p className="font-mono text-sm font-semibold text-gray-900 underline-offset-2 group-hover:underline">{product.sku}</p>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Producto',
      render: (product: CatalogProduct) => (
        <div className="min-w-[260px] max-w-[340px]">
          <p className="font-medium text-gray-900 truncate underline-offset-2 group-hover:underline">{product.name}</p>
          <p className="text-xs text-gray-500 truncate">{product.category || 'Sin categoría'}</p>
        </div>
      ),
    },
    {
      key: 'priceIva',
      header: 'Precio + IVA',
      align: 'right' as const,
      render: (product: CatalogProduct) => <span className="font-medium text-green-700">{formatCurrency(priceWithIva(product.price))}</span>,
    },
    {
      key: 'stock',
      header: (
        <button
          type="button"
          onClick={() => setStockSort((prev) => prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none')}
          className="inline-flex items-center gap-1 hover:text-gray-900"
        >
          Stock
          {stockSort === 'desc' && <ChevronDown className="w-3 h-3" />}
          {stockSort === 'asc' && <ChevronDown className="w-3 h-3 rotate-180" />}
        </button>
      ),
      align: 'center' as const,
      render: (product: CatalogProduct) => {
        const stockLevel = product.stock <= 1 ? 'critical' : product.stock < 5 ? 'low' : 'ok';
        const tooltip = stockLevel === 'critical' ? 'Stock crítico' : stockLevel === 'low' ? 'Stock bajo' : '';
        return (
          <div className="inline-flex items-center gap-2" title={tooltip}>
            {stockLevel !== 'ok' && <AlertTriangle className={`w-4 h-4 ${stockLevel === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />}
            <span className={`font-semibold ${stockLevel === 'critical' ? 'text-red-700' : stockLevel === 'low' ? 'text-amber-700' : 'text-gray-900'}`}>{product.stock}</span>
          </div>
        );
      },
    },
    ...(marketplaceFilter !== 'all' ? MARKETPLACES.filter((m) => m === marketplaceFilter) : MARKETPLACES).map((marketplace) => ({
      key: marketplace,
      header: MARKETPLACE_LABELS[marketplace],
      align: 'center' as const,
      render: (product: CatalogProduct) => {
        const publication = product.publications.find((entry) => entry.marketplace === marketplace);
        const meta = publication
          ? getEffectiveStatusMeta(publication)
          : STATUS_META.missing;

        return (
          <div className="flex flex-col items-center gap-1">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {product.stock === 0 && <Badge variant="warning">Sin stock</Badge>}
          </div>
        );
      },
    })),
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Catálogo maestro</p>
        <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">Productos</h1>
      </div>

      <div className="sticky top-[52px] sm:top-[60px] z-10 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-3 space-y-4 border-b border-black/5 bg-[#f6f3ee]/95 backdrop-blur-md">
      <Card bodyClassName="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
        <div className="flex-1 relative max-w-2xl">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar por SKU o nombre..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-col items-stretch gap-3 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="rounded-full bg-gray-100 px-3 py-1.5">Productos: {catalog.total}</span>
          <span className="rounded-full bg-blue-100 px-3 py-1.5 text-blue-800">Con foto: {productsWithImage}</span>
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">Seleccionados: {selectedSkus.length}</span>
          {SHOW_CREAR_MASIVO && (
          <Button
            variant="secondary"
            className="gap-2"
            disabled={selectedSkus.length === 0}
            onClick={() => {
              setBulkResults([]);
              setBulkNotice(null);
              setBulkError(null);
              setIsBulkModalOpen(true);
            }}
          >
            <Rocket className="w-4 h-4" />
            Crear masivo
          </Button>
          )}
          <Button
            variant="secondary"
            className="gap-2"
            disabled={selectedSkus.length === 0}
            onClick={() => {
              setBulkResults([]);
              setBulkNotice(null);
              setBulkError(null);
              setIsBulkUpdateModalOpen(true);
              void refreshSelectedMarketplaceStatus(selectedSkus);
            }}
          >
            <Upload className="w-4 h-4" />
            Actualizar masivo
          </Button>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => {
              setImportFile(null);
              setImportResult(null);
              setImportJobStatus(null);
              setImportError(null);
              setIsImportModalOpen(true);
            }}
          >
            <Upload className="w-4 h-4" />
            Importar Excel
          </Button>
        </div>
      </Card>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {([
            { key: 'all', label: 'Todos', count: catalog.items.length },
            { key: 'published', label: 'Publicado', count: statusCounts.published },
            { key: 'unpublished', label: 'No publicado', count: statusCounts.unpublished },
            { key: 'error', label: 'Con error', count: statusCounts.error },
          ] as const).map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                statusFilter === key
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex flex-wrap items-center gap-2">
          {([
            { key: 'all', label: 'Todo stock' },
            { key: 'with_stock', label: 'Con stock' },
            { key: 'no_stock', label: 'Sin stock' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStockFilter(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                stockFilter === key
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="all">Todas las categorías</option>
          {categoryFilter !== 'all' && !categoryOptions.includes(categoryFilter) && (
            <option value={categoryFilter}>{categoryFilter}</option>
          )}
          {categoryOptions.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          value={marketplaceFilter}
          onChange={(e) => setMarketplaceFilter(e.target.value)}
          className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="all">Todos los marketplaces</option>
          {MARKETPLACES.map((mp) => (
            <option key={mp} value={mp}>{mp.charAt(0).toUpperCase() + mp.slice(1)}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void syncMarketplaceStatus()}
          disabled={isSyncing || isLoading || catalog.items.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar marketplaces'}
        </button>
        <button
          type="button"
          onClick={() => void syncFalabellaCatalogStatus()}
          disabled={isFalabellaCatalogSyncing || isLoading}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFalabellaCatalogSyncing ? 'animate-spin' : ''}`} />
          {isFalabellaCatalogSyncing ? 'Sincronizando Falabella...' : 'Sincronizar catálogo Falabella'}
        </button>
      </div>
      </div>
      {syncNotice && (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          {syncNotice}
        </div>
      )}

      <Card className="overflow-hidden">
        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
        ) : isLoading ? (
          <div className="py-12 text-center text-sm text-gray-500">Cargando productos...</div>
        ) : (
          <>
            <Table
              columns={columns}
              data={filteredItems}
              emptyMessage="No hay productos para este filtro"
              className="pb-3 overflow-x-scroll"
              rowClassName="group"
              onRowClick={(product) => void loadProductDetail(product.sku)}
            />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando {(catalog.page - 1) * catalog.limit + 1} a {Math.min(catalog.page * catalog.limit, catalog.total)} de {catalog.total} productos
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={catalog.page <= 1}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">{catalog.page} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={catalog.page >= totalPages}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {isBulkModalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/35" onClick={() => setIsBulkModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Publicación masiva</p>
                  <h2 className="text-lg font-semibold text-gray-950">Botón inteligente</h2>
                </div>
                <button
                  onClick={() => setIsBulkModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid flex-1 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
                    <p><span className="font-semibold text-gray-950">SKU seleccionados:</span> {selectedSkus.length}</p>
                    <p>
                      <span className="font-semibold text-gray-950">Modo:</span>{' '}
                      {bulkForceUpdate
                        ? 'publicar/actualizar TODOS los SKUs (incluye los que ya existen).'
                        : 'solo publicar los que no existan ya en el canal (los existentes se saltan).'}
                    </p>
                    <p><span className="font-semibold text-gray-950">Lote:</span> el sistema procesa por tandas para no saturar los marketplaces.</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-950 mb-3">Canales a publicar</p>
                    <div className="space-y-2">
                      {MARKETPLACES.map((marketplace) => {
                        const checked = bulkMarketplaces.includes(marketplace);
                        return (
                          <label key={marketplace} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2.5 cursor-pointer hover:border-gray-300">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{MARKETPLACE_LABELS[marketplace]}</p>
                              <p className="text-xs text-gray-500">Usa la configuración guardada del canal y la imagen URL del borrador.</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setBulkMarketplaces((current) => checked ? current.filter((item) => item !== marketplace) : [...current, marketplace])}
                              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño de lote</label>
                    <Input
                      type="number"
                      value={String(bulkBatchSize)}
                      onChange={(e) => setBulkBatchSize(Math.max(1, Math.min(100, Number(e.target.value || 50))))}
                      placeholder="50"
                    />
                    <p className="mt-1 text-xs text-gray-500">Recomendado: 50. Máximo permitido: 100.</p>
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 cursor-pointer hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={bulkForceUpdate}
                      onChange={(e) => setBulkForceUpdate(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">Forzar actualización</p>
                      <p className="text-xs text-gray-500">Re-publica también los SKUs que ya existen en el marketplace (equivale a update).</p>
                    </div>
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={() => void runBulkAction(true)}
                      disabled={isBulkSubmitting || selectedSkus.length === 0 || bulkMarketplaces.length === 0}
                    >
                      <Search className="w-4 h-4" />
                      Verificar
                    </Button>
                    <Button
                      className="gap-2"
                      onClick={() => void runBulkAction(false)}
                      disabled={isBulkSubmitting || selectedSkus.length === 0 || bulkMarketplaces.length === 0}
                      isLoading={isBulkSubmitting}
                    >
                      <Rocket className="w-4 h-4" />
                      Publicar
                    </Button>
                  </div>
                </div>

                <div className="min-h-[320px] space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-950">Resultado</p>
                    <p className="mt-1 text-xs text-gray-500">El sistema valida cada SKU, revisa si el canal ya lo tiene publicado y solo procesa los que estén listos.</p>
                  </div>

                  {bulkNotice && <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{bulkNotice}</div>}
                  {bulkError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{bulkError}</div>}

                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    {bulkResults.length === 0 ? (
                      <div className="px-4 py-12 text-center text-sm text-gray-500">
                        Ejecuta una verificación o publicación para ver el detalle por SKU.
                      </div>
                    ) : (
                      <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-200">
                        {bulkResults.map((result) => (
                          <div key={result.sku} className="p-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-mono text-sm font-semibold text-gray-950">{result.sku}</p>
                                <p className="text-xs text-gray-500">{result.message}</p>
                              </div>
                              <Badge variant={resultStatusMeta(result.status).variant}>{resultStatusMeta(result.status).label}</Badge>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              {result.marketplaces.map((entry) => {
                                const missing = entry.payload?.missingFields || [];
                                return (
                                  <div key={`${result.sku}-${entry.marketplace}`} className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="truncate text-sm font-medium text-gray-900">{MARKETPLACE_LABELS[entry.marketplace]}</span>
                                      <Badge variant={resultStatusMeta(entry.status).variant}>{resultStatusMeta(entry.status).label}</Badge>
                                    </div>
                                    {missing.length > 0 ? (
                                      <div className="mt-2 space-y-1.5">
                                        <p className="text-xs font-medium text-amber-700">Faltan:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {missing.map((field) => (
                                            <span key={field} className="break-words rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                                              {friendlyFieldName(field)}
                                            </span>
                                          ))}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsBulkModalOpen(false);
                                            setIsBulkUpdateModalOpen(false);
                                            setIsProductPublishModalOpen(false);
                                            void loadProductDetail(result.sku, entry.marketplace);
                                          }}
                                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 underline-offset-2 hover:underline"
                                        >
                                          <Settings className="h-3 w-3" /> Configurar {MARKETPLACE_LABELS[entry.marketplace]}
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="mt-1 whitespace-normal break-words text-xs text-gray-500">{entry.message}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal actualización masiva */}
      {isBulkUpdateModalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/35" onClick={() => setIsBulkUpdateModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Actualización masiva</p>
                  <h2 className="text-lg font-semibold text-gray-950">Actualizar productos en marketplaces</h2>
                  {isBulkStatusRefreshing && (
                    <p className="mt-1 text-xs text-gray-500">Verificando estado real en los marketplaces…</p>
                  )}
                </div>
                <button
                  onClick={() => setIsBulkUpdateModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid flex-1 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
                    <p><span className="font-semibold text-gray-950">SKU seleccionados:</span> {selectedSkus.length}</p>
                    <p><span className="font-semibold text-gray-950">Modo:</span> elige por marketplace qué datos quieres actualizar en cada canal.</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-950 mb-3">Canales a actualizar</p>
                    <div className="space-y-3">
                      {MARKETPLACES.map((marketplace) => {
                        const checked = bulkUpdateMarketplaces.includes(marketplace);
                        const expanded = expandedBulkUpdateMarketplaces.includes(marketplace);
                        const selectedFields = bulkUpdateFieldsByMarketplace[marketplace] || [];
                        const availableFields = BULK_UPDATE_FIELDS_BY_MARKETPLACE[marketplace];
                        return (
                          <div key={marketplace} className="rounded-xl border border-gray-200 bg-white">
                            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                              <button
                                type="button"
                                onClick={() => toggleBulkUpdateMarketplaceExpanded(marketplace)}
                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                              >
                                <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-gray-900">{MARKETPLACE_LABELS[marketplace]}</span>
                                  <span className="block truncate text-xs text-gray-500">
                                    {checked && selectedFields.length
                                      ? selectedFields.map((field) => BULK_UPDATE_FIELD_LABELS[field]).join(', ')
                                      : checked
                                        ? 'Selecciona al menos un dato'
                                        : 'No seleccionado'}
                                  </span>
                                </span>
                              </button>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleBulkUpdateMarketplace(marketplace)}
                                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                              />
                            </div>
                            {expanded && (
                              <div className="border-t border-gray-100 px-3 py-3">
                                <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-gray-500">Datos a actualizar</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {availableFields.map((field) => (
                                    <label
                                      key={`${marketplace}-${field}`}
                                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm ${
                                        checked ? 'cursor-pointer border-gray-200 hover:border-gray-300' : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedFields.includes(field)}
                                        disabled={!checked}
                                        onChange={() => toggleBulkUpdateField(marketplace, field)}
                                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 disabled:opacity-50"
                                      />
                                      <span>{BULK_UPDATE_FIELD_LABELS[field]}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Button
                      className="gap-2"
                      onClick={() => void runBulkUpdateAction()}
                      disabled={isBulkSubmitting || selectedSkus.length === 0 || bulkUpdateMarketplaces.length === 0 || !hasBulkUpdateFieldsSelected}
                      isLoading={isBulkSubmitting}
                    >
                      <Upload className="w-4 h-4" />
                      Actualizar
                    </Button>
                  </div>
                </div>

                <div className="min-h-[320px] space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-950">Resultado</p>
                    <p className="mt-1 text-xs text-gray-500">Verifica y actualiza los productos seleccionados en los canales marcados.</p>
                  </div>

                  {bulkNotice && <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{bulkNotice}</div>}
                  {bulkError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{bulkError}</div>}

                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    {bulkResults.length === 0 ? (
                      <div className="px-4 py-12 text-center text-sm text-gray-500">
                        Ejecuta una actualización para ver el detalle por SKU.
                      </div>
                    ) : (
                      <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-200">
                        {bulkResults.map((result) => (
                          <div key={result.sku} className="p-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-mono text-sm font-semibold text-gray-950">{result.sku}</p>
                                <p className="text-xs text-gray-500">{result.message}</p>
                              </div>
                              <Badge variant={resultStatusMeta(result.status).variant}>{resultStatusMeta(result.status).label}</Badge>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              {result.marketplaces.map((entry) => {
                                const missing = entry.payload?.missingFields || [];
                                return (
                                  <div key={`${result.sku}-${entry.marketplace}`} className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="truncate text-sm font-medium text-gray-900">{MARKETPLACE_LABELS[entry.marketplace]}</span>
                                      <Badge variant={resultStatusMeta(entry.status).variant}>{resultStatusMeta(entry.status).label}</Badge>
                                    </div>
                                    {missing.length > 0 ? (
                                      <div className="mt-2 space-y-1.5">
                                        <p className="text-xs font-medium text-amber-700">Faltan:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {missing.map((field) => (
                                            <span key={field} className="break-words rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                                              {friendlyFieldName(field)}
                                            </span>
                                          ))}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsBulkModalOpen(false);
                                            setIsBulkUpdateModalOpen(false);
                                            setIsProductPublishModalOpen(false);
                                            void loadProductDetail(result.sku, entry.marketplace);
                                          }}
                                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 underline-offset-2 hover:underline"
                                        >
                                          <Settings className="h-3 w-3" /> Configurar {MARKETPLACE_LABELS[entry.marketplace]}
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="mt-1 whitespace-normal break-words text-xs text-gray-500">{entry.message}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isProductPublishModalOpen && selectedProduct && (
        <>
          <div className="fixed inset-0 z-50 bg-black/35" onClick={() => setIsProductPublishModalOpen(false)} />
          <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="flex h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Producto individual</p>
                  <h2 className="text-lg font-semibold text-gray-950">Publicar este producto en canales seleccionados</h2>
                </div>
                <button
                  onClick={() => setIsProductPublishModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-5 sm:p-6">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <p className="font-semibold text-gray-950">{selectedProduct.name}</p>
                  <p className="mt-1 text-xs text-gray-500">{selectedProduct.sku} · selecciona solo los marketplaces que quieras publicar ahora.</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {MARKETPLACES.map((marketplace) => {
                    const checked = productPublishMarketplaces.includes(marketplace);
                    const published = isMarketplacePublished(selectedProduct.marketplaceDetails[marketplace]);
                    return (
                      <label
                        key={marketplace}
                        className={`flex items-center justify-between rounded-xl border px-3 py-3 ${
                          published
                            ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-70'
                            : 'cursor-pointer border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{MARKETPLACE_LABELS[marketplace]}</p>
                          <p className="text-xs text-gray-500">
                            {published
                              ? 'Ya publicado; se omite para evitar republicar.'
                              : 'Usará el borrador/configuración guardada de ese canal.'}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={published}
                          onChange={() => {
                            if (published) return;
                            setProductPublishMarketplaces((current) => checked ? current.filter((item) => item !== marketplace) : [...current, marketplace]);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                        />
                      </label>
                    );
                  })}
                </div>

                {bulkError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{bulkError}</div>}
                {bulkNotice && <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{bulkNotice}</div>}

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <Button variant="secondary" onClick={() => setIsProductPublishModalOpen(false)} disabled={isBulkSubmitting}>Cancelar</Button>
                  <Button
                    className="gap-2"
                    onClick={async () => {
                      await runBulkAction(false, { skus: [selectedProduct.sku], marketplaces: productPublishMarketplaces });
                      setIsProductPublishModalOpen(false);
                    }}
                    disabled={isBulkSubmitting || productPublishMarketplaces.length === 0}
                    isLoading={isBulkSubmitting}
                  >
                    <Rocket className="w-4 h-4" />
                    Publicar canales seleccionados
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {(isDetailPanelOpen || selectedProduct || isDetailLoading) && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/35"
            onClick={() => {
              setIsDetailPanelOpen(false);
              setSelectedProduct(null);
            }}
          />
          <aside className="fixed right-0 top-0 z-50 h-screen w-full overflow-y-auto border-l border-black/10 bg-white shadow-2xl sm:max-w-xl">
            <div className="flex-1 overflow-y-auto p-4 space-y-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Producto</p>
                  <h2 className="text-lg font-semibold text-gray-950">Detalle del producto</h2>
                </div>
                <button
                  onClick={() => {
                    setIsDetailPanelOpen(false);
                    setSelectedProduct(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isDetailLoading && <div className="py-12 text-center text-sm text-gray-500">Cargando detalle del producto...</div>}

              {detailError && !isDetailLoading && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {detailError}
                </div>
              )}

              {selectedProduct && !isDetailLoading && (
                <>
                  {/* CANALES primero: es lo que el operador viene a gestionar.
                      Los datos de Odoo (resumen, atributos) se muestran al final. */}
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-3">Canales</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {MARKETPLACES.map((marketplace) => {
                        const detail = selectedProduct.marketplaceDetails[marketplace];
                        const status = getEffectiveStatusMeta(detail);
                        const validation = VALIDATION_META[detail.validation?.status || 'unknown'];
                        const isSelected = selectedMarketplace === marketplace;
                        const actionLabel = detail.existsInMarketplace || detail.externalProductId ? 'Publicado en canal' : 'Pendiente de publicación';

                        return (
                          <button
                            key={marketplace}
                            onClick={() => handleMarketplaceSelect(marketplace)}
                            className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                              isSelected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold">{MARKETPLACE_LABELS[marketplace]}</span>
                              <Badge variant={isSelected ? 'default' : status.variant}>{status.label}</Badge>
                            </div>
                            <div className={`mt-2 space-y-1 text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                              <p>{actionLabel}</p>
                              <p>{validation.label}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-5 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-950">{MARKETPLACE_LABELS[selectedMarketplace]}</p>
                        <p className="text-xs text-gray-500">
                          {selectedProduct.marketplaceDetails[selectedMarketplace].existsInMarketplace
                            ? 'Producto publicado en este canal'
                            : 'Revisa la información y publica cuando esté listo'}
                        </p>
                      </div>
                      <Badge variant={getEffectiveStatusMeta(selectedProduct.marketplaceDetails[selectedMarketplace]).variant}>
                        {getEffectiveStatusMeta(selectedProduct.marketplaceDetails[selectedMarketplace]).label}
                      </Badge>
                    </div>

                    {/* Aviso simple para el usuario final; el detalle queda en Datos del canal. */}
                    {selectedProduct.marketplaceDetails[selectedMarketplace].validation?.missingFields?.length ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-medium text-amber-800">Este canal requiere información adicional antes de publicar.</p>
                        <p className="text-xs text-amber-600 mt-2">Abre &quot;Datos del canal&quot; para completar la información requerida.</p>
                      </div>
                    ) : null}

                    <Input
                      label="Título"
                      value={formState.title}
                      onChange={(e) => setFormState((current) => ({ ...current, title: e.target.value }))}
                      placeholder="Nombre del producto en este marketplace"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <textarea
                        value={formState.description}
                        onChange={(e) => setFormState((current) => ({ ...current, description: e.target.value }))}
                        rows={4}
                        className="block w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                        placeholder="Descripción del producto"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio + IVA</label>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border-2 border-green-200 rounded-lg text-green-700">
                          <span className="font-semibold">{formState.price ? `$${Math.round(Number(formState.price)).toLocaleString('es-CL')}` : '-'}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900">
                          <span className="font-semibold">{selectedProduct.stock}</span>
                          <span className="text-xs text-gray-500">unidades</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes adicionales</label>
                      {selectedProduct.images && selectedProduct.images.length > 0 ? (
                        <ul className="space-y-1.5 rounded-lg border-2 border-gray-200 bg-white px-4 py-3">
                          {selectedProduct.images.map((url, index) => (
                            <li key={`${url}-${index}`} className="flex items-center gap-2 text-sm min-w-0">
                              <span className="shrink-0">🔗</span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={url}
                                className="truncate text-blue-600 hover:underline"
                              >
                                Imagen {index + 1} — {url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400">
                          Sin imágenes adicionales.
                        </div>
                      )}
                    </div>

                    {/* Datos del canal — colapsable */}
                    <button
                      type="button"
                      onClick={() => setShowAdvancedConfig((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Datos del canal
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedConfig ? 'rotate-180' : ''}`} />
                    </button>

                    {showAdvancedConfig && (
                    <>
                    {selectedMarketplace === 'falabella' && (
                      <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <div>
	                          <p className="text-sm font-semibold text-gray-950">Datos para Falabella</p>
	                          <p className="text-xs text-gray-600 mt-1">Completa la información requerida por este canal.</p>
                        </div>

                        <Input
	                          label="Categoría principal"
                          value={formState.falabellaPrimaryCategory}
                          onChange={(e) => setFormState((current) => ({ ...current, falabellaPrimaryCategory: e.target.value }))}
                          placeholder="4"
                        />

                        <Input
                          label="Categorías adicionales"
                          value={formState.falabellaCategories}
                          onChange={(e) => setFormState((current) => ({ ...current, falabellaCategories: e.target.value }))}
                          placeholder="2,3,5"
                        />

                        <Input
                          label="Marca"
                          value={formState.falabellaBrand}
                          onChange={(e) => setFormState((current) => ({ ...current, falabellaBrand: e.target.value }))}
                          placeholder="HyperPC"
                        />

                        <Input
	                          label="Código del producto"
                          value={formState.falabellaProductId}
                          onChange={(e) => setFormState((current) => ({ ...current, falabellaProductId: e.target.value }))}
                          placeholder="xyzabc"
                        />

                        <Input
	                          label="Código de integración"
                          value={formState.falabellaOperatorCode}
                          onChange={(e) => setFormState((current) => ({ ...current, falabellaOperatorCode: e.target.value }))}
                          placeholder="facl"
                        />

                        <div>
	                          <label className="block text-sm font-medium text-gray-700 mb-1">Características del producto</label>
                          <textarea
                            value={formState.falabellaProductData}
                            onChange={(e) => setFormState((current) => ({ ...current, falabellaProductData: e.target.value }))}
                            rows={4}
                            className="block w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-900 font-mono text-xs placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            placeholder={'Megapixels=490\nSystemMemory=16GB\nNumberCpus=8'}
                          />
                        </div>
                      </div>
                    )}

                    {selectedMarketplace === 'mercadolibre' && (
                      <div className="space-y-4 rounded-2xl border border-yellow-100 bg-yellow-50/70 p-4">
                        <div>
	                          <p className="text-sm font-semibold text-gray-950">Datos para MercadoLibre</p>
	                          <p className="text-xs text-gray-600 mt-1">Completa la información requerida por este canal.</p>
                        </div>

                        <Input
	                          label="Categoría"
                          value={formState.meliCategoryId}
                          onChange={(e) => setFormState((current) => ({ ...current, meliCategoryId: e.target.value }))}
                          placeholder="MLC1648"
                        />

                        <Input
	                          label="Tipo de publicación"
                          value={formState.meliListingTypeId}
                          onChange={(e) => setFormState((current) => ({ ...current, meliListingTypeId: e.target.value }))}
                          placeholder="gold_special"
                        />

                        <Input
	                          label="Condición"
                          value={formState.meliCondition}
                          onChange={(e) => setFormState((current) => ({ ...current, meliCondition: e.target.value }))}
                          placeholder="new"
                        />

                        <Input
	                          label="Moneda"
                          value={formState.meliCurrencyId}
                          onChange={(e) => setFormState((current) => ({ ...current, meliCurrencyId: e.target.value }))}
                          placeholder="CLP"
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Atributos MercadoLibre</label>
                          <textarea
                            value={formState.meliAttributes}
                            onChange={(e) => setFormState((current) => ({ ...current, meliAttributes: e.target.value }))}
                            rows={4}
                            className="block w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-900 font-mono text-xs placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            placeholder={'BRAND=HyperPC\nLINE=Gamer\nMODEL=RTX 4060'}
                          />
                        </div>
                      </div>
                    )}

                    {selectedMarketplace === 'walmart' && (
                      <div className="space-y-4 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
                        <div>
	                          <p className="text-sm font-semibold text-gray-950">Datos para Walmart</p>
	                          <p className="text-xs text-gray-600 mt-1">Completa la información requerida por este canal.</p>
                        </div>

                        <Input
	                          label="Categoría"
                          value={formState.walmartCategory}
                          onChange={(e) => setFormState((current) => ({ ...current, walmartCategory: e.target.value }))}
                          placeholder="Tecnologia"
                        />

                        <Input
                          label="Marca"
                          value={formState.walmartBrand}
                          onChange={(e) => setFormState((current) => ({ ...current, walmartBrand: e.target.value }))}
                          placeholder="HyperPC"
                        />

                        <Input
	                          label="Código de barras"
                          value={formState.walmartGtin}
                          onChange={(e) => setFormState((current) => ({ ...current, walmartGtin: e.target.value }))}
                          placeholder="7801234567890"
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Atributos Walmart</label>
                          <textarea
                            value={formState.walmartAttributes}
                            onChange={(e) => setFormState((current) => ({ ...current, walmartAttributes: e.target.value }))}
                            rows={4}
                            className="block w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-900 font-mono text-xs placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            placeholder={'color=Negro\nsize=XL'}
                          />
                        </div>
                      </div>
                    )}

                    {selectedMarketplace === 'paris' && (
                      <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                        <div>
	                          <p className="text-sm font-semibold text-gray-950">Datos para Paris</p>
	                          <p className="text-xs text-gray-600 mt-1">Completa la información requerida por este canal.</p>
                        </div>

                        <Input
	                          label="Familia"
                          value={formState.parisFamilyId}
                          onChange={(e) => setFormState((current) => ({ ...current, parisFamilyId: e.target.value }))}
                          placeholder="computacion"
                        />

                        <Input
	                          label="Categoría"
                          value={formState.parisCategory}
                          onChange={(e) => setFormState((current) => ({ ...current, parisCategory: e.target.value }))}
                          placeholder="notebooks"
                        />

                        <Input
                          label="Marca"
                          value={formState.parisBrand}
                          onChange={(e) => setFormState((current) => ({ ...current, parisBrand: e.target.value }))}
                          placeholder="HyperPC"
                        />

                        <Input
                          label="Nombre de imagen"
                          value={formState.parisMediaName}
                          onChange={(e) => setFormState((current) => ({ ...current, parisMediaName: e.target.value }))}
                          placeholder="Notebook HyperPC"
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Atributos de producto</label>
                          <textarea
                            value={formState.parisProductAttributes}
                            onChange={(e) => setFormState((current) => ({ ...current, parisProductAttributes: e.target.value }))}
                            rows={4}
                            className="block w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-900 font-mono text-xs placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            placeholder={'marca=HyperPC\nprocesador=Ryzen 7\nram=16GB'}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Atributos de variante</label>
                          <textarea
                            value={formState.parisVariantAttributes}
                            onChange={(e) => setFormState((current) => ({ ...current, parisVariantAttributes: e.target.value }))}
                            rows={3}
                            className="block w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-900 font-mono text-xs placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            placeholder={'color=Negro\ntamano=15 pulgadas'}
                          />
                        </div>
                      </div>
                    )}

                    {selectedMarketplace === 'ripley' && (
                      <div className="space-y-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                        <div>
	                          <p className="text-sm font-semibold text-gray-950">Datos para Ripley</p>
	                          <p className="text-xs text-gray-600 mt-1">Completa la información requerida por este canal.</p>
                        </div>

                        <Input
                          label="Código de categoría"
                          value={formState.ripleyCategoryCode}
                          onChange={(e) => setFormState((current) => ({ ...current, ripleyCategoryCode: e.target.value }))}
                          placeholder="Ej: FO_MP"
                        />

                        <Input
                          label="Marca"
                          value={formState.ripleyBrand}
                          onChange={(e) => setFormState((current) => ({ ...current, ripleyBrand: e.target.value }))}
                          placeholder="Ej: HyperPC"
                        />

                        <Input
	                          label="Imagen miniatura"
                          value={formState.ripleyThumbnailUrl}
                          onChange={(e) => setFormState((current) => ({ ...current, ripleyThumbnailUrl: e.target.value }))}
                          placeholder="https://..."
                        />

                        <Input
	                          label="SKU de variante"
                          value={formState.ripleyVariantId}
                          onChange={(e) => setFormState((current) => ({ ...current, ripleyVariantId: e.target.value }))}
                          placeholder={selectedProduct.sku}
                        />

                        <Input
	                          label="Tiempo de despacho"
                          value={formState.ripleyLeadtimeToShip}
                          onChange={(e) => setFormState((current) => ({ ...current, ripleyLeadtimeToShip: e.target.value }))}
                          placeholder="24hrs"
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Atributos Ripley</label>
                          <textarea
                            value={formState.ripleyAttributes}
                            onChange={(e) => setFormState((current) => ({ ...current, ripleyAttributes: e.target.value }))}
                            rows={4}
                            className="block w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-900 font-mono text-xs placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                            placeholder={'MKP_color_compu=Negro\nMKP_ram_compu=16GB'}
                          />
                        </div>
                      </div>
                    )}

                    <div>
	                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select
                        value={formState.status}
                        onChange={(e) => setFormState((current) => ({ ...current, status: e.target.value as PublicationStatus }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500"
                      >
                        {Object.entries(STATUS_META).map(([value, meta]) => (
                          <option key={value} value={value}>{meta.label}</option>
                        ))}
                      </select>
                    </div>

                    {selectedProduct.marketplaceDetails[selectedMarketplace].externalProductId && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
	                        Código en marketplace: {selectedProduct.marketplaceDetails[selectedMarketplace].externalProductId}
                      </div>
                    )}
                    </>
                    )}
	                    {/* Fin datos del canal */}

                    {SHOW_PUBLISH_BUTTONS && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(() => {
                        const currentDetail = selectedProduct.marketplaceDetails[selectedMarketplace];
                        const published = isMarketplacePublished(currentDetail);
                        const missingData = currentDetail.validation?.status === 'missing_data';

                        return (
                          <button
                            onClick={() => void handlePublishChannel()}
                            disabled={isPublishing || isSaving || published || missingData}
                            title={published ? 'Este canal ya está publicado' : undefined}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Upload className="w-4 h-4" />
                            {isPublishing ? 'Preparando...' : published ? 'Ya publicado' : 'Publicar este canal'}
                          </button>
                        );
                      })()}
                      <button
                        onClick={() => {
                          setProductPublishMarketplaces(
                            MARKETPLACES.filter((marketplace) =>
                              !isMarketplacePublished(selectedProduct.marketplaceDetails[marketplace]),
                            ),
                          );
                          setBulkResults([]);
                          setBulkNotice(null);
                          setBulkError(null);
                          setIsProductPublishModalOpen(true);
                        }}
                        disabled={isPublishing || isSaving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Rocket className="w-4 h-4" />
                        {isPublishing ? 'Preparando...' : 'Publicar este producto en todos los canales'}
                      </button>
                    </div>
                    )}

                    {detailNotice && (
                      <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{detailNotice}</div>
                    )}

                    {detailError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{detailError}</div>
                    )}

                    {SHOW_PUBLISH_BUTTONS && (
                    <div className="flex justify-end pt-1">
                      <Button onClick={() => void handleSaveDraft()} isLoading={isSaving} className="gap-1.5 min-w-40">
                        <Pencil className="w-4 h-4" />
                        Guardar cambios
                      </Button>
                    </div>
                    )}
                  </div>

                  {/* Datos de Odoo (referencia) — al final del panel. */}
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-3">Datos de Odoo</p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                        {selectedProduct.imageBase64 ? (
                          <img src={`data:image/png;base64,${selectedProduct.imageBase64}`} alt={selectedProduct.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        ) : selectedProduct.images?.[0] ? (
                          <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <ImageIcon className="w-7 h-7 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-950">{selectedProduct.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{selectedProduct.sku} · {selectedProduct.category || 'Sin categoría'}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                          <span className="rounded-full bg-white border border-gray-200 px-2.5 py-1">Precio: {formatCurrency(selectedProduct.price)}</span>
                          <span className="rounded-full bg-white border border-gray-200 px-2.5 py-1">Stock: {selectedProduct.stock}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${selectedProduct.hasImage ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                            {!selectedProduct.hasImage && <AlertTriangle className="w-3 h-3" />}
                            {selectedProduct.hasImage ? 'Con foto' : 'Falta imagen'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!selectedProduct.hasImage && (
                    <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Este producto no tiene imágenes cargadas en Odoo. Subí una imagen o agregá las propiedades "Imagen 1", "Imagen 2"… con su URL.</span>
                    </div>
                  )}

                  {selectedProduct.attributes && selectedProduct.attributes.length > 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-3">Atributos del producto</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.attributes.map((attr) => (
                          <span key={attr.attribute} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                            <span className="font-semibold">{attr.attribute}:</span> {attr.values.join(', ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        </>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-3xl max-h-[90vh] flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-950">Importar catálogo desde Excel</h2>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-500 hover:text-gray-900"
                disabled={isImporting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 px-5 py-4">
              <p className="text-sm text-gray-600">
                Carga el Excel maestro y el sistema importará automáticamente la información de cada marketplace incluido en el archivo.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo .xlsx
                </label>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  disabled={isImporting}
                  className="block w-full text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-white hover:file:bg-gray-800"
                />
              </div>

              {importError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {importError}
                </div>
              )}

              {importResult && (
                <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-3 text-sm space-y-2">
                  <div className="rounded-md bg-green-50 border border-green-300 px-3 py-2 text-green-800 font-medium">
                    Excel recibido. Job: <span className="font-mono">{importResult.jobId}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {importResult.order.map((marketplace) => (
                      <span key={marketplace} className="rounded-full bg-gray-200 px-2 py-0.5">
                        {BULK_IMPORT_LABELS[marketplace]}: {importResult.products[marketplace] || 0}
                      </span>
                    ))}
                  </div>
                  {importJobStatus && (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      {importResult.order.map((marketplace) => {
                        const progress = importJobStatus.marketplaces[marketplace];
                        if (!progress) return null;
                        return (
                          <div key={marketplace} className="border-b border-gray-100 px-3 py-3 last:border-b-0">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium text-gray-900">{BULK_IMPORT_LABELS[marketplace]}</p>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${bulkImportStatusClass(progress.status)}`}>
                                {BULK_IMPORT_STATUS_LABELS[progress.status]}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                              <span>Total: {progress.total}</span>
                              <span>Procesados: {progress.processed}</span>
                              <span>OK: {progress.success}</span>
                              <span>Fallidos: {progress.failed}</span>
                            </div>
                            {progress.errors && progress.errors.length > 0 && (
                              <details className="mt-2 rounded-md border border-red-200 bg-red-50">
                                <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-red-700">
                                  Errores ({progress.errors.length})
                                </summary>
                                <ul className="max-h-40 overflow-auto border-t border-red-200 space-y-1 px-3 py-2 text-xs text-red-700">
                                  {progress.errors.map((error, index) => (
                                    <li key={`${error.sku}-${index}`}>
                                      <strong>{error.sku || '-'}</strong>: {error.reason}
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
              <Button
                variant="secondary"
                onClick={() => setIsImportModalOpen(false)}
                disabled={isImporting}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => void handleImportExcel()}
                disabled={!importFile || isImporting}
                isLoading={isImporting}
                className="gap-1.5"
              >
                <Upload className="w-4 h-4" />
                Importar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
