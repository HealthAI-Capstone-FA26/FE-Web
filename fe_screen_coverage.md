# Đối chiếu màn hình FE-Web với 9 chức năng 3.1 – 3.9

Chú thích: ✅ đủ (gọi API thật) · 🟡 có màn hình nhưng thiếu một phần / có mock · ❌ chưa có (chỉ là UI giả)

| # | Chức năng | Route / màn hình FE | Trạng thái |
|---|---|---|---|
| 3.1 | Online Patient Registration | Trang chủ `BookingForm` (khách + OTP), `/benh-nhan/lich-hen` (`PatientBookingForm`, danh sách, chi tiết, huỷ), `/benh-nhan/ho-so` (hồ sơ BN) | ✅ |
| 3.2 | Offline Registration & Clinical Reception | `/kiosk`, `/lay-so` (bốc số), `/tiep-nhan/goi-so` (gọi số + `ReceptionIntakeModal`: định danh, lý do khám, consent, chữ ký), `/tiep-nhan/danh-sach-cho` (lịch hẹn, confirm/check-in, sync CCCD, xác thực hồ sơ), `/tiep-nhan/benh-nhan`, thu phí khám | ✅ (còn bug, xem file trước) |
| 3.3 | Vital Measurement & Storage | `/dieu-duong/hang-cho-sinh-hieu`, `/nhap-sinh-hieu` (`NurseQueueView`, `NurseVitalModal`: `recordVitalSigns`, `routeDoctor`, lịch sử sinh hiệu, dị ứng, tiền sử), `/dieu-duong/canh-bao` | ✅ |
| 3.4 | Cardiovascular Examination & Initial Diagnosis | `/bac-si/kham-benh` (`DoctorEMRView`: hàng chờ, `startAppointment`, khám lâm sàng, chẩn đoán ban đầu, AI tóm tắt/gợi ý) | ✅ |
| 3.5 | Diagnostic Test Ordering | `TestOrderCreationCard` + `TestOrderHistoryList` trong `DoctorEMRView` (tạo / huỷ chỉ định) | ✅ |
| 3.6 | Test Order Payment | `/tiep-nhan/thu-phi`, `/ho-don` (`ReceptionBillingView`: lọc phí XN, `ReceptionGenerateInvoiceModal` lập HĐ XN, `ReceptionPaymentModal` tiền mặt / chuyển khoản, PDF) | ✅ |
| 3.7 | Paraclinical Test Execution | `/xet-nghiem/hang-cho-xet-nghiem`, `/upload-dicom`, `/canh-bao` (`LabOrdersView`: nhận task, nhập kết quả, upload file, phát hiện cảnh báo) | 🟡 |
| 3.8 | Final Diagnosis & Treatment Plan | `/bac-si/danh-sach-kham` (`DoctorDiagnosisView`: timeline ca bệnh, ICD-10, `createDiagnosisConclusion`, `upsertTreatmentConsultation`) | ✅ |
| 3.9 | Prescription & Follow-up Schedule | `/bac-si/ke-don` (`DoctorPrescriptionView`), `/benh-nhan/ho-so-don-thuoc` (`PatientPrescriptionsView`) | ✅ |

---

## ✅ 3.9 – Màn kê đơn & tái khám ĐÃ HOÀN THÀNH & NỐI TOÀN BỘ API

Đã nối toàn bộ API backend vào [DoctorPrescriptionView.tsx](file:///d:/Kì%209/FE-Web/src/modules/doctor/DoctorPrescriptionView.tsx) và [PatientPrescriptionsView.tsx](file:///d:/Kì%209/FE-Web/src/modules/patient/PatientPrescriptionsView.tsx):

| Hành động trên UI | Trạng thái hiện tại | API backend đã kết nối |
|---|---|---|
| Lưu đơn thuốc | Đã kết nối API | `POST /prescriptions`, `PATCH /prescriptions/:id/items` |
| Cảnh báo an toàn thuốc | Đã kết nối + Modal Override | `GET /prescriptions/:id/alerts`, `PATCH /:id/alerts/:alertId/confirm` |
| Ký số CA | Modal nhập password xác thực chữ ký CA | `POST /prescriptions/:id/sign` |
| In / xuất PDF | Xuất PDF EMR chính thức và đánh dấu đã in | `GET /prescriptions/:id/export`, `PATCH /:id/printed` |
| Hẹn tái khám | Lấy ngày gợi ý tự động & đặt lịch follow-up | `GET /prescriptions/:id/followup/suggestion`, `POST /:id/followup` |
| Kết thúc lượt khám | Đóng encounter khi hoàn tất kê đơn không tái khám | `POST /prescriptions/encounters/:encounterId/finish` |

Đã hoàn thành thêm:
- Đã tạo `src/services/prescription/prescription.service.ts` đầy đủ method & TypeScript types.
- Đã tạo màn [PatientPrescriptionsView.tsx](file:///d:/Kì%209/FE-Web/src/modules/patient/PatientPrescriptionsView.tsx) và gắn tab tại `/benh-nhan/ho-so-don-thuoc` cho bệnh nhân xem đơn thuốc điện tử, tải/in PDF, xem lịch tái khám.
- Đã xây dựng [RescheduleAppointmentModal.tsx](file:///d:/Kì%209/FE-Web/src/modules/patient/components/RescheduleAppointmentModal.tsx) kết nối `PATCH /appointments/:id/reschedule` cho bệnh nhân tự đổi ngày/giờ tái khám.

## 🟡 3.7 – Còn phần giả lập
- [AiImagingAnalysisCard.tsx](file:///d:/Kì%209/FE-Web/src/modules/doctor/components/AiImagingAnalysisCard.tsx) không gọi API nào. Vùng bất thường chỉ là overlay giả, và có nút **"Simulate Lab Completion"** (`handleSimulateLabCompletion` ở [DoctorEMRView L1224](file:///d:/Kì%209/FE-Web/src/modules/doctor/DoctorEMRView.tsx#L1224)).
- Route `/xet-nghiem/upload-dicom` và `/canh-bao` cùng render `LabOrdersView` như hàng chờ, không có màn riêng.
- `LabRoomsView.tsx` có file nhưng không có route.

## Những file/màn có code nhưng không dùng hoặc toàn mock
| File | Ghi chú |
|---|---|
| `reception/ReceptionCheckinView.tsx` | Không có route, 0 API (mock) |
| `patient/PatientInsuranceView.tsx`, `PatientConsentView.tsx`, `PatientImportRecordView.tsx` | 0 API, dữ liệu mock |
| `patient/PatientMedicalRecordView.tsx` | Chỉ đọc lịch sử encounter. Dị ứng / tiền sử là state cục bộ, chưa lưu |
| `reception/ReceptionWalkinBookingForm/Modal` | Lỗi thiếu `doctorId` (xem báo cáo trước) |

---

## Kết luận
- **Đủ màn hình và đã nối API:** 3.1 → 3.6, 3.8, 3.9 (đã hoàn thành nối toàn bộ 6 nhóm API kê đơn, ký số CA, kiểm tra an toàn, in/xuất PDF, hẹn tái khám và đổi lịch).
- **Gần đủ:** 3.7 (cần bỏ nút simulate, nối AI imaging thật nếu nằm trong scope).
