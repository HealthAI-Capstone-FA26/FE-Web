import { apiFetch } from '../api';

export interface ConsentPolicyItem {
  policyId: string;
  policyCode: string;
  policyType: string;
  version: string;
  contentUrl?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface CreateConsentPayload {
  patientId: string;
  encounterId?: string;
  policyId: string;
  signatureType: 'e_signature_draw' | 'otp_confirmed' | 'checkbox_click';
  signatureDataUrl?: string;
  witnessedAtCounter?: boolean;
}

export interface ConsentItem {
  consentId: string;
  patientId: string;
  encounterId?: string;
  policyId: string;
  signatureType: string;
  status: 'active' | 'revoked';
  signedAt: string;
}

export const consentService = {
  // Lấy danh sách policy đang hiệu lực
  async getEffectivePolicies(policyType?: string): Promise<ConsentPolicyItem[]> {
    const query = policyType ? `?policyType=${encodeURIComponent(policyType)}` : '';
    return apiFetch<ConsentPolicyItem[]>(`/consent-policies${query}`, {
      method: 'GET',
    });
  },

  // Ghi nhận sự đồng ý cam kết (chữ ký tại quầy hoặc checkbox)
  async createConsent(payload: CreateConsentPayload): Promise<ConsentItem> {
    return apiFetch<ConsentItem>('/consents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Đảm bảo bệnh nhân có đủ 2 cam kết bắt buộc (Xử lý dữ liệu cá nhân & Đồng ý khám chữa bệnh)
  async ensureMandatoryConsents(patientId: string, encounterId?: string): Promise<void> {
    try {
      const policies = await this.getEffectivePolicies();
      const mandatoryTypes = ['data_processing', 'treatment_consent'];
      const targetPolicies = policies.filter((p) => mandatoryTypes.includes(p.policyType));

      for (const policy of targetPolicies) {
        try {
          await this.createConsent({
            patientId,
            encounterId,
            policyId: policy.policyId,
            signatureType: 'checkbox_click',
            witnessedAtCounter: true,
          });
        } catch (cErr) {
          // Bỏ qua nếu bệnh nhân đã có consent active loại này rồi
          console.warn(`Consent for ${policy.policyType} note:`, cErr);
        }
      }
    } catch (err) {
      console.warn('Lỗi khi kiểm tra chính sách cam kết bắt buộc:', err);
    }
  },
};
