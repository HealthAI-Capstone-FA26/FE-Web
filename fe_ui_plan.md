# Kế hoạch build UI FE theo tính năng BE

## 1. Hiện trạng

**BE (NestJS)** có các nhóm module:
| Nhóm | Endpoint chính |
|---|---|
| appointment-registration | `appointments`, `appointments/guest`, `patients`, `queue-tickets` |
| auth | `auth/*`, `admin/permissions|roles`, `admin/security-settings` |
| doctor / schedule / slot | `doctors`, `doctor-schedules`, `doctors/:id/slots` |
| reception-intake | `encounters`, `chief-complaint`, `consents`, `consent-policies`, `identity-verifications`, `allergies`, `medical-history`, `triage-queue` |
| vitals | `vital-sessions`, `vital-items`, `vital-reference-ranges`, `vital-sessions/:id/detect-alerts` + WebSocket `vital-alert.gateway` |
| pre-doctor-examination | `doctor-examination/encounters/:id/{overview,start,clinical-examination,diagnoses,test-orders}`, `services`, `icd10-codes` |
| lab-test | `lab-rooms`, `lab-tasks`, `lab-results`, `ecg-recordings`, `ecg-analyses`, `ecg-anomaly-events`, `result-alerts` |
| post-test-consultation | `.../timeline`, `.../diagnosis-conclusion`, `.../treatment-consultation` |
| payment | `examination-fees`, `invoices`, `payments` (cash, bank-transfer, webhook) |

**FE (React + Router + Tailwind)** đã có workspace theo vai trò: Patient, Reception, Nurse, Doctor, Lab, Admin. Pattern: `modules/<role>/*WorkspaceView` + `services/<domain>/*.service.ts` + `components/common` (DataTable, Modal, Badge) + `ROLE_NAV_CONFIG` trong `types/dashboard.ts`.

## 2. Khoảng trống (cần xác minh bằng grep khi code)

| # | Tính năng BE | Tình trạng FE | Ưu tiên |
|---|---|---|---|
| 1 | Post-test consultation (timeline, kết luận chẩn đoán, tư vấn điều trị) | Có `case-timeline.service`, `DoctorDiagnosisView`, `DoctorPrescriptionView`; chưa rõ nối `diagnosis-conclusion`/`treatment-consultation` | Cao |
| 2 | ECG recording + AI analysis + anomaly events | Chưa thấy service/UI | Cao |
| 3 | Lab result alerts (confirm/resolve) | `LabOrdersView` có ngưỡng cảnh báo, chưa chắc dùng `result-alerts` | Cao |
| 4 | Vital alert realtime (WebSocket) | Có route `/dieu-duong/canh-bao`; cần kiểm tra socket | Trung bình |
| 5 | Initial diagnosis (ICD-10) | `icd10.service` có; cần UI CRUD chẩn đoán sơ bộ | Trung bình |
| 6 | Medical history của bệnh nhân | Chỉ có `patient-allergy.service` | Trung bình |
| 7 | Identity verification / consent / triage-queue | Có service consent, triage; kiểm tra màn lịch sử | Thấp |
| 8 | Role-permission, security-config, doctor-schedule cron | Có admin view | Thấp (rà soát) |
| 9 | Guest appointment (OTP) | `BookingForm` public; kiểm tra luồng OTP | Thấp |

## 3. Các bước giải pháp

### Bước 0 – Chuẩn bị nền (0.5 ngày)
- Rà soát `services/api.ts` (baseURL, interceptor refresh-token, unwrap response).
- Tạo type chung theo DTO BE trong `types/`.
- Sửa lỗi encoding tiếng Việt trong `types/dashboard.ts` (đang bị hỏng ký tự) và thống nhất UTF-8.
- Tách file quá lớn (`LabOrdersView` ~107KB, `DoctorDiagnosisView` ~83KB, `DoctorScheduleView` ~64KB) thành component con trước khi thêm tính năng.

### Bước 1 – Luồng Bác sĩ sau xét nghiệm (Gap #1, #5) - [ĐÃ HOÀN THÀNH ✅]
- Services mới: `post-test-consultation.service.ts` (GET timeline, POST diagnosis-conclusion, PUT treatment-consultation), `initial-diagnosis.service.ts` (CRUD chẩn đoán sơ bộ/phân biệt SE02).
- Cập nhật `case-timeline.service.ts` để đồng bộ DTO mới.
- Cập nhật `DoctorDiagnosisView.tsx`:
  - Gỡ bỏ hộp thoại AI gợi ý chẩn đoán (AI proposal) & nút Accept/Reject cũ.
  - Hiển thị banner trạng thái cận lâm sàng (`readyForConclusion`) & thanh tiến độ CLS (`paraclinicalProgress`).
  - Gợi ý nhanh các mã ICD-10 tim mạch chuẩn (`I20.9`, `I21.9`, `I25.1`, `I50.9`, `I10`, `I48.9`...) + ô tìm kiếm ICD-10 autocomplete.
  - Thiết lập form tư vấn điều trị với cấu hình hẹn tái khám (`followUpIntervalDays` chọn nhanh: 7, 14, 30, 60, 90 ngày hoặc số ngày tự do).
- Tích hợp `initialDiagnosisService` vào `DoctorEMRView.tsx` tạo bản ghi chẩn đoán sơ bộ SE02 và gắn `diagnosisId` vào phiếu chỉ định cận lâm sàng.

### Bước 2 – Xét nghiệm: cảnh báo & ECG (Gap #2, #3)
- Services: `lab/lab-alert.service.ts` (detect/confirm/resolve), `lab/ecg.service.ts` (recording, signal-url, analyses, anomaly events).
- Component: `LabAlertList`, `EcgUploadCard`, `EcgViewer` (vẽ tín hiệu từ signal-url bằng canvas/recharts), `EcgAiAnalysisCard`, `EcgAnomalyEventTable` (acknowledge/resolve/review).
- Tích hợp vào `LabWorkspaceView` (route `/xet-nghiem/canh-bao`, thêm `/xet-nghiem/ecg`) và hiển thị cho bác sĩ trong tab kết quả.

### Bước 3 – Điều dưỡng: sinh hiệu & cảnh báo realtime (Gap #4) - [ĐÃ HOÀN THÀNH ✅]
- Hook socket `useVitalAlertSocket` kết nối namespace `/vital-alerts` của `vital-alert.gateway`; hỗ trợ `subscribe`/`unsubscribe`, đẩy toast realtime khi có cảnh báo bất thường (`critical`, `warning`) kèm badge Live trên Navigation điều dưỡng.
- Màn hình cảnh báo sinh hiệu `NurseVitalAlertsView.tsx` (`/dieu-duong/canh-bao`):
  - Bộ lọc cảnh báo theo mức độ (`critical`, `warning`, `info`) và trạng thái giải quyết (`active`, `resolved`).
  - Nút kích hoạt lại phân tích cảnh báo sinh hiệu `POST /vital-sessions/:id/detect-alerts`.
  - Bảng tra cứu khoảng tham chiếu sinh hiệu cá nhân hóa `vital-reference-ranges` theo tuổi/giới tính (`GET /patients/:id/vital-reference-ranges`).
- Tích hợp tự động điều phối chuyển bác sĩ tim mạch trực (`POST /encounters/:id/route-doctor`) ngay sau khi hoàn tất đo sinh hiệu trong `NurseVitalModal.tsx`.

### Bước 4 – Tiếp nhận & hồ sơ bệnh nhân (Gap #6, #7) - [ĐÃ HOÀN THÀNH ✅]
- `patient-medical-history.service.ts`: CRUD tiền sử bệnh dài hạn (`GET`, `POST /patients/:id/medical-history`, `PATCH /medical-history/:id/status`).
- Modal `NurseMedicalHistoryModal.tsx`:
  - Phân loại tiền sử theo nhóm: Bệnh mạn tính, Can thiệp tim mạch, Phẫu thuật, Tiền sử gia đình, Yếu tố nguy cơ.
  - Chọn nhanh các bệnh lý tim mạch phổ biến (Tăng huyết áp, Đái tháo đường, Mỡ máu cao, Đặt Stent PCI, Hút thuốc lá...).
  - Thao tác nhanh đổi trạng thái tiền sử bệnh (`active`, `resolved`, `inactive`).
  - Tích hợp dùng chung ở cả bàn Tiếp nhận/Điều dưỡng (`NurseQueueTable`, `NurseQueueView`) và Bàn khám Bác sĩ (`PatientAdministrativeCard`, `DoctorEMRView`).
- Tiếp nhận & Triage queue: Hoàn thiện thao tác tiếp nhận xử lý ca `startProcessing` (`PATCH /triage-queue/:id/start`), dequeue ca tiếp theo (`POST /triage-queue/dequeue`), lịch sử xác minh danh tính và đồng thuận consent.

### Bước 5 – Thanh toán, Admin, Guest (Gap #8, #9)
- Kiểm tra đủ trạng thái hóa đơn/PDF/hủy, thanh toán cash confirm và bank-transfer (QR + polling theo webhook).
- Admin: RBAC theo role, security-settings, trigger cron `weekly-generate`.
- Guest booking: bước request-otp → verify-otp.

### Bước 6 – Điều hướng, phân quyền, chất lượng
- Cập nhật `ROLE_NAV_CONFIG` + route trong `App.tsx` cho trang mới, dùng `requiredPermission` (`Can`/`useCan`).
- Chuẩn hóa loading/empty/error state bằng `DataTable`, `Modal`, `Badge` hiện có.
- Test: kiểm thử luồng end-to-end theo vai trò (Lễ tân → Điều dưỡng → Bác sĩ → Lab → Bác sĩ kết luận → Thu phí).

## 4. Thứ tự đề xuất
Bước 0 → 1 → 2 → 3 → 4 → 5 → 6 (1 và 2 có thể làm song song).

> [!NOTE]
> Danh sách gap dựa trên đối chiếu tên file/endpoint; cần grep sâu từng view lớn trước khi code để tránh làm trùng.
