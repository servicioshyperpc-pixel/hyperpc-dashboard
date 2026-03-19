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
  Eye,
  Image as ImageIcon,
  Pencil,
  Rocket,
  Search,
  Settings,
  Store,
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
  productTemplateId: number | null;
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

const MARKETPLACES: MarketplaceKey[] = ['falabella', 'mercadolibre', 'ripley', 'paris', 'walmart'];

const MARKETPLACE_LABELS: Record<MarketplaceKey, string> = {
  falabella: 'Falabella',
  mercadolibre: 'MercadoLibre',
  ripley: 'Ripley',
  paris: 'Paris',
  walmart: 'Walmart',
};

const STATUS_META: Record<PublicationStatus, { label: string; variant: 'success' | 'error' | 'warning' | 'info' | 'default'; helper: string }> = {
  missing: { label: 'Sin preparar', variant: 'default', helper: 'Todavía no hay contenido comercial para este canal.' },
  draft: { label: 'Borrador', variant: 'warning', helper: 'Contenido guardado localmente, pendiente de publicar.' },
  ready: { label: 'Listo', variant: 'info', helper: 'El payload ya quedó preparado por el backend para publicar.' },
  processing: { label: 'Procesando', variant: 'info', helper: 'El marketplace está procesando la publicación de forma asíncrona.' },
  published: { label: 'Publicado', variant: 'success', helper: 'Producto publicado o actualizado en el marketplace.' },
  error: { label: 'Error', variant: 'error', helper: 'Falló la última operación en el marketplace.' },
  disabled: { label: 'Deshabilitado', variant: 'default', helper: 'Este canal no se usará para el SKU.' },
};

const VALIDATION_META: Record<
  'ready' | 'missing_data' | 'exists' | 'unknown',
  { label: string; variant: 'success' | 'error' | 'warning' | 'default'; helper: string }
> = {
  ready: { label: 'Listo para publicar', variant: 'success', helper: 'La configuración mínima está completa.' },
  missing_data: { label: 'Faltan datos', variant: 'error', helper: 'El canal todavía no tiene toda la configuración requerida.' },
  exists: { label: 'Ya existe', variant: 'warning', helper: 'El producto ya figura creado en el marketplace.' },
  unknown: { label: 'Sin verificar', variant: 'default', helper: 'Todavía no se evaluó este canal en forma real.' },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

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

const friendlyFieldName = (raw: string): string => {
  const map: Record<string, string> = {
    'title': 'Título',
    'description': 'Descripción',
    'price': 'Precio',
    'imageUrl': 'URL de imagen',
    'payload.configuration.familyId': 'Family ID (Paris)',
    'payload.configuration.category': 'Categoría',
    'payload.configuration.categoryId': 'Categoría (MeLi)',
    'payload.configuration.categoryCode': 'Categoría (Ripley)',
    'payload.configuration.primaryCategory': 'Categoría principal (Falabella)',
    'payload.configuration.brand': 'Marca',
    'payload.configuration.gtin': 'GTIN / Código de barras',
    'payload.configuration.productId': 'Product ID (Falabella)',
    'payload.configuration.operatorCode': 'Código operador',
    'payload.configuration.listingTypeId': 'Tipo de publicación (MeLi)',
    'payload.configuration.condition': 'Condición',
    'payload.configuration.currencyId': 'Moneda',
    'payload.configuration.variantId': 'Variante ID (Ripley)',
    'payload.configuration.leadtimeToShip': 'Tiempo de envío (Ripley)',
    'payload.configuration.mediaName': 'Nombre media (Paris)',
    'payload.configuration.thumbnailUrl': 'URL miniatura (Ripley)',
    'payload.configuration.productData': 'Atributos producto (Falabella)',
    'payload.configuration.productAttributes': 'Atributos producto (Paris)',
    'payload.configuration.variantAttributes': 'Atributos variante (Paris)',
    'payload.configuration.attributes': 'Atributos',
    'payload.configuration.imageUrl': 'URL de imagen',
  };
  // Try exact match, then strip prefix and try, then humanize the last segment
  if (map[raw]) return map[raw];
  const stripped = raw.replace('payload.configuration.', '');
  if (map[stripped]) return map[stripped];
  // Humanize: camelCase → "Camel Case"
  return stripped.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
};

const emptyForm = {
  title: '',
  description: '',
  price: '',
  status: 'draft' as PublicationStatus,
  imageUrl: '',
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
    limit: 15,
    total: 0,
    marketplaces: MARKETPLACES,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetailResponse | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceKey>('falabella');
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

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const { data } = await axiosInstance.get<CatalogResponse>('/catalog/products', {
        params: {
          search: searchQuery || undefined,
          page: currentPage,
          limit: 15,
        },
      });

      setCatalog(data);
    } catch (error: any) {
      setLoadError(error.response?.data?.message || error.message || 'No se pudo cargar el catálogo de Odoo');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCatalog();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadCatalog]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

    setFormState({
      title: detail.title || product.name,
      description: detail.description || product.description || '',
      price: detail.price !== null ? String(detail.price) : String(product.price || ''),
      status: detail.status || 'draft',
      imageUrl: detail.imageUrl || configuration.imageUrl || '',
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
    setIsDetailLoading(true);
    setDetailError(null);
    setDetailNotice(null);

    try {
      const { data } = await axiosInstance.get<ProductDetailResponse>(`/catalog/products/${sku}`);
      const marketplace = preferredMarketplace || selectedMarketplace;
      setSelectedProduct(data);
      setSelectedMarketplace(marketplace);
      syncFormWithSelection(data, marketplace);
    } catch (error: any) {
      setDetailError(error.response?.data?.message || error.message || 'No se pudo cargar el detalle del producto');
    } finally {
      setIsDetailLoading(false);
    }
  }, [selectedMarketplace, syncFormWithSelection]);

  const handleMarketplaceSelect = (marketplace: MarketplaceKey) => {
    if (!selectedProduct) {
      return;
    }

    setSelectedMarketplace(marketplace);
    syncFormWithSelection(selectedProduct, marketplace);
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
        };
      }

      if (selectedMarketplace === 'mercadolibre') {
        payload.configuration = {
          categoryId: formState.meliCategoryId.trim(),
          listingTypeId: formState.meliListingTypeId.trim() || 'gold_special',
          condition: formState.meliCondition.trim() || 'new',
          currencyId: formState.meliCurrencyId.trim() || 'CLP',
          imageUrl: formState.imageUrl.trim(),
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
          medias: formState.imageUrl.trim()
            ? [{ position: 1, src: formState.imageUrl.trim(), name: formState.parisMediaName.trim() || formState.title.trim() || selectedProduct.name }]
            : [],
        };
      }

      if (selectedMarketplace === 'ripley') {
        payload.configuration = {
          categoryCode: formState.ripleyCategoryCode.trim(),
          brand: formState.ripleyBrand.trim(),
          thumbnailUrl: formState.ripleyThumbnailUrl.trim(),
          variantId: formState.ripleyVariantId.trim() || selectedProduct.sku,
          leadtimeToShip: formState.ripleyLeadtimeToShip.trim(),
          imageUrl: formState.imageUrl.trim(),
          additionalAttributes: parseLinesToAttributes(formState.ripleyAttributes),
        };
      }

      await axiosInstance.put(`/catalog/products/${selectedProduct.sku}/marketplaces/${selectedMarketplace}`, {
        title: formState.title.trim(),
        description: formState.description.trim(),
        price: Number(formState.price),
        status: formState.status,
        imageUrl: formState.imageUrl.trim() || undefined,
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

  const runBulkAction = async (dryRun: boolean, options?: { skus?: string[]; marketplaces?: MarketplaceKey[] }) => {
    const targetSkus = options?.skus?.length ? options.skus : selectedSkus;
    const targetMarketplaces = options?.marketplaces?.length ? options.marketplaces : bulkMarketplaces;

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
          skipExisting: true,
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

  const totalPages = Math.max(1, Math.ceil(catalog.total / catalog.limit || 1));
  const productsWithImage = catalog.items.filter((product) => product.hasImage).length;

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={catalog.items.length > 0 && catalog.items.every((item) => selectedSkus.includes(item.sku))}
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
          ) : product.hasImage ? (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-800">Foto</span>
          ) : (
            <ImageIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (product: CatalogProduct) => (
        <div>
          <p className="font-mono text-sm font-semibold text-gray-900">{product.sku}</p>
          <p className="text-xs text-gray-500">ID Odoo {product.id}</p>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Catálogo Odoo',
      render: (product: CatalogProduct) => (
        <div className="min-w-[260px] max-w-[340px]">
          <p className="font-medium text-gray-900 truncate">{product.name}</p>
          <p className="text-xs text-gray-500 truncate">{product.category || 'Sin categoría'}</p>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Precio Base',
      align: 'right' as const,
      render: (product: CatalogProduct) => <span className="font-medium text-gray-900">{formatCurrency(product.price)}</span>,
    },
    {
      key: 'stock',
      header: 'Stock Odoo',
      align: 'center' as const,
      render: (product: CatalogProduct) => (
        <div className="inline-flex items-center gap-2">
          {product.stock <= 1 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          <span className={`font-semibold ${product.stock <= 1 ? 'text-amber-700' : 'text-gray-900'}`}>{product.stock}</span>
        </div>
      ),
    },
    ...MARKETPLACES.map((marketplace) => ({
      key: marketplace,
      header: MARKETPLACE_LABELS[marketplace],
      align: 'center' as const,
      render: (product: CatalogProduct) => {
        const publication = product.publications.find((entry) => entry.marketplace === marketplace);
        const meta = STATUS_META[publication?.status || 'missing'];
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    })),
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center' as const,
      render: (product: CatalogProduct) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void loadProductDetail(product.sku)}
          className="gap-1.5"
        >
          <Eye className="w-4 h-4" />
          Gestionar
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Catálogo maestro</p>
        <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">Productos desde Odoo</h1>
      </div>

      <Card bodyClassName="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
        <div className="flex-1 relative max-w-2xl">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar por SKU o nombre base de Odoo..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-col items-stretch gap-3 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="rounded-full bg-gray-100 px-3 py-1.5">Productos: {catalog.total}</span>
          <span className="rounded-full bg-blue-100 px-3 py-1.5 text-blue-800">Con foto Odoo: {productsWithImage}</span>
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">Seleccionados: {selectedSkus.length}</span>
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
            Publicación masiva
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
        ) : isLoading ? (
          <div className="py-12 text-center text-sm text-gray-500">Cargando catálogo de Odoo...</div>
        ) : (
          <>
            <Table columns={columns} data={catalog.items} emptyMessage="No hay productos para este filtro" className="pb-3 overflow-x-scroll" />
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
                    <p><span className="font-semibold text-gray-950">Modo:</span> validar o publicar solo los que no existan ya en el canal.</p>
                    <p><span className="font-semibold text-gray-950">Lote:</span> el backend procesa por tandas para no saturar los marketplaces.</p>
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
                    <p className="mt-1 text-xs text-gray-500">El backend valida que el SKU exista en Odoo, revisa si el canal ya figura como existente y solo procesa los que estén listos.</p>
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
                              <Badge variant={result.status === 'error' ? 'error' : result.status === 'partial' ? 'warning' : 'success'}>{result.status}</Badge>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              {result.marketplaces.map((entry) => (
                                <div key={`${result.sku}-${entry.marketplace}`} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium text-gray-900">{MARKETPLACE_LABELS[entry.marketplace]}</span>
                                    <Badge variant={entry.status === 'error' ? 'error' : entry.status === 'skipped_existing' ? 'warning' : 'info'}>{entry.status}</Badge>
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">{entry.message}</p>
                                </div>
                              ))}
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
                    return (
                      <label key={marketplace} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-3 cursor-pointer hover:border-gray-300">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{MARKETPLACE_LABELS[marketplace]}</p>
                          <p className="text-xs text-gray-500">Usará el borrador/configuración guardada de ese canal.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setProductPublishMarketplaces((current) => checked ? current.filter((item) => item !== marketplace) : [...current, marketplace])}
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

      {(selectedProduct || isDetailLoading) && (
        <>
          <div className="fixed inset-0 z-40 bg-black/35" onClick={() => setSelectedProduct(null)} />
          <aside className="fixed right-0 top-0 z-50 h-screen w-full overflow-y-auto border-l border-black/10 bg-white shadow-2xl sm:max-w-xl">
            <div className="flex-1 overflow-y-auto p-4 space-y-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Publicación</p>
                  <h2 className="text-lg font-semibold text-gray-950">Gestión por marketplace</h2>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isDetailLoading && <div className="py-12 text-center text-sm text-gray-500">Cargando detalle del producto...</div>}

              {selectedProduct && !isDetailLoading && (
                <>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                        {selectedProduct.imageBase64 ? (
                          <img src={`data:image/png;base64,${selectedProduct.imageBase64}`} alt={selectedProduct.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <ImageIcon className="w-7 h-7 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-950">{selectedProduct.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{selectedProduct.sku} · {selectedProduct.category || 'Sin categoría'}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                          <span className="rounded-full bg-white border border-gray-200 px-2.5 py-1">Base: {formatCurrency(selectedProduct.price)}</span>
                          <span className="rounded-full bg-white border border-gray-200 px-2.5 py-1">Stock: {selectedProduct.stock}</span>
                          <span className={`rounded-full px-2.5 py-1 ${selectedProduct.hasImage ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                            {selectedProduct.hasImage ? 'Odoo trae foto' : 'Sin foto en Odoo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-3">Canales</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {MARKETPLACES.map((marketplace) => {
                        const detail = selectedProduct.marketplaceDetails[marketplace];
                        const status = STATUS_META[detail.status];
                        const validation = VALIDATION_META[detail.validation?.status || 'unknown'];
                        const isSelected = selectedMarketplace === marketplace;
                        const actionLabel = detail.existsInMarketplace || detail.externalProductId ? 'Editar' : 'Crear';

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
                              <p>{actionLabel} contenido comercial</p>
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
                            ? 'Producto publicado — edita los datos y guarda para actualizar'
                            : 'Completa los datos y publica en este canal'}
                        </p>
                      </div>
                      <Badge variant={STATUS_META[selectedProduct.marketplaceDetails[selectedMarketplace].status].variant}>
                        {STATUS_META[selectedProduct.marketplaceDetails[selectedMarketplace].status].label}
                      </Badge>
                    </div>

                    {/* Warning si faltan campos obligatorios */}
                    {selectedProduct.marketplaceDetails[selectedMarketplace].validation?.missingFields?.length ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-medium text-amber-800">Faltan campos para publicar:</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedProduct.marketplaceDetails[selectedMarketplace].validation!.missingFields.map((field) => (
                            <span key={field} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                              {friendlyFieldName(field)}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-amber-600 mt-2">Abre &quot;Configuración avanzada&quot; para completarlos.</p>
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
                      <Input
                        label="Precio"
                        type="number"
                        value={formState.price}
                        onChange={(e) => setFormState((current) => ({ ...current, price: e.target.value }))}
                        placeholder="0"
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Odoo</label>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900">
                          <span className="font-semibold">{selectedProduct.stock}</span>
                          <span className="text-xs text-gray-500">unidades</span>
                        </div>
                      </div>
                    </div>

                    <Input
                      label="Imagen URL"
                      value={formState.imageUrl}
                      onChange={(e) => setFormState((current) => ({ ...current, imageUrl: e.target.value }))}
                      placeholder="https://..."
                    />

                    {/* Configuracion avanzada — colapsable */}
                    <button
                      type="button"
                      onClick={() => setShowAdvancedConfig((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Configuración avanzada del canal
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedConfig ? 'rotate-180' : ''}`} />
                    </button>

                    {showAdvancedConfig && (
                    <>
                    {selectedMarketplace === 'falabella' && (
                      <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-950">Configuración Falabella</p>
                          <p className="text-xs text-gray-600 mt-1">Falabella exige categoría primaria y estructura de producto antes de publicar.</p>
                        </div>

                        <Input
                          label="Primary Category"
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
                          label="Product ID"
                          value={formState.falabellaProductId}
                          onChange={(e) => setFormState((current) => ({ ...current, falabellaProductId: e.target.value }))}
                          placeholder="xyzabc"
                        />

                        <Input
                          label="Operator Code"
                          value={formState.falabellaOperatorCode}
                          onChange={(e) => setFormState((current) => ({ ...current, falabellaOperatorCode: e.target.value }))}
                          placeholder="facl"
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Datos de producto</label>
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
                          <p className="text-sm font-semibold text-gray-950">Configuración MercadoLibre</p>
                          <p className="text-xs text-gray-600 mt-1">MercadoLibre exige categoría, listing type e imagen para crear el item.</p>
                        </div>

                        <Input
                          label="Category ID"
                          value={formState.meliCategoryId}
                          onChange={(e) => setFormState((current) => ({ ...current, meliCategoryId: e.target.value }))}
                          placeholder="MLC1648"
                        />

                        <Input
                          label="Listing Type ID"
                          value={formState.meliListingTypeId}
                          onChange={(e) => setFormState((current) => ({ ...current, meliListingTypeId: e.target.value }))}
                          placeholder="gold_special"
                        />

                        <Input
                          label="Condition"
                          value={formState.meliCondition}
                          onChange={(e) => setFormState((current) => ({ ...current, meliCondition: e.target.value }))}
                          placeholder="new"
                        />

                        <Input
                          label="Currency ID"
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
                          <p className="text-sm font-semibold text-gray-950">Configuración Walmart</p>
                          <p className="text-xs text-gray-600 mt-1">Walmart exige GTIN/EAN y categoría para poder crear el item.</p>
                        </div>

                        <Input
                          label="Category"
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
                          label="GTIN / EAN"
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
                          <p className="text-sm font-semibold text-gray-950">Configuración Paris</p>
                          <p className="text-xs text-gray-600 mt-1">Paris exige familia, categoría y atributos. Si falta esa base, el publish queda en error.</p>
                        </div>

                        <Input
                          label="Family ID"
                          value={formState.parisFamilyId}
                          onChange={(e) => setFormState((current) => ({ ...current, parisFamilyId: e.target.value }))}
                          placeholder="computacion"
                        />

                        <Input
                          label="Category"
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
                          <p className="text-sm font-semibold text-gray-950">Configuración Ripley</p>
                          <p className="text-xs text-gray-600 mt-1">Ripley publica por importación CSV. Aquí completas los datos que el backend convertirá al archivo de carga.</p>
                        </div>

                        <Input
                          label="Código de categoría"
                          value={formState.ripleyCategoryCode}
                          onChange={(e) => setFormState((current) => ({ ...current, ripleyCategoryCode: e.target.value }))}
                          placeholder="FO_MP"
                        />

                        <Input
                          label="Marca"
                          value={formState.ripleyBrand}
                          onChange={(e) => setFormState((current) => ({ ...current, ripleyBrand: e.target.value }))}
                          placeholder="HyperPC"
                        />

                        <Input
                          label="Thumbnail URL"
                          value={formState.ripleyThumbnailUrl}
                          onChange={(e) => setFormState((current) => ({ ...current, ripleyThumbnailUrl: e.target.value }))}
                          placeholder="https://..."
                        />

                        <Input
                          label="Variant ID"
                          value={formState.ripleyVariantId}
                          onChange={(e) => setFormState((current) => ({ ...current, ripleyVariantId: e.target.value }))}
                          placeholder={selectedProduct.sku}
                        />

                        <Input
                          label="Lead time to ship"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado local</label>
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
                        External ID: {selectedProduct.marketplaceDetails[selectedMarketplace].externalProductId}
                      </div>
                    )}
                    </>
                    )}
                    {/* Fin configuracion avanzada */}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => void handlePublishChannel()}
                        disabled={
                          isPublishing ||
                          isSaving ||
                          selectedProduct.marketplaceDetails[selectedMarketplace].validation?.status === 'missing_data'
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-4 h-4" />
                        {isPublishing
                          ? 'Preparando...'
                          : selectedProduct.marketplaceDetails[selectedMarketplace].validation?.status === 'exists'
                            ? 'Actualizar este canal'
                            : 'Publicar este canal'}
                      </button>
                      <button
                        onClick={() => {
                          setProductPublishMarketplaces(MARKETPLACES);
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

                    {detailNotice && (
                      <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{detailNotice}</div>
                    )}

                    {detailError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{detailError}</div>
                    )}

                    <div className="flex justify-end pt-1">
                      <Button onClick={() => void handleSaveDraft()} isLoading={isSaving} className="gap-1.5 min-w-40">
                        <Pencil className="w-4 h-4" />
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default ProductList;
