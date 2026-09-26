import { apiFetch } from '../api';

export interface DrugCatalogItem {
  drugId: string;
  drugCode: string;
  drugName: string;
  genericName?: string;
  unit: string;
  defaultDosage?: string;
  defaultRoute?: string;
  price?: number;
  isActive: boolean;
  allergenCategory?: {
    categoryId: string;
    categoryCode: string;
    categoryName: string;
  };
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

export const drugCatalogService = {
  search: async (query?: string, page = 1, limit = 50): Promise<DrugSearchResponse> => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    params.append('page', String(page));
    params.append('limit', String(limit));

    return apiFetch(`/prescriptions/drug-catalog?${params.toString()}`);
  },

  getById: async (drugId: string): Promise<DrugCatalogDetail> => {
    return apiFetch(`/prescriptions/drug-catalog/${drugId}`);
  },
};
