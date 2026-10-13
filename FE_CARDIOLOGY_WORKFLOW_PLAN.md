# KẾ HOẠCH PHÁT TRIỂN & ĐIỀU CHỈNH GIAO DIỆN FRONTEND (FE-WEB)
## Nền Tảng Quản Lý Khám Chữa Bệnh Chuyên Khoa Tim Mạch Tích Hợp AI (Cardiology Clinic EMR Platform)
> **Cập nhật theo Backend:** Nhánh `dev_updated` (`healthcare-ai-capstone`)  
> **Tham chiếu tài liệu kỹ thuật:** [BACKEND_DEV_UPDATED_CHANGELOG.md](file:///d:/Kì%209/FE-Web/BACKEND_DEV_UPDATED_CHANGELOG.md)

---

## 1. TỔNG QUAN THAY ĐỔI THEO ĐỀ ÁN MỚI

| Tiêu chí | Trước đây | Quy định mới trên `dev_updated` | Hướng xử lý trên FE |
| :--- | :--- | :--- | :--- |
| **Phạm vi Chuyên khoa** | Đa khoa tổng quát (Nhiều khoa phòng) | **Chuyên khoa Tim Mạch duy nhất (Cardiology Clinic Only)** | **Gỡ bỏ hoàn toàn** dropdown chọn/đổi chuyên khoa (`department-change`). Giao diện mặc định 100% chuyên khoa Tim mạch. |
| **Điều phối Bác sĩ** | Phân bổ thủ công theo phòng ban | **Tự động điều phối vào Bác sĩ Tim mạch đang trực có tải thấp nhất** | Gọi API `POST /api/v1/encounters/:id/route-doctor` ngay sau khi Điều dưỡng lưu sinh hiệu. |
| **Phạm vi Trí tuệ Nhân tạo (AI)** | AI tóm tắt EMR / RAG / AI gợi ý chẩn đoán (Accept/Reject) | **AI Phân tích Bất thường Sóng Điện Tâm Đồ (ECG Anomaly Detection - Time Series)** | **Gỡ bỏ** box AI đề xuất chẩn đoán ở bàn khám bác sĩ. **Nâng cấp** đồ thị sóng ECG 12 chuyển đạo và bảng cảnh báo nhịp tim bất thường (Rung nhĩ, Nhồi máu cơ tim...). |
| **Dịch vụ Cận lâm sàng** | Xét nghiệm tổng quát chung | **4 Dịch vụ Cận lâm sàng Tim mạch Trọng điểm:**<br>1. Xét nghiệm máu (Men tim Troponin, NT-proBNP)<br>2. Điện tâm đồ (ECG / EKG)<br>3. X-quang tim phổi thẳng (Chest X-ray)<br>4. Siêu âm tim Doppler (Echocardiography) | Phân tab 4 phòng chức năng rõ ràng, form nhập kết quả chuẩn theo từng chỉ số tim mạch. |
| **Khám lại sau CLS (SE05)** | Chưa chuẩn hóa API | **Bổ sung trọn bộ Phân hệ `PostTestConsultation` (SE05)** | Màn hình xem Case Timeline (cờ `readyForConclusion`), chẩn đoán chính thức (ICD-10) và tư vấn điều trị. |

---

## 2. BẢN ĐỒ 6 BƯỚC QUY TRÌNH LÂM SÀNG TRÊN GIAO DIỆN

```text
[BƯỚC 1: TIẾP ĐÓN] ──> [BƯỚC 2: ĐO SINH HIỆU] ──> [BƯỚC 3: KHÁM ĐẦU & CHỈ ĐỊNH CLS]
 (Quầy Lễ Tân)          (Phòng Điều Dưỡng)           (Phòng Khám Bác Sĩ)
                                                             │
[BƯỚC 6: KẾT LUẬN & TƯ VẤN] <── [BƯỚC 5: THỰC HIỆN CLS & AI ECG] <── [BƯỚC 4: THU PHÍ CLS]
 (Bác Sĩ - SE05 MỚI)             (4 Phòng Chức Năng Cận Lâm Sàng)     (Quầy Thu Ngân)
```

---

## 3. CHI TIẾT ĐIỀU CHỈNH GIAO DIỆN (UI/UX) THEO TỪNG BƯỚC

### BƯỚC 1: TIẾP ĐÓN & ĐĂNG KÝ KHÁM (MEDICAL REGISTRATION & RECEPTION)
* **Màn hình liên quan:** `ReceptionCheckinView.tsx`, `ReceptionWalkinBookingForm.tsx`, `ReceptionAppointmentsView.tsx`.
* **Hướng dẫn chỉnh sửa UI/UX:**
  1. **Đơn giản hóa giao diện tiếp đón:**
     - Ẩn/gỡ bỏ hoàn toàn dropdown "Chọn chuyên khoa / Khoa khám". Mặc định tiêu đề: **Phòng Khám Tim Mạch 4AM**.
  2. **Thu thập thông tin tiền khám:**
     - Lý do khám & Triệu chứng tim mạch chính (`ChiefComplaint`): Đau thắt ngực, khó thở khi gắng sức, hồi hộp, đánh trống ngực, phù chân...
     - Xác minh giấy tờ tùy thân CCCD / Thẻ BHYT (`IdentityVerification`).
     - Ký giấy cam kết / Chấp thuận điều trị (`Consent`).
  3. **Thu phí khám ban đầu:**
     - Xuất hóa đơn loại `consultation` trước khi chuyển bệnh nhân vào phòng đo sinh hiệu.

---

### BƯỚC 2: ĐO SINH HIỆU & ĐIỀU PHỐI BÁC SĨ TỰ ĐỘNG (NURSE TRIAGE)
* **Màn hình liên quan:** `NurseQueueView.tsx`, `NurseVitalModal.tsx`.
* **Hướng dẫn chỉnh sửa UI/UX:**
  1. **Form đo sinh hiệu:**
     - Các chỉ số: Mạch (Pulse), Huyết áp tâm thu/trương (BP), Nhịp thở, Nhiệt độ, SpO2, Chiều cao, Cân nặng, BMI.
     - Cảnh báo đổi màu đỏ/vàng khi huyết áp vượt ngưỡng nguy hiểm (Cơn tăng huyết áp > 180 mmHg) hoặc SpO2 < 95%.
  2. **Cơ chế điều phối tự động (Auto-Route):**
     - Khi điều dưỡng bấm **"Lưu sinh hiệu & Hoàn tất"**, FE tự động gọi API:  
       `POST /api/v1/encounters/:id/route-doctor`
     - Backend sẽ tự động xếp bệnh nhân vào hàng đợi của Bác sĩ Tim mạch đang trực có **tải thấp nhất**.
     - UI hiển thị Toast: *"Đã phân bệnh nhân vào phòng Bác sĩ [Tên BS] - Số thứ tự [Số TT]"*.

---

### BƯỚC 3: KHÁM BAN ĐẦU & CHỈ ĐỊNH CẬN LÂM SÀNG (DOCTOR PRE-EXAMINATION)
* **Màn hình liên quan:** `DoctorDiagnosisView.tsx` (phần khám đầu), `src/services/doctor/test-order.service.ts`.
* **Hướng dẫn chỉnh sửa UI/UX:**
  1. **Nút "Bắt đầu khám":** Gọi `POST /api/v1/doctor-examination/encounters/:id/start` khi bác sĩ tiếp nhận bệnh nhân.
  2. **Form Khám thực thể tim mạch lâm sàng:**
     - Nhìn, sờ mỏm tim, gõ diện đục, nghe tim (tiếng T1/T2, âm thổi tâm thu/tâm trương, gallop T3/T4, cọ màng tim).
  3. **Chẩn đoán sơ bộ (Initial Diagnosis):**
     - Tra cứu mã ICD-10 tim mạch (`POST /api/v1/doctor-examination/encounters/:id/diagnoses` với `diagnosisType = 'initial'`).
     - Lưu lại `diagnosisId` của chẩn đoán sơ bộ.
  4. **Form Chỉ định Cận lâm sàng (Diagnostic Test Orders):**
     - Nạp danh mục dịch vụ động từ API: `GET /api/v1/doctor-examination/services`.
     - 4 nhóm kỹ thuật tim mạch:
       - ⚡ Điện tâm đồ (ECG 12 chuyển đạo tiêu chuẩn)
       - 🩸 Xét nghiệm máu (Troponin I/T, CK-MB, NT-proBNP, Lipid, Điện giải)
       - 🫀 Siêu âm tim Doppler màu (Transthoracic Echocardiography - TTE)
       - 🩻 Chụp X-quang tim phổi thẳng
     - **Ràng buộc quan trọng:** Bắt buộc gửi kèm `diagnosisId` trong payload tạo y lệnh (`POST .../test-orders`).

---

### BƯỚC 4: THU PHÍ DỊCH VỤ CẬN LÂM SÀNG (EXPENSE PAYMENT)
* **Màn hình liên quan:** `ReceptionBillingView.tsx`, `ReceptionBillingWorkspaceView.tsx`.
* **Hướng dẫn chỉnh sửa UI/UX:**
  1. Hệ thống tự động tạo hóa đơn loại `diagnostics` gom các chỉ định vừa tạo ở Bước 3.
  2. Bảng kê chi tiết từng dịch vụ, đơn giá niêm yết và mức chi trả BHYT (nếu có).
  3. Modal thanh toán:
     - Tiền mặt tại quầy (`POST /api/v1/payments/cash`).
     - Chuyển khoản ngân hàng qua mã **VietQR PayOS** (`POST /api/v1/payments/bank-transfer`).
  4. Khi trạng thái hóa đơn đổi sang `PAID` $\rightarrow$ Mở khóa cho phòng Lab tiếp nhận ca.

---

### BƯỚC 5: THỰC HIỆN CẬN LÂM SÀNG & PHÂN TÍCH AI ECG (PARACLINICAL & AI)
* **Màn hình liên quan:** `LabOrdersView.tsx`, `components/ECGViewer.tsx`.
* **Hướng dẫn chỉnh sửa UI/UX:**
  1. **Rào chắn kiểm tra thanh toán:**
     - Nút "Tiếp nhận ca" chỉ kích hoạt khi hóa đơn đã thanh toán (`status = 'paid'`).
  2. **Giao diện 4 phòng chức năng chuyên biệt:**
     - 🩸 **Phòng Máu:** Nhập kết quả Troponin, NT-proBNP. Cảnh báo đỏ tức thì nếu Troponin vượt ngưỡng nhồi máu cơ tim.
     - ⚡ **Phòng Đo Điện Tim (ECG):**
       - Tải file tín hiệu sóng tim (`.csv` / `.json`).
       - Nút **"Phân tích AI"** gọi `POST /api/v1/ecg-recordings/:id/analyses`.
       - Hiển thị biểu đồ sóng 12 đạo trình kèm nhãn cảnh báo nhịp tim bất thường (*Rung nhĩ AFib, ST chênh lên, Ngoại tâm thu PVC, Block nhánh...*).
       - Thao tác xác nhận cảnh báo: *Acknowledge* (đã xem), *Resolve* (đã xử lý), *Review* (Bác sĩ đánh giá accepted/rejected).
     - 🫀 **Phòng Siêu âm tim:** Nhập phân suất tống máu EF (%), đường kính thất trái LVEDD, hở van tim + Đính kèm ảnh siêu âm.
     - 🩻 **Phòng X-quang:** Upload ảnh chụp X-quang tim phổi thẳng.
  3. **Chuyển trạng thái ca khám:**
     - Khi tất cả chỉ định đã có kết quả $\rightarrow$ Ca tự động chuyển sang trạng thái `awaiting_review` để mời bệnh nhân quay lại phòng Bác sĩ.

---

### BƯỚC 6: KẾT LUẬN CHUYÊN MÔN & TƯ VẤN ĐIỀU TRỊ (POST-TEST CONSULTATION - SE05 MỚI)
* **Màn hình liên quan:** [DoctorDiagnosisView.tsx](file:///d:/Kì%209/FE-Web/src/modules/doctor/DoctorDiagnosisView.tsx), `src/services/doctor/case-timeline.service.ts`.
* **Hướng dẫn chỉnh sửa UI/UX trọng tâm:**

#### 1. Hiển thị Case Timeline & Cờ Sẵn Sàng Kết Luận:
* Nạp dữ liệu từ: `GET /api/v1/post-test-consultation/encounters/:encounterId/timeline`.
* Kiểm tra `timelineData.readyForConclusion`:
  - `true`: Hiện banner xanh lá: *"✅ Tất cả kết quả Cận lâm sàng đã hoàn tất. Bác sĩ có thể ra kết luận chính thức."*
  - `false`: Hiện cảnh báo vàng: *"⏳ Vẫn còn xét nghiệm đang thực hiện, vui lòng chờ phòng Lab gửi đủ kết quả."*

#### 2. Gỡ bỏ hoàn toàn Logic AI Gợi Ý Chẩn Đoán (AI Proposal):
* Trong `DoctorDiagnosisView.tsx`:
  - **GỠ BỎ:** Box hiển thị "AI đề xuất chẩn đoán", "Độ tin cậy", các nút "Chấp nhận AI" / "Từ chối AI".
  - **THAY THẾ BẰNG:** Thanh tìm kiếm mã **ICD-10 Tim Mạch** trực tiếp (gợi ý nhanh Chương IX: `I20` Đau thắt ngực, `I21` Nhồi máu cơ tim, `I50` Suy tim, `I10` Tăng huyết áp, `I48` Rung nhĩ...).
  - Bác sĩ chọn mã ICD-10 và bấm nút **"Ghi nhận Kết luận Chẩn đoán Chính thức"** gọi:  
    `POST /api/v1/post-test-consultation/encounters/:encounterId/diagnosis-conclusion`
  - Payload gửi lên:
    ```json
    {
      "icd10Code": "I25.1",
      "diagnosisName": "Bệnh tim thiếu máu cục bộ xơ vữa động mạch",
      "isPrimary": true,
      "notes": "Kết quả siêu âm tim EF 48%, ST chênh xuống V4-V6",
      "diagnosedAt": "2026-10-13T14:30:00.000Z"
    }
    ```

#### 3. Form Tư Vấn Điều Trị (Treatment Consultation):
* Đặt ngay dưới phần chẩn đoán chính thức:
  - **Giải thích tình trạng bệnh:** TextArea (Bắt buộc).
  - **Phương án điều trị:** TextArea (Bắt buộc).
  - **Lời khuyên sinh hoạt:** TextArea (Giảm muối, hạn chế gắng sức...).
  - **Lời khuyên dinh dưỡng:** TextArea (Chế độ ăn cho người bệnh tim mạch).
  - **Cấu hình Hẹn tái khám:**
    - Checkbox: `[x] Có cần tái khám hay không` (`followUpRequired`).
    - Khi chọn `true`, hiển thị bộ chọn **Số ngày tới lần tái khám (`followUpIntervalDays`)**:
      - Các nút chọn nhanh: **[7 ngày]**, **[14 ngày]**, **[30 ngày]**, **[90 ngày]** hoặc ô nhập số ngày tự do (1 – 730 ngày).
      - *(Lưu ý: Không dùng ô chọn ngày tháng `followUpDate` cũ nữa)*.
  - Bấm nút **"Lưu Tư Vấn Điều Trị"** gọi:  
    `PUT /api/v1/post-test-consultation/encounters/:encounterId/treatment-consultation`

---

## 4. BẢNG CHECKLIST TRIỂN KHAI THEO THỨ TỰ ƯU TIÊN

| Thứ tự | Hạng mục cần thực hiện | File liên quan | Mức độ ưu tiên |
| :---: | :--- | :--- | :---: |
| **1** | Cập nhật `case-timeline.service.ts`: Sửa payload `submitDiagnosisConclusion` (gỡ bỏ các trường AI) và `submitTreatmentConsultation` (chuyển sang `followUpIntervalDays`). | [src/services/doctor/case-timeline.service.ts](file:///d:/Kì%209/FE-Web/src/services/doctor/case-timeline.service.ts) | **P0 (Khẩn cấp)** |
| **2** | Cập nhật [DoctorDiagnosisView.tsx](file:///d:/Kì%209/FE-Web/src/modules/doctor/DoctorDiagnosisView.tsx): Gỡ bỏ box AI gợi ý chẩn đoán, chuẩn hóa form kết luận ICD-10 và form tư vấn số ngày tái khám. | [src/modules/doctor/DoctorDiagnosisView.tsx](file:///d:/Kì%209/FE-Web/src/modules/doctor/DoctorDiagnosisView.tsx) | **P0 (Khẩn cấp)** |
| **3** | Cập nhật `test-order.service.ts`: Gọi API danh mục dịch vụ cận lâm sàng tim mạch `GET .../services` từ BE và bắt buộc truyền `diagnosisId` khi tạo order. | `src/services/doctor/test-order.service.ts` | **P1 (Cao)** |
| **4** | Cập nhật `Reception`: Gỡ bỏ toàn bộ dropdown chọn chuyên khoa/khoa phòng, tích hợp tự động gọi `route-doctor` sau khi đo sinh hiệu. | `src/modules/reception/` | **P2 (Trung bình)** |
| **5** | Nâng cấp `LabOrdersView.tsx` & `ECGViewer.tsx`: Phân 4 phòng CLS tim mạch, kích hoạt nút chạy AI phân tích ECG và hiển thị nhãn cảnh báo bất thường. | `src/modules/lab/` | **P2 (Trung bình)** |
