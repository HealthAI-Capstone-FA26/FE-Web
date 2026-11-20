import { apiFetch } from '../api';

export interface DrugCatalogItem {
  drugId: string;
  drugCode: string;
  nationalListCode?: string | null;
  drugName: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  route?: string;
  unit: string;
  therapeuticClass?: string | null;
  defaultDosage?: string;
  defaultRoute?: string;
  price?: number;
  isActive: boolean;
  allergenCategoryId?: string | null;
  allergenCategory?: {
    categoryId: string;
    categoryCode: string;
    categoryName: string;
  } | null;
}

export interface DrugInteraction {
  interactionId: string;
  drugIdA: string;
  drugIdB: string;
  severity: string;
  description: string;
  drugA?: DrugCatalogItem;
  drugB?: DrugCatalogItem;
}

export interface DrugCatalogDetail extends DrugCatalogItem {
  interactionsA?: DrugInteraction[];
  interactionsB?: DrugInteraction[];
}

export interface DrugSearchResponse {
  items: DrugCatalogItem[];
  total: number;
  page: number;
  limit: number;
}

const DRUG_CACHE_STORAGE_KEY = 'healthai_drug_catalog_cache_v1';
const DRUG_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 giờ

let memoryDrugCatalog: DrugCatalogItem[] | null = null;
let pendingCatalogPromise: Promise<DrugCatalogItem[]> | null = null;

function mapRouteToVietnamese(route?: string): string {
  if (!route) return 'Uống';
  const r = route.toLowerCase();
  if (r === 'oral') return 'Uống';
  if (r === 'injection' || r === 'iv' || r === 'im' || r === 'sc') return 'Tiêm';
  if (r === 'inhalation') return 'Hít';
  if (r === 'topical') return 'Bôi';
  if (r === 'sublingual' || r === 'rectal' || r === 'suppository') return 'Đặt';
  return route;
}

function normalizeDrugItem(raw: any): DrugCatalogItem {
  const defaultRoute = raw.defaultRoute || mapRouteToVietnamese(raw.route);
  const unitLabel = raw.unit || 'viên';
  const defaultDosage =
    raw.defaultDosage ||
    (defaultRoute === 'Uống'
      ? `Uống 1 ${unitLabel} x 2 lần/ngày`
      : `${defaultRoute} theo chỉ định bác sĩ`);

  return {
    ...raw,
    defaultRoute,
    defaultDosage,
  };
}

function readCachedCatalogFromStorage(): DrugCatalogItem[] | null {
  try {
    const raw = localStorage.getItem(DRUG_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.items) &&
      parsed.items.length > 0 &&
      typeof parsed.timestamp === 'number' &&
      Date.now() - parsed.timestamp < DRUG_CACHE_TTL_MS
    ) {
      return parsed.items;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function writeCachedCatalogToStorage(items: DrugCatalogItem[]): void {
  try {
    localStorage.setItem(
      DRUG_CACHE_STORAGE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        items,
      })
    );
  } catch {
    // ignore quota errors
  }
}

async function loadFullDrugCatalog(forceRefresh = false): Promise<DrugCatalogItem[]> {
  if (!forceRefresh) {
    if (memoryDrugCatalog && memoryDrugCatalog.length > 0) {
      return memoryDrugCatalog;
    }
    const stored = readCachedCatalogFromStorage();
    if (stored && stored.length > 0) {
      memoryDrugCatalog = stored;
      return stored;
    }
  }

  if (pendingCatalogPromise) {
    return pendingCatalogPromise;
  }

  pendingCatalogPromise = apiFetch<any[]>('/drugs')
    .then((res) => {
      const rawList = Array.isArray(res) ? res : (res as any)?.items || [];
      const normalized = rawList.map(normalizeDrugItem);
      if (normalized.length > 0) {
        memoryDrugCatalog = normalized;
        writeCachedCatalogToStorage(normalized);
      }
      return normalized;
    })
    .finally(() => {
      pendingCatalogPromise = null;
    });

  return pendingCatalogPromise;
}

export const drugCatalogService = {
  /**
   * Tìm kiếm danh mục thuốc:
   * - Tải danh mục 1 lần duy nhất từ GET /api/v1/drugs và lưu vào RAM + localStorage (TTL 24h)
   * - Mọi thao tác gõ tìm kiếm lọc trực tiếp trên RAM (0ms, 0 byte Database Network Transfer)
   */
  search: async (query?: string, page = 1, limit = 100): Promise<DrugSearchResponse> => {
    const allDrugs = await loadFullDrugCatalog();
    const keyword = query?.trim().toLowerCase();

    const filtered = keyword
      ? allDrugs.filter(
          (d) =>
            d.drugName?.toLowerCase().includes(keyword) ||
            d.genericName?.toLowerCase().includes(keyword) ||
            d.drugCode?.toLowerCase().includes(keyword) ||
            d.nationalListCode?.toLowerCase().includes(keyword) ||
            d.therapeuticClass?.toLowerCase().includes(keyword)
        )
      : allDrugs;

    const start = Math.max(0, (page - 1) * limit);
    const items = filtered.slice(start, start + limit);

    return {
      items,
      total: filtered.length,
      page,
      limit,
    };
  },

  /**
   * Lấy chi tiết thuốc theo drugId:
   * - Ưu tiên trả về ngay từ Cache trong RAM (vì GET /drugs đã kèm sẵn allergenCategory)
   * - Chỉ gọi GET /api/v1/drugs/:id khi thuốc không nằm trong Cache
   */
  getById: async (drugId: string): Promise<DrugCatalogDetail> => {
    const allDrugs = await loadFullDrugCatalog().catch(() => memoryDrugCatalog || []);
    const cached = allDrugs.find((d) => d.drugId === drugId || d.drugCode === drugId);
    if (cached) {
      return cached;
    }

    const raw = await apiFetch<any>(`/drugs/${drugId}`);
    return normalizeDrugItem(raw);
  },

  /**
   * Làm mới danh mục thuốc thủ công khi cần
   */
  invalidateCache: () => {
    memoryDrugCatalog = null;
    try {
      localStorage.removeItem(DRUG_CACHE_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
