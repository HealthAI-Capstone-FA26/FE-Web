import { apiFetch } from '../api';

// ─── Request ───────────────────────────────────────────────────────────────

export interface SuggestDepartmentPayload {
  /** Mô tả triệu chứng bằng ngôn ngữ tự nhiên (tối thiểu 3 ký tự, tối đa 500) */
  symptoms: string;
  /**
   * Tuổi (năm, có thể lẻ, vd 0.05 ≈ 18 ngày tuổi) của người sẽ đi khám.
   * Nếu < 16 tuổi → ưu tiên Khoa Nhi/Sơ sinh.
   */
  patientAgeYears?: number;
}

// ─── Response ──────────────────────────────────────────────────────────────

export type SuggestionMethod =
  | 'emergency'
  | 'keyword'
  | 'semantic'
  | 'hybrid'
  | 'context'
  | 'fallback';

export type SuggestionConfidence = 'high' | 'medium' | 'low';

export interface DepartmentSuggestionResult {
  departmentId: string;
  departmentCode: string;
  departmentName: string;

  /** Điểm xếp hạng cuối cùng [0, 1] */
  score: number;
  /** Điểm từ khoá thuần */
  keywordScore: number;
  /** Cosine similarity cao nhất giữa mô tả và triệu chứng của khoa */
  semanticScore: number;

  matchedKeywords: string[];

  /** Phương pháp gợi ý */
  method: SuggestionMethod;

  /**
   * high: có thể tự chọn khoa;
   * medium: nên cho người dùng xác nhận;
   * low/fallback: BẮT BUỘC cho người dùng chọn lại.
   */
  confidence: SuggestionConfidence;

  /** true = phát hiện dấu hiệu nguy hiểm → nên hướng dẫn đi cấp cứu */
  isEmergency: boolean;

  /** Lời khuyên / thông điệp khẩn cấp (chỉ có khi isEmergency = true) */
  advice?: string;

  /** Giải thích ngắn gọn vì sao khoa này được gợi ý */
  reasons: string[];
}

// ─── Utility helpers ───────────────────────────────────────────────────────

/**
 * Tính tuổi (năm, có thể lẻ tới 3 chữ số thập phân) từ ngày sinh.
 * Trả về undefined nếu dateOfBirth không hợp lệ.
 */
export function calcPatientAgeYears(dateOfBirth?: string): number | undefined {
  if (!dateOfBirth) return undefined;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return undefined;
  const diffMs = Date.now() - dob.getTime();
  const ageYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, parseFloat(ageYears.toFixed(3)));
}

/**
 * Label hiển thị cho mức confidence.
 */
export function confidenceLabel(confidence: SuggestionConfidence): string {
  switch (confidence) {
    case 'high': return 'Rất phù hợp';
    case 'medium': return 'Có thể phù hợp';
    default: return 'Tham khảo';
  }
}

// ─── Service ───────────────────────────────────────────────────────────────

export const departmentSuggestionService = {
  /**
   * Gợi ý chuyên khoa khám dựa trên triệu chứng mô tả tự nhiên.
   * API public, không cần auth token.
   */
  async suggest(payload: SuggestDepartmentPayload): Promise<DepartmentSuggestionResult[]> {
    const { symptoms, patientAgeYears } = payload;

    const body: Record<string, unknown> = { symptoms: symptoms.trim() };

    // Nếu văn bản đã ghi rõ trẻ sơ sinh hoặc ngày/tuần tuổi sơ sinh,
    // nhưng ngày sinh từ form lại là người lớn (> 28 ngày) do phụ huynh đặt lịch hộ,
    // thì không gửi patientAgeYears người lớn để backend tự suy luận chính xác từ text.
    const hasNeonateInText = /(sơ sinh|mới sinh|\b\d{1,2}\s*(ngày|tuần)\s*tuổi\b)/i.test(symptoms);
    const isAdultDob = patientAgeYears !== undefined && patientAgeYears > 28 / 365;

    if (!hasNeonateInText && patientAgeYears !== undefined && patientAgeYears >= 0) {
      body.patientAgeYears = patientAgeYears;
    } else if (hasNeonateInText && !isAdultDob && patientAgeYears !== undefined) {
      body.patientAgeYears = patientAgeYears;
    }

    return apiFetch<DepartmentSuggestionResult[]>('/department-suggestion', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};
