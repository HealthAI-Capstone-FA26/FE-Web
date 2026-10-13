# BẢNG TỔNG HỢP THAY ĐỔI BACKEND TRÊN NHÁNH `dev_updated`
## Hướng Dẫn Tích Hợp & Điều Chỉnh Giao Diện Frontend (FE-Web)
> **Cập nhật ngày:** 13/10/2026  
> **Nhánh Backend:** `dev_updated` (`healthcare-ai-capstone`)  
> **Trạng thái Build BE:** Đã build thành công (`npm run build` -> Exit code 0, 0 lỗi TypeScript).  
> **Base URL:** `http://localhost:3000/api/v1` (Swagger Docs: `http://localhost:3000/api/docs`)

---

## 1. THAY ĐỔI CỐT LÕI VỀ KIẾN TRÚC & PHẠM VI (ARCHITECTURAL CHANGES)

| Nội dung | Phiên bản cũ (Trước đây) | Phiên bản mới (`dev_updated`) | Tác động trực tiếp lên UI Frontend |
| :--- | :--- | :--- | :--- |
| **Phạm vi Chuyên khoa** | Đa chuyên khoa bệnh viện tổng quát (Khám tổng quát, Nội, Ngoại, Nhi...) | **Chuyên khoa Tim mạch Duy nhất (Cardiology Clinic Only)** | **GỠ BỎ** tính năng chọn khoa, đổi khoa (`department-change`), gợi ý chuyển khoa (`department-suggestion`). Giao diện tập trung 100% vào chuyên khoa Tim mạch. |
| **Phân bổ / Điều phối Bác sĩ** | Phân bổ theo Khoa phòng (`staff-department`) | **Hàng đợi Bác sĩ Đơn chuyên khoa (`EncounterDoctorRoutingService`)** | Sau khi Điều dưỡng đo sinh hiệu xong, hệ thống tự động xếp bệnh nhân vào hàng đợi (`DoctorQueueEntry`) của bác sĩ tim mạch đang trực có **tải thấp nhất**. |
| **Phạm vi Trí tuệ Nhân tạo (AI)** | AI tóm tắt hồ sơ EMR, RAG, AI gợi ý chẩn đoán (Accept/Reject) | **AI Phân tích Bất thường Sóng Điện Tâm Đồ (ECG Anomaly Detection - Time Series)** | **GỠ BỎ** AI gợi ý chẩn đoán / AI tóm tắt EMR. **NÂNG CẤP & TẬP TRUNG** vào biểu đồ chuỗi thời gian sóng điện tim (12-chuyển đạo ECG) và bảng cảnh báo nhịp tim bất thường (Rung nhĩ, Nhồi máu cơ tim, Ngoại tâm thu...). |
| **Dịch vụ Cận lâm sàng** | Các xét nghiệm tổng quát chung | **4 Dịch vụ Cận lâm sàng Tim mạch Trọng điểm:**<br>1. Xét nghiệm máu (Blood Test: Men tim Troponin, CK-MB, NT-proBNP)<br>2. Điện tâm đồ (ECG / EKG)<br>3. X-quang tim phổi thẳng (Chest X-ray)<br>4. Siêu âm tim Doppler (Echocardiogram) | FE hiển thị tab 4 phòng chức năng chuyên biệt, form nhập kết quả theo đúng các chỉ số tim mạch chuẩn. |
| **Luồng Sau Xét nghiệm (SE05)** | Chưa có module riêng | **Bổ sung Phân hệ `PostTestConsultationModule` (SE05)** | Bổ sung màn hình xem Case Timeline toàn diện, form Kết luận chẩn đoán chính thức (ICD-10) và form Tư vấn phương án điều trị. |

---

## 2. CHI TIẾT CÁC MODULE API MỚI TRÊN `dev_updated`

### 2.1. Phân Hệ Mới: Khám Lại & Tư Vấn Sau Cận Lâm Sàng (SE05 - Post-Test Consultation)
> Toàn bộ các API thuộc module này là **MỚI 100%** vừa được merge trong commit `2c044a1`.

#### 1. API Xem Tiến Trình Bệnh Án Dòng Thời Gian (Case Timeline)
* **Endpoint:** `GET /api/v1/post-test-consultation/encounters/:encounterId/timeline`
* **Mô tả:** Trả về toàn bộ dữ liệu tổng hợp theo trình tự thời gian thực cho ca khám:
  - Thông tin bệnh nhân + Tiền sử bệnh án & Dị ứng (hồ sơ dài hạn).
  - Cờ `readyForConclusion` (`boolean`): Tự động trả về `true` khi **toàn bộ chỉ định cận lâm sàng đã hoàn tất** (`completed`).
  - Danh sách cảnh báo nguy hiểm đang mở (`unresolvedAlerts`: cảnh báo chỉ số máu vượt ngưỡng, cảnh báo nhịp tim bất thường từ AI ECG).
  - Dòng sự kiện tăng dần (Chronological events): Lý do khám -> Sinh hiệu -> Khám lâm sàng -> Chẩn đoán sơ bộ -> Chỉ định CLS -> Kết quả CLS -> Bản ghi ECG & AI -> Tư vấn điều trị.
* **Việc cần làm trên FE:** Dùng API này làm nguồn dữ liệu chính cho trang Bác sĩ xem lại ca bệnh sau khi bệnh nhân làm xong xét nghiệm.

#### 2. API Ghi Nhận Kết Luận Chẩn Đoán Chính Thức (Diagnosis Conclusion)
* **Endpoint:** `POST /api/v1/post-test-consultation/encounters/:encounterId/diagnosis-conclusion`
* **Quyền:** Chỉ Bác sĩ (`DOCTOR`).
* **Điều kiện:** Ca khám phải ở trạng thái `awaiting_review` (sau khi hoàn thành các chỉ định CLS).
* **Request Body:**
  ```json
  {
    "icd10Code": "I25.1",
    "diagnosisName": "Bệnh tim thiếu máu cục bộ xơ vữa động mạch",
    "isPrimary": true,
    "notes": "Kết quả siêu âm tim EF 48%, ST chênh xuống ở V4-V6",
    "diagnosedAt": "2026-10-13T14:30:00.000Z"
  }
  ```
  *(Lưu ý: Chẩn đoán final đầu tiên tự động là primary nếu không truyền `isPrimary: true`. Bác sĩ tự kết luận dựa trên kết quả CLS, không còn nút Accept/Reject AI).*
* **Endpoint lấy danh sách chẩn đoán final:** `GET /api/v1/post-test-consultation/encounters/:encounterId/diagnosis-conclusion`

#### 3. API Tư Vấn Điều Trị (Treatment Consultation)
* **Endpoint:** `PUT /api/v1/post-test-consultation/encounters/:encounterId/treatment-consultation`
* **Phương thức:** `PUT` (Upsert 1-1 theo ca khám).
* **Điều kiện:** Ca khám ở trạng thái `awaiting_review` và đã có ít nhất 1 chẩn đoán chính thức (`final`).
* **Request Body:**
  ```json
  {
    "conditionExplanation": "Bệnh nhân bị hẹp mạch vành mức độ trung bình, chức năng tâm thu thất trái giảm nhẹ.",
    "treatmentPlan": "Điều trị nội khoa bảo tồn, kiểm soát huyết áp và mỡ máu, theo dõi định kỳ.",
    "lifestyleAdvice": "Hạn chế muối < 5g/ngày, bỏ thuốc lá hoàn toàn, đi bộ nhẹ nhàng 30 phút mỗi ngày.",
    "nutritionAdvice": "Tăng cường rau xanh, cá hồi, giảm mỡ động vật và thức ăn nhanh.",
    "followUpRequired": true,
    "followUpIntervalDays": 14,
    "consultedAt": "2026-10-13T14:45:00.000Z"
  }
  ```
  *(Lưu ý: Nếu `followUpRequired = true`, bắt buộc truyền `followUpIntervalDays` (1-730 ngày). Lịch hẹn tái khám chính thức sẽ do bước SE06 tạo).*
* **Endpoint xem tư vấn:** `GET /api/v1/post-test-consultation/encounters/:encounterId/treatment-consultation`

---

### 2.2. Phân Hệ Khám Lâm Sàng & Chỉ Định CLS (SE02 - Doctor Pre-Examination)

#### 1. Bắt đầu ca khám
* **Endpoint:** `POST /api/v1/doctor-examination/encounters/:encounterId/start`
* **Chức năng:** Chuyển trạng thái lượt khám từ `waiting_for_doctor` sang `in_consultation`.

#### 2. Khám thực thể lâm sàng Tim Mạch
* **Endpoint:** `POST /api/v1/doctor-examination/encounters/:encounterId/clinical-examination`
* **Request Body:** Ghi nhận nhìn, sờ, gõ, nghe tim (tiếng tim T1/T2, âm thổi, rung miêu, phù, tiếng rale phổi...).
* **Endpoint xem:** `GET /api/v1/doctor-examination/encounters/:encounterId/clinical-examination`

#### 3. Chẩn đoán sơ bộ (Initial Diagnosis)
* **Endpoint:** `POST /api/v1/doctor-examination/encounters/:encounterId/diagnoses`
* **Request Body:** `{ icd10Code: string, diagnosisName?: string, diagnosisType: "initial" | "differential", isPrimary?: boolean, notes?: string }`
* **Endpoint xem:** `GET /api/v1/doctor-examination/encounters/:encounterId/diagnoses`

#### 4. Ra chỉ định Cận lâm sàng (Test Ordering)
* **Endpoint:** `POST /api/v1/doctor-examination/encounters/:encounterId/test-orders`
* **QUY TẮC MỚI:** Bắt buộc truyền `diagnosisId` (Chỉ định gắn liền với chẩn đoán sơ bộ).
* **Request Body:**
  ```json
  {
    "diagnosisId": "uuid-cua-chan-doan-so-bo",
    "clinicalNotes": "Nghi ngờ nhồi máu cơ tim cấp, chỉ định ECG và men tim khẩn",
    "items": [
      { "serviceId": "uuid-dich-vu-ecg", "priority": "urgent" },
      { "serviceId": "uuid-dich-vu-troponin", "priority": "urgent" }
    ]
  }
  ```
* **Endpoint tra cứu danh mục dịch vụ CLS:** `GET /api/v1/doctor-examination/services`

---

### 2.3. Phân Hệ Thực Hiện Cận Lâm Sàng & Phân Tích AI ECG (SE04 - Paraclinical & AI)

#### 1. Bản ghi Điện tâm đồ (ECG Recording)
* **Tải lên / Tạo bản ghi ECG:** `POST /api/v1/lab-tasks/:taskId/ecg-recordings`
* **Lấy URL stream/download tín hiệu sóng ECG:** `GET /api/v1/ecg-recordings/:id/signal-url`

#### 2. Phân tích AI sóng ECG (Time-Series Anomaly Detection)
* **Kích hoạt AI chạy phân tích:** `POST /api/v1/ecg-recordings/:id/analyses`
* **Xem kết quả phân tích AI:** `GET /api/v1/ecg-recordings/:id/analyses`
  - Trả về danh sách bất thường: `afib`, `pvc`, `pac`, `vt`, `bradycardia`, `tachycardia`, `st_elevation`, `st_depression`, `av_block`.
* **Xem cảnh báo bất thường ECG của ca khám:** `GET /api/v1/encounters/:encounterId/ecg-anomaly-events`
* **Xác nhận / Đánh giá cảnh báo:**
  - `PATCH /api/v1/ecg-anomaly-events/:eventId/acknowledge` (Xác nhận đã đọc)
  - `PATCH /api/v1/ecg-anomaly-events/:eventId/resolve` (Đánh dấu đã xử lý)
  - `PATCH /api/v1/ecg-anomaly-events/:eventId/review` (Bác sĩ đánh giá: `accepted` | `rejected` | `modified`)

#### 3. Nhập kết quả xét nghiệm máu & Chẩn đoán hình ảnh
* **Nhập kết quả xét nghiệm:** `POST /api/v1/lab-tasks/:id/results`
* **Đính kèm hình ảnh (Siêu âm tim, X-quang):** `POST /api/v1/lab-results/:id/attachments`
* **Kiểm tra cảnh báo đỏ xét nghiệm:** `POST /api/v1/lab-results/:id/detect-alerts`
* **Lấy cảnh báo giá trị nguy kịch:** `GET /api/v1/encounters/:encounterId/result-alerts`
* **Xác nhận cảnh báo:** `PATCH /api/v1/result-alerts/:alertId/confirm`

---

### 2.4. Phân Hệ Tiếp Đón & Điều Phối (SE01 - Reception & Intake)
* **Điều phối vào hàng đợi Bác sĩ Tim mạch:** `POST /api/v1/encounters/:id/route-doctor` (Gọi sau khi hoàn tất đo sinh hiệu).
* **Hoàn tất tiếp đón tại quầy:** `POST /api/v1/encounters/:id/complete-registration`.
* **Lý do khám (Chief Complaint):** `POST /api/v1/encounters/:encounterId/chief-complaint` & `GET`.
* **Xác minh danh tính (CCCD/BHYT):** `POST /api/v1/encounters/:encounterId/identity-verifications` & `GET`.
* **Giấy cam kết (Consent):** `POST /api/v1/consents`, `GET /api/v1/consents`, `GET /api/v1/consent-policies`, `PATCH /api/v1/consents/:id/revoke`.
* **Tiền sử dị ứng:** `POST /api/v1/patients/:patientId/allergies`, `GET`, `PATCH /api/v1/allergies/:id/status`.
* **Tiền sử bệnh lý:** `POST /api/v1/patients/:patientId/medical-history`, `GET`, `PATCH /api/v1/medical-history/:id/status`.

---

### 2.5. Phân Hệ Viện Phí & Thanh Toán (SE03 - Billing & Payment)
* **Tạo hóa đơn viện phí:** `POST /api/v1/invoices/generate` (`invoiceType`: `'consultation'` hoặc `'diagnostics'`).
* **Tra cứu / In hóa đơn PDF:** `GET /api/v1/invoices`, `GET :id`, `GET :id/pdf`.
* **Thanh toán tiền mặt:** `POST /api/v1/payments/cash` và xác nhận `POST /api/v1/payments/cash/:id/confirm`.
* **Thanh toán chuyển khoản ngân hàng (PayOS / VietQR):** `POST /api/v1/payments/bank-transfer` và webhook tự động `POST /api/v1/payments/bank-transfer/webhook`.

---

### 2.6. Phân Hệ Đo Sinh Hiệu & Sàng Lọc (SE02 - Triage & Vitals)
* **Hàng đợi đo sinh hiệu:** `GET /api/v1/triage-queue`, `POST /api/v1/triage-queue/dequeue`.
* **Ghi nhận chỉ số sinh hiệu:** `POST /api/v1/vital-sessions` (Mạch, Huyết áp tâm thu/trương, SpO2, BMI...).
* **Kiểm tra cảnh báo sinh hiệu nguy hiểm:** `POST /api/v1/vital-sessions/:id/detect-alerts`.

---

## 3. CHECKLIST CÁC FILE TRÊN FRONTEND (FE-WEB) CẦN ĐIỀU CHỈNH

| STT | File / Màn hình FE | Công việc cần thực hiện | Mức độ ưu tiên |
| :---: | :--- | :--- | :---: |
| **1** | `src/modules/doctor/DoctorDiagnosisView.tsx` | - Tích hợp gọi API `POST /api/v1/post-test-consultation/encounters/:id/diagnosis-conclusion` thay vì mock fallback.<br>- Bỏ các nút AI gợi ý chẩn đoán (AI proposal / accept / reject).<br>- Tích hợp Form tư vấn điều trị gọi API `PUT .../treatment-consultation`. | **Cao nhất (P0)** |
| **2** | `src/services/doctor/post-test-consultation.service.ts` | **TẠO MỚI service**: Viết các hàm gọi 5 API của SE05 (`getTimeline`, `createDiagnosisConclusion`, `getDiagnosisConclusions`, `upsertTreatmentConsultation`, `getTreatmentConsultation`). | **Cao nhất (P0)** |
| **3** | `src/modules/doctor/DoctorCaseTimelineView.tsx` | - Cập nhật nạp dữ liệu từ `GET .../timeline`.<br>- Hiển thị cờ `readyForConclusion` để kích hoạt thông báo cho Bác sĩ khi toàn bộ CLS đã hoàn thành. | **Cao (P1)** |
| **4** | `src/modules/lab/LabOrdersView.tsx` & `ECGViewer.tsx` | - Cập nhật luồng tiếp nhận 4 phòng CLS tim mạch.<br>- Gọi API upload bản ghi ECG & kích hoạt AI phân tích sóng.<br>- Hiển thị nhãn bất thường ECG (`afib`, `st_elevation`,...) lên biểu đồ thời gian thực. | **Cao (P1)** |
| **5** | `src/modules/doctor/test-order.service.ts` | - Thay thế mảng hardcode `AVAILABLE_TEST_CATALOG` bằng API `GET /api/v1/doctor-examination/services`.<br>- Bổ sung bắt buộc truyền `diagnosisId` khi gọi `POST .../test-orders`. | **Trung bình (P2)** |
| **6** | `src/modules/reception/` | - Gỡ bỏ mọi dropdown chọn Chuyên khoa/Khoa phòng.<br>- Nối API `POST /api/v1/encounters/:id/route-doctor` tự động sau khi đo sinh hiệu. | **Trung bình (P2)** |
| **7** | `src/modules/patient/PatientConsentView.tsx` | - Nối trực tiếp với `consent.service.ts` (`createConsent`, `revokeConsent`, `getPolicies`). | **Trung bình (P2)** |

---

## 4. HƯỚNG DẪN TEST TOÀN TRÌNH TRÊN MÔI TRƯỜNG DEV

1. **Khởi động Backend:**
   ```powershell
   cd "d:\Kì 9\backend\healthcare-ai-capstone\backend"
   npm run dev
   ```
   *Kiểm tra Swagger tại:* `http://localhost:3000/api/docs`

2. **Khởi động Frontend:**
   ```powershell
   cd "d:\Kì 9\FE-Web"
   npm run dev
   ```

3. **Luồng kiểm thử mẫu chuẩn lâm sàng:**
   - **B1 (Lễ tân):** Check-in bệnh nhân -> Nhập Chief Complaint -> Ký Consent -> Thu phí khám ban đầu.
   - **B2 (Điều dưỡng):** Gọi ca từ Triage Queue -> Nhập Sinh hiệu (BP, Pulse, SpO2) -> Hệ thống tự động điều phối vào bác sĩ tim mạch có tải thấp nhất (`route-doctor`).
   - **B3 (Bác sĩ khám đầu):** Bấm "Bắt đầu khám" -> Nhập khám lâm sàng tim mạch -> Nhập Chẩn đoán sơ bộ -> Ra chỉ định Cận lâm sàng (ECG + Troponin).
   - **B4 (Thu ngân):** Xuất hóa đơn CLS -> Thu tiền (tiền mặt / PayOS) -> Chuyển trạng thái sang `PAID`.
   - **B5 (Phòng Lab):** Tiếp nhận ca -> Upload tín hiệu ECG -> Chạy AI phân tích bất thường -> Nhập kết quả men tim -> Hệ thống chuyển ca sang `awaiting_review`.
   - **B6 (Bác sĩ kết luận - SE05 MỚI):** Xem Case Timeline tổng hợp -> Kết luận chẩn đoán chính thức (ICD-10) -> Nhập tư vấn điều trị & gợi ý số ngày tái khám.
   - **B7 (Kê đơn):** Kê đơn thuốc tim mạch -> Tạo lịch hẹn tái khám tương lai -> Hoàn tất ca khám (`finished`).
