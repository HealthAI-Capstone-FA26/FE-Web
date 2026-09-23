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
  witnessedAtCounter?: boolean;
  signatureDataUrl?: string;
  policy?: ConsentPolicyItem;
  revocationReason?: string;
  revokedAt?: string;
}

export const consentService = {
  // Lấy danh sách policy đang hiệu lực
  async getEffectivePolicies(policyType?: string): Promise<ConsentPolicyItem[]> {
    const query = policyType ? `?policyType=${encodeURIComponent(policyType)}` : '';
    return apiFetch<ConsentPolicyItem[]>(`/consent-policies${query}`, {
      method: 'GET',
    });
  },

  // Tra cứu consent theo bệnh nhân/trạng thái/loại policy
  async getConsents(params?: { patientId?: string; status?: string; policyType?: string }): Promise<ConsentItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.patientId) searchParams.append('patientId', params.patientId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.policyType) searchParams.append('policyType', params.policyType);

    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiFetch<ConsentItem[]>(`/consents${queryString}`, {
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

  // Thu hồi sự đồng ý consent
  async revokeConsent(consentId: string, revocationReason?: string): Promise<ConsentItem> {
    return apiFetch<ConsentItem>(`/consents/${consentId}/revoke`, {
      method: 'PATCH',
      body: JSON.stringify({ revocationReason }),
    });
  },

  // Đảm bảo bệnh nhân có đủ các cam kết được chọn / bắt buộc
  async ensureMandatoryConsents(
    patientId: string,
    encounterId?: string,
    options?: {
      policyIds?: string[];
      signatureType?: 'checkbox_click' | 'e_signature_draw' | 'otp_confirmed';
      signatureDataUrl?: string;
      witnessedAtCounter?: boolean;
    }
  ): Promise<void> {
    try {
      const policies = await this.getEffectivePolicies();
      let targetPolicies = policies;

      if (options?.policyIds && options.policyIds.length > 0) {
        targetPolicies = policies.filter((p) => options.policyIds!.includes(p.policyId));
      } else {
        const mandatoryTypes = ['data_processing', 'treatment_consent'];
        targetPolicies = policies.filter((p) => mandatoryTypes.includes(p.policyType));
      }

      for (const policy of targetPolicies) {
        try {
          await this.createConsent({
            patientId,
            encounterId,
            policyId: policy.policyId,
            signatureType: options?.signatureType || 'checkbox_click',
            signatureDataUrl: options?.signatureDataUrl,
            witnessedAtCounter: options?.witnessedAtCounter ?? true,
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
