import { apiFetch } from '../api';

export type AllergyType = 'drug' | 'food' | 'environmental' | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening';
export type AllergyStatus = 'active' | 'resolved' | 'entered_in_error';

export interface PatientAllergyItem {
  allergyId: string;
  patientId: string;
  allergyText: string;
  status: AllergyStatus;
  recordedByUserId?: string;
  recordedAt: string;
  createdAt?: string;

  // Thuộc tính tương thích ngược
  allergenName?: string;
  allergyType?: AllergyType;
  reactionDescription?: string;
  severity?: AllergySeverity;
  encounterId?: string;
}

export interface ParsedAllergyDetail {
  type: AllergyType;
  typeTag: string; // '[DRUG]', '[FOOD]', '[ENVIRONMENT]', '[OTHER]'
  typeLabel: string; // 'Thuốc', 'Thực phẩm', 'Môi trường', 'Khác'
  name: string; // Tên dị ứng / tác nhân
  severity?: AllergySeverity;
  severityLabel?: string; // Nhãn hiển thị mức độ
  reaction?: string; // Triệu chứng / phản ứng
  rawText: string;
}

export interface ParsedAllergies {
  drug: string[];
  food: string[];
  environment: string[];
  other: string[];
  rawText: string;
}

/**
 * Phân tích 1 mục dị ứng từ chuỗi format chuẩn:
 * Ví dụ: "[FOOD] dị ứng tôm (Mức độ: severe - Phản ứng: nổi mề đay)"
 */
export function parseAllergyItem(itemText: string): ParsedAllergyDetail {
  const trimmed = itemText.trim();
  const match = trimmed.match(/^\[(DRUG|THUỐC|FOOD|THỰC PHẨM|ENVIRONMENT|MÔI TRƯỜNG|OTHER|KHÁC)\]\s*(.*?)(?:\s*\((.*?)\))?$/i);

  let type: AllergyType = 'other';
  let typeTag = '[OTHER]';
  let typeLabel = 'Khác';
  let name = trimmed;
  let severity: AllergySeverity | undefined = undefined;
  let reaction: string | undefined = undefined;

  if (match) {
    const rawTag = match[1].toUpperCase();
    if (rawTag === 'DRUG' || rawTag === 'THUỐC') {
      type = 'drug';
      typeTag = '[DRUG]';
      typeLabel = 'Thuốc';
    } else if (rawTag === 'FOOD' || rawTag === 'THỰC PHẨM') {
      type = 'food';
      typeTag = '[FOOD]';
      typeLabel = 'Thực phẩm';
    } else if (rawTag === 'ENVIRONMENT' || rawTag === 'MÔI TRƯỜNG') {
      type = 'environmental';
      typeTag = '[ENVIRONMENT]';
      typeLabel = 'Môi trường';
    } else {
      type = 'other';
      typeTag = '[OTHER]';
      typeLabel = 'Khác';
    }

    name = (match[2] || '').trim();
    const details = match[3];
    if (details) {
      // Bóc tách Mức độ và Phản ứng
      const sevMatch = details.match(/Mức độ:\s*([^-)]+)/i);
      const reactMatch = details.match(/Phản ứng:\s*([^)]+)/i);

      if (sevMatch) {
        const rawSev = sevMatch[1].trim().toLowerCase();
        if (['mild', 'nhẹ'].includes(rawSev)) severity = 'mild';
        else if (['moderate', 'trung bình'].includes(rawSev)) severity = 'moderate';
        else if (['severe', 'nặng'].includes(rawSev)) severity = 'severe';
        else if (['life_threatening', 'nguy hiểm', 'nguy hiểm tính mạng'].includes(rawSev)) severity = 'life_threatening';
        else severity = rawSev as AllergySeverity;
      }

      if (reactMatch) {
        reaction = reactMatch[1].trim();
      }
    }
  }

  const getSeverityLabel = (sev?: string): string | undefined => {
    switch (sev) {
      case 'life_threatening':
        return 'Nguy hiểm tính mạng (Life-threatening)';
      case 'severe':
        return 'Nặng (Severe)';
      case 'moderate':
        return 'Trung bình (Moderate)';
      case 'mild':
        return 'Nhẹ (Mild)';
      default:
        return sev;
    }
  };

  return {
    type,
    typeTag,
    typeLabel,
    name: name || trimmed,
    severity,
    severityLabel: getSeverityLabel(severity),
    reaction,
    rawText: trimmed,
  };
}

/**
 * Phân tích toàn bộ chuỗi dị ứng (nhiều mục cách nhau bởi dấu ';')
 */
export function parseAllergiesFromText(allergyText?: string | null): ParsedAllergyDetail[] {
  if (!allergyText || !allergyText.trim()) return [];
  const groups = allergyText.split(';').map((g) => g.trim()).filter(Boolean);
  return groups.map((g) => parseAllergyItem(g));
}

/**
 * Phân tích danh mục tương thích ngược cho các nơi cần gom nhóm mảng chuỗi
 */
export function parseAllergyText(allergyText?: string | null): ParsedAllergies {
  const result: ParsedAllergies = {
    drug: [],
    food: [],
    environment: [],
    other: [],
    rawText: allergyText || '',
  };
  if (!allergyText || !allergyText.trim()) return result;

  const items = parseAllergiesFromText(allergyText);
  for (const item of items) {
    if (item.type === 'drug') result.drug.push(item.name);
    else if (item.type === 'food') result.food.push(item.name);
    else if (item.type === 'environmental') result.environment.push(item.name);
    else result.other.push(item.name);
  }

  return result;
}

/**
 * Đóng gói thành chuỗi chuẩn theo quy ước DB:
 * "[<TYPE>] <Tên> (Mức độ: <mức_độ> - Phản ứng: <phản_ứng>)"
 * Ví dụ: "[FOOD] dị ứng abc (Mức độ: severe - Phản ứng: abc)"
 */
export function buildFormattedAllergyText(input: {
  allergyType: AllergyType | string;
  allergenName: string;
  severity?: AllergySeverity | string;
  reactionDescription?: string;
}): string {
  let tag = '[OTHER]';
  const t = (input.allergyType || 'other').toLowerCase();
  if (t === 'drug') tag = '[DRUG]';
  else if (t === 'food') tag = '[FOOD]';
  else if (t === 'environmental' || t === 'environment') tag = '[ENVIRONMENT]';

  const name = (input.allergenName || '').trim();
  const details: string[] = [];

  if (input.severity) {
    details.push(`Mức độ: ${input.severity}`);
  }
  if (input.reactionDescription && input.reactionDescription.trim()) {
    details.push(`Phản ứng: ${input.reactionDescription.trim()}`);
  }

  const detailStr = details.length > 0 ? ` (${details.join(' - ')})` : '';
  return `${tag} ${name}${detailStr}`;
}

/**
 * Hiển thị tóm tắt thân thiện cho bác sĩ và giao diện lâm sàng
 */
export function formatAllergySummary(allergyText?: string | null): string {
  if (!allergyText || !allergyText.trim()) return 'Chưa ghi nhận dị ứng';
  const items = parseAllergiesFromText(allergyText);
  if (items.length === 0) return allergyText;

  return items
    .map((item) => {
      const parts = [`${item.name}`];
      if (item.severityLabel) parts.push(`[${item.severityLabel}]`);
      if (item.reaction) parts.push(`(Phản ứng: ${item.reaction})`);
      return `[${item.typeLabel}] ${parts.join(' ')}`;
    })
    .join('; ');
}

export interface CreatePatientAllergyPayload {
  allergyText?: string;
  allergyType?: AllergyType;
  allergenName?: string;
  severity?: AllergySeverity;
  reactionDescription?: string;
  encounterId?: string;
}

export const patientAllergyService = {
  // POST /api/v1/patients/:patientId/allergies
  async createAllergy(
    patientId: string,
    payload: CreatePatientAllergyPayload
  ): Promise<PatientAllergyItem> {
    let allergyText = payload.allergyText;

    if (!allergyText && payload.allergenName) {
      allergyText = buildFormattedAllergyText({
        allergyType: payload.allergyType || 'other',
        allergenName: payload.allergenName,
        severity: payload.severity,
        reactionDescription: payload.reactionDescription,
      });
    }

    return apiFetch<PatientAllergyItem>(`/patients/${patientId}/allergies`, {
      method: 'POST',
      body: JSON.stringify({ allergyText: (allergyText || 'Chưa ghi nhận dị ứng').trim() }),
    });
  },

  // GET /api/v1/patients/:patientId/allergies
  async getAllergies(
    patientId: string,
    status?: string
  ): Promise<PatientAllergyItem[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiFetch<PatientAllergyItem[]>(`/patients/${patientId}/allergies${query}`, {
      method: 'GET',
    });
  },

  // PATCH /api/v1/allergies/:id/status
  async updateStatus(
    allergyId: string,
    status: AllergyStatus
  ): Promise<PatientAllergyItem> {
    return apiFetch<PatientAllergyItem>(`/allergies/${allergyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
