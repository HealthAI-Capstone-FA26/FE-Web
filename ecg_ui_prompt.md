# PROMPT — Thiết kế UI/UX & code FE tính năng ECG (Live Waveform + AI Anomaly)

> Copy toàn bộ phần dưới đây (từ "VAI TRÒ" trở đi) và đưa cho AI/FE dev. Ảnh mẫu đính kèm cùng prompt.

---

## 0. VAI TRÒ

Bạn là **Senior Frontend Engineer + UI/UX Designer** chuyên về dashboard y tế realtime và trực quan hoá tín hiệu sinh học (biosignal). Nhiệm vụ: thiết kế và hiện thực **module ECG** trong dự án `FE-Web` của hệ thống **Healthcare AI Capstone**, gồm:
1. Biểu đồ **sóng ECG chạy live** (giống monitor bệnh viện).
2. Biểu đồ **AI Anomaly Detection** phủ dải màu lên các đoạn bất thường (giống ảnh mẫu).
3. Panel cảnh báo, review của bác sĩ, upload bản ghi của KTV.

Code phải production-ready, TypeScript strict, không dùng `any`, chạy mượt 60fps.

---

## 1. BỐI CẢNH DỰ ÁN (BẮT BUỘC TUÂN THEO)

**Tech stack FE hiện có** (không tự ý thêm framework UI khác):
- React 19 + Vite 8 + TypeScript ~6
- TailwindCSS v4 (`@import "tailwindcss"`, token khai báo trong `@theme` ở `src/index.css`)
- `lucide-react` (icon), `motion` (animation), `socket.io-client` (realtime), `react-router-dom` v7
- Font: `--font-sans: "Be Vietnam Pro"`, `--font-serif: "Playfair Display"`
- Style chung: class `.glass-card` (nền trắng 75% + blur 12px, bo 24px, viền trắng mờ, shadow nhẹ), `.custom-scrollbar`
- Cấu trúc: `src/modules/{lab,doctor,nurse,...}`, `src/services/{domain}/*.service.ts`, `src/services/api.ts` (axios/fetch wrapper có Bearer token), `src/hooks/`, `src/types/`
- Đã có `src/hooks/useVitalAlertSocket.ts` → **tham khảo pattern này** để viết `useEcgAlertSocket.ts`.
- Phân quyền qua `src/hooks/useCan.ts`.

**Thư viện biểu đồ:** KHÔNG dùng Recharts/Chart.js cho sóng live (quá chậm với hàng chục nghìn điểm). Tự viết renderer bằng **Canvas 2D** (khuyến nghị) — hoặc nếu thật cần thì dùng `uPlot` (nhẹ, ~45KB). Ưu tiên Canvas tự viết.

---

## 2. HỢP ĐỒNG API BACKEND (NestJS) — dùng đúng các endpoint này

Tất cả cần `Authorization: Bearer <token>`.

### 2.1 ECG Recording
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/lab-tasks/:taskId/ecg-recordings` | Upload `multipart/form-data` (chỉ LAB_STAFF phụ trách, task `in_progress`, file ≤ 50MB) |
| GET | `/lab-tasks/:taskId/ecg-recordings` | Danh sách bản ghi của task (kèm tóm tắt analysis hiện hành) |
| GET | `/ecg-recordings/:id` | Chi tiết bản ghi + các lần phân tích AI + sự kiện bất thường |
| GET | `/ecg-recordings/:id/signal-url` | URL tạm (10 phút) để tải tín hiệu gốc → dùng để vẽ sóng |
| PATCH | `/ecg-recordings/:id/cancel` | Huỷ bản ghi (task còn `in_progress`) |

Field upload:
```ts
file: File                         // bắt buộc
recordingType: 'resting_12_lead' | 'continuous_monitoring' | 'holter' | 'rhythm_strip'
signalFormat: 'wfdb' | 'edf' | 'csv' | 'json' | 'dicom_ecg' | 'scp_ecg'   // wfdb = .zip gồm .hea + .dat
sampleRateHz: number               // vd 500
numLeads: number                   // vd 12
leadNames?: string                 // "I,II,III,aVR,aVL,aVF,V1,V2,V3,V4,V5,V6"
durationMs?: number; startedAt?: ISOString; endedAt?: ISOString
deviceModel?: string; deviceSerial?: string
acquisitionMeta?: string           // chuỗi JSON
autoAnalyze?: boolean              // default true
```
Lỗi cần map UI: `400` sai định dạng/metadata · `403` chưa thanh toán / không phải KTV phụ trách · `409` file trùng checksum.

### 2.2 ECG AI Analysis
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/ecg-recordings/:id/analyses` | Mọi lần phân tích (mới nhất trước) + events |
| POST | `/ecg-recordings/:id/analyses` | Chạy lại AI → `202` status `queued`. Body: `{ modelVersionId?: uuid, threshold?: 0..1 }`. `409` nếu đang có phân tích chưa xong |
| GET | `/ecg-analyses/:analysisId` | Chi tiết 1 lần phân tích |
| GET | `/encounters/:encounterId/ecg-anomaly-events?alertStatus=&severity=&reviewVerdict=` | Feed cảnh báo |
| PATCH | `/ecg-anomaly-events/:eventId/acknowledge` | active → acknowledged (DOCTOR/LAB_STAFF) |
| PATCH | `/ecg-anomaly-events/:eventId/resolve` | → resolved |
| PATCH | `/ecg-anomaly-events/:eventId/review` | Chỉ DOCTOR. Body `{ verdict: 'true_positive'|'false_positive'|'uncertain', note?: string(≤2000) }` |

### 2.3 Realtime
- Socket.IO namespace **`/lab-alerts`**, join room **`encounter:{encounterId}`**, lắng nghe event **`ecg-alert-update`** → cập nhật trạng thái analysis + danh sách anomaly mà không reload.

### 2.4 Kiểu dữ liệu (tạo trong `src/types/ecg.ts`)
```ts
export type EcgOverallResult = 'normal' | 'abnormal' | 'inconclusive' | 'poor_signal';
export type EcgSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EcgAnalysisStatus = 'queued' | 'running' | 'completed' | 'failed' | 'skipped';
export type EcgAlertStatus = 'active' | 'acknowledged' | 'resolved' | 'auto_dismissed';
export type EcgReviewVerdict = 'pending' | 'true_positive' | 'false_positive' | 'uncertain';
export type EcgAnomalyType =
  | 'afib' | 'pvc' | 'pac' | 'vt' | 'bradycardia' | 'tachycardia'
  | 'st_elevation' | 'st_depression' | 'av_block' | 'unclassified';

export interface EcgAnomalyEvent {
  id: string;
  anomalyType: EcgAnomalyType | null;   // null nếu model unsupervised
  score: number;                         // 0..1
  severity: EcgSeverity;
  startOffsetMs: number;                 // tính từ đầu recording
  endOffsetMs: number;
  affectedLeads: string[];
  heartRateBpm: number | null;
  details: Record<string, unknown> | null; // rPeaks, saliency, per-lead score...
  alertStatus: EcgAlertStatus;
  reviewVerdict: EcgReviewVerdict;
}

export interface EcgAnalysis {
  id: string;
  status: EcgAnalysisStatus;
  overallResult: EcgOverallResult | null;
  maxAnomalyScore: number | null;
  thresholdUsed: number | null;
  windowMs: number | null;
  strideMs: number | null;
  signalQuality: number | null;          // 0..1
  summaryMetrics: { hrMean?: number; hrMin?: number; hrMax?: number; abnormalDurationMs?: number } | null;
  inferenceLatencyMs: number | null;
  errorCode?: string | null;
  modelName?: string; modelVersion?: string;
  anomalies: EcgAnomalyEvent[];
}
```
> Nếu shape thực tế của response khác, hãy viết adapter `mapEcgAnalysisDto()` trong service, KHÔNG để component phụ thuộc trực tiếp vào DTO.

### 2.5 Về chế độ "LIVE"
Backend hiện **lưu file rồi phân tích**, chưa stream từng sample. Vì vậy:
- **Playback Live (mặc định):** tải tín hiệu từ `signal-url`, phát lại theo đúng `sampleRateHz` thời gian thực (25 mm/s) → trông như monitor đang chạy. Có Play/Pause/tốc độ 0.5×/1×/2×/4×.
- **Stream Live (sẵn sàng cho tương lai):** thiết kế `EcgDataSource` interface để sau này cắm socket stream sample vào **cùng ring buffer** mà không đổi renderer.
- Parse phía FE: hỗ trợ `csv` và `json` trực tiếp. Với `wfdb/edf/dicom_ecg/scp_ecg` hiển thị thông báo "Định dạng cần chuyển đổi phía server" (hoặc dùng endpoint preview nếu BE bổ sung). Parse trong **Web Worker** để không block UI.

---

## 3. MÀN HÌNH & LAYOUT (bám sát ảnh mẫu)

### 3.1 Bố cục tổng (desktop ≥ 1280px)
```
┌──────────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR 240px│ HEADER: Bệnh nhân · Mã lượt khám · Loại ghi · Thiết bị · Status│
│              ├──────────────────────────────────────────────────────────────┤
│ VIEW MODE    │ KPI CARDS (6 ô ngang, giống hàng "MSL | [73729,55] | ..." )   │
│ [Live][AI]   ├──────────────────────────────────────────────────────────────┤
│ [Review]     │ CARD 1: AI Anomaly Detection  · badge trạng thái · Pts · Reset│
│              │   legend màu │ canvas sóng + dải màu │ trục thời gian │ minimap│
│ RECORDINGS   ├──────────────────────────────────────────────────────────────┤
│ • Bản ghi 1 ✓│ CARD 2: Live ECG (Lead II) · ● Streaming... · Pts · Reset     │
│ • Bản ghi 2  │   canvas sweep live │ trục thời gian │ minimap │ player bar    │
│              ├────────────────────────────────────┬─────────────────────────┤
│ LEADS        │ CARD 3: Anomaly Events Table        │ CARD 4: Event Detail /  │
│ [I][II][III]…│                                     │ Doctor Review panel     │
└──────────────┴────────────────────────────────────┴─────────────────────────┘
```
- Tablet (768–1279): sidebar thu thành drawer, Card 3/4 xếp dọc.
- Mobile: chỉ hiển thị Live ECG + danh sách event; chart cao 220px; cho phép xoay ngang full-screen.

### 3.2 Sidebar (theo ảnh: nhóm "TASK" và "SELECT DATASET")
- **VIEW MODE** — segmented control 3 nút: `Live` · `AI Anomaly` · `Review` (nút active: viền xanh `#3B82F6`, nền trắng, chữ xanh; các nút còn lại chữ xám). Label nhóm: chữ hoa, 11px, `tracking-wider`, `text-slate-400`.
- **RECORDINGS** — list card, mỗi item: tên/giờ ghi, `recordingType`, chấm trạng thái (xanh = completed, vàng = analyzing, đỏ = failed). Item đang chọn: viền xanh 1.5px, nền `blue-50`, chấm xanh lá + icon ✓ bên phải (đúng như item "MSL" trong ảnh).
- **LEADS** — lưới chip 3 cột cho 12 đạo trình; chọn 1 (mặc định **II**) hoặc multi-select để xem nhiều lead xếp chồng. Lead có anomaly (`affectedLeads`) có chấm đỏ nhỏ.

### 3.3 KPI cards (6 ô ngang — hỗ trợ 2 chế độ: Benchmark Dataset & Clinical)
Mỗi ô: `.glass-card` biến thể nhỏ (bo 14px, padding 16px), label 11px xám, value 20px semibold, số dùng `font-variant-numeric: tabular-nums`. Animate số bằng `motion` (count-up 400ms) khi dữ liệu đổi.

- **Chế độ Benchmark / Mô phỏng (khớp 100% hàng trên cùng ảnh mẫu `MSL | [73729, 55] | <f8 | 73729 | 55 | 10.53%`, áp dụng cho `ECG_A`):**
  1. **DATASET**: `ECG_A` (hoặc tên bản ghi đang chọn)
  2. **SHAPE**: `[1841, 2]` (`[numSamples, numLeads]`)
  3. **DTYPE**: `<f8` (float64 little-endian)
  4. **SAMPLES / TIME STEPS**: `1841`
  5. **CHANNELS / LEADS**: `2` (`Lead I`, `Lead II`)
  6. **ANOMALY RATIO**: `14.61%` (`269 / 1841` mẫu bất thường — **tô chữ đỏ `#DC2626` khi > 10%**, giống ô `10.53%` trong ảnh)

- **Chế độ Lâm sàng (toggle hoặc hiển thị dòng phụ bên dưới mỗi ô khi xem ca khám thật):**
  1. **Nhịp tim** — `hrMean` bpm (live: tính realtime từ R-peak), kèm min–max nhỏ bên dưới.
  2. **Kết quả AI** — `overallResult` dạng badge: normal (xanh lá), abnormal (đỏ), inconclusive (vàng), poor_signal (xám).
  3. **Điểm bất thường max** — `maxAnomalyScore` (0–1) + thanh progress so với `thresholdUsed`.
  4. **Chất lượng tín hiệu** — `signalQuality` % + icon tín hiệu 4 vạch.
  5. **Số sự kiện** — tổng anomaly, tách theo severity (chấm màu).
  6. **% thời gian bất thường** — `abnormalDurationMs / durationMs` (tô đỏ `#DC2626` nếu > 10%).

### 3.4 CARD 1 — Anomaly Detection (API 3) (giống hệt chart trên trong ảnh)
- **Header:** tiêu đề bold 14px `Anomaly Detection (API 3)` + text trạng thái xanh lá 12px nhấp nháy nhẹ: `Evaluating with anomaly-transformer...` khi `queued/running` (hoặc đang chạy mô phỏng); `Hoàn tất · {inferenceLatencyMs}ms` khi xong. Bên phải: pill `Pts: 544` (số điểm đang render sau downsample, hoặc `Pts: 1841` khi xem full `ECG_A`) và nút `Reset Zoom` (outline, 12px).
- **Legend & Logic 4 nhãn đối chiếu (Confusion States: Ground-Truth `gt` vs AI Prediction `pred` — giống hệt ảnh mẫu):**
  Tại mỗi mẫu thời gian $i \in [0 .. N-1]$, gọi `gt[i] ∈ {0, 1}` là nhãn chuẩn (từ `ECG_test_label.npy` hoặc bác sĩ xác nhận) và `pred[i] ∈ {0, 1}` là nhãn AI dự đoán (suy ra từ các đoạn `[startOffsetMs, endOffsetMs]` có `score >= thresholdUsed`):
  - 🟩 **`Detected (1-1)`** (`gt = 1` và `pred = 1` — True Positive): màu `#86EFAC` (`rgba(34, 197, 94, 0.28)`) — AI bắt đúng đoạn bất thường.
  - 🟨 **`Missed (1-0)`** (`gt = 1` và `pred = 0` — False Negative): màu `#FCD34D` (`rgba(234, 179, 8, 0.35)`) — Đoạn bất thường thực tế nhưng AI bỏ sót.
  - 🟥 **`False alarm (0-1)`** (`gt = 0` và `pred = 1` — False Positive): màu `#FCA5A5` (`rgba(239, 68, 68, 0.28)`) — Tín hiệu bình thường nhưng AI báo nhầm.
  - ⬜ **`Normal (0-0): no color`** (`gt = 0` và `pred = 0` — True Negative): ô vuông viền xám nét đứt, không tô màu nền trên chart.
  - *Trường hợp ca khám lâm sàng chưa có Ground-Truth file:* lấy `reviewVerdict` của bác sĩ để suy ra (`true_positive` → `1-1`, `false_positive` → `0-1`, `uncertain`/`pending` → `1-0` màu vàng), kèm toggle phụ **"Tô theo mức độ (Severity)"**: low `#FEF3C7`, medium `#FDE68A`, high `#FDBA74`, critical `#FCA5A5`.
- **Vùng vẽ (cao 200px):**
  - Gom các mẫu liền kề có cùng trạng thái `(gt[i], pred[i])` khác `0-0` thành các segment `[startIdx, endIdx]` để vẽ dải màu dọc full-height. Đoạn rất ngắn (< 2px) vẫn vẽ tối thiểu `2px` để nhìn thấy rõ như các vạch mảnh màu đỏ/vàng trong ảnh.
  - Đường tín hiệu màu đỏ `#B91C1C`, `1.25px`. Với `ECG_A`, biên độ nằm trong `[-3.72, 1.235]` nên trục Y mặc định từ `-4` đến `2` (hoặc auto-scale có padding 15%).
  - **Đường baseline / reference** ngang tại `y = 0` màu xanh cổ vịt `#0F766E` `1.5px` (giống đường xanh ngang tại mốc 0 trong ảnh mẫu) + tuỳ chọn bật overlay đường `anomalyScore` (`0..1`) và `thresholdUsed` nét đứt.
  - Gridline ngang `#E5E7EB` 1px; trục Y bên trái (biên độ mV / normalized value), trục X dưới `Time/Index` hiển thị chỉ số mẫu `0 .. 1841` hoặc thời gian `mm:ss.SSS` (toggle).
- **Minimap (cao 36px)** dưới trục X: toàn bộ tín hiệu downsample, nền `#EEF2FF`, vùng đang xem là khung xanh `#93C5FD` có 2 tay nắm tròn trái/phải để kéo co giãn (giống thanh brush trong ảnh). Kéo khung = pan; kéo tay nắm = zoom.
- **Hover** dải màu: tooltip glass gồm nhãn `1-1 / 1-0 / 0-1`, loại bất thường (tiếng Việt: AFib → "Rung nhĩ", PVC → "Ngoại tâm thu thất", PAC → "Ngoại tâm thu nhĩ", VT → "Nhịp nhanh thất", bradycardia → "Nhịp chậm", tachycardia → "Nhịp nhanh", st_elevation → "ST chênh lên", st_depression → "ST chênh xuống", av_block → "Block nhĩ thất", unclassified/null → "Bất thường chưa phân loại"), `Index: [start..end]`, thời gian, score, severity, lead, HR.
- **Click** dải màu → zoom tới đoạn đó (±50 mẫu hoặc ±1s padding) + mở Event Detail (Card 4) + đồng bộ Card 2 nhảy tới vị trí.

### 3.5 CARD 2 — Live ECG (giống chart dưới trong ảnh, nhưng chạy live)
- **Header:** "Sóng ECG trực tiếp · Lead II" + chấm xanh lá nhấp nháy + text `Streaming...` (pause → chấm xám, "Tạm dừng"). Bên phải: `Pts`, `Reset Zoom`, nút toggle **"Giấy ECG"**, nút full-screen.
- **Hai kiểu hiển thị (toggle):**
  1. **Sweep mode (mặc định — giống monitor bệnh viện):** con trỏ quét từ trái sang phải; khi tới mép phải quay lại trái và **ghi đè** sóng cũ, phía trước con trỏ có **khoảng xoá (eraser gap) ~ 40ms** để thấy rõ điểm đang vẽ. Đầu bút có chấm sáng + glow.
  2. **Scroll mode:** sóng trôi từ phải sang trái, điểm mới nhất ở mép phải.
- **Cửa sổ thời gian:** 5s / 10s (mặc định) / 20s / 30s.
- **Thang chuẩn y khoa:** 25 mm/s, 10 mm/mV; chọn gain 5/10/20 mm/mV. Có **xung chuẩn 1mV** (hình chữ nhật) ở đầu dải.
- **Chế độ "Giấy ECG":** nền `#FFF5F5`, lưới ô nhỏ 1mm `#FBD5D5` 0.5px, ô lớn 5mm `#F5A3A3` 1px, sóng màu đen `#111827`. Chế độ thường: nền trắng, sóng đỏ `#B91C1C` như ảnh mẫu.
- **Dark monitor theme (tuỳ chọn):** nền `#0B1220`, lưới `#13233A`, sóng xanh neon `#22C55E` + `shadowBlur: 6`.
- **Đánh dấu realtime:** khi con trỏ playback đi qua đoạn anomaly → tô nền đoạn đó theo màu severity, hiện **badge nổi** phía trên ("⚠ PVC · 0.87") trượt vào bằng `motion`; nếu severity `critical` → viền card nháy đỏ 2 lần + (tuỳ chọn, mặc định tắt) tiếng beep.
- **R-peak markers:** tam giác nhỏ xám trên đỉnh R (nếu `details.rPeaks` có), hiển thị khoảng RR khi hover.
- **Player bar** dưới minimap: ⏮ ⏯ ⏭ · thanh tiến trình có các vạch màu của anomaly (bấm để nhảy) · `00:12.480 / 00:30.000` · tốc độ 0.5×/1×/2×/4× · nút "Theo dõi trực tiếp" (về đầu mới nhất).
- **Multi-lead:** khi chọn nhiều lead → xếp chồng các dải (mỗi dải cao 90px, nhãn lead ở góc trái), dùng chung trục thời gian và con trỏ quét. Layout 12 đạo trình chuẩn 3×4 + rhythm strip Lead II ở dưới cho `resting_12_lead`.

### 3.6 CARD 3 — Bảng sự kiện bất thường
Cột: Thời gian (start–end) · Loại · Severity (badge) · Score (mini bar) · Lead · HR · Trạng thái cảnh báo · Review · Hành động.
- Filter chip theo `alertStatus`, `severity`, `reviewVerdict` (gọi lại API với query).
- Click hàng → đồng bộ chart (zoom + highlight viền đậm dải màu tương ứng).
- Hàng `active` + `critical` có viền trái đỏ 3px.
- Hành động: `Đã nhận` (acknowledge), `Đóng` (resolve) — optimistic update, rollback + toast khi lỗi (409 → "Cảnh báo không còn ở trạng thái active").

### 3.7 CARD 4 — Chi tiết sự kiện & Review của bác sĩ
- Mini chart phóng to đoạn bất thường (±2s), đánh dấu R-peak, saliency heatmap (nếu `details.saliency`) dạng dải gradient dưới sóng.
- Thông tin: loại, score, severity, lead, HR, model/version, threshold.
- **Chỉ DOCTOR** (`useCan`) thấy khối review: 3 nút lớn dạng radio-card — ✅ "AI đúng" (xanh lá) · ❌ "AI báo nhầm" (đỏ) · ❓ "Chưa chắc" (vàng) + textarea ghi chú (đếm ký tự /2000) + nút "Lưu đánh giá". Cho phép sửa lại (ghi đè), hiện "Đã đánh giá bởi … lúc …".
- Nút "Chạy lại AI" (LAB_STAFF/DOCTOR): mở modal chọn model version + slider threshold 0–1 (bước 0.01) → POST, chuyển trạng thái `queued`.
- Tab "So sánh phân tích": chọn 2 analysis → hiển thị 2 hàng dải màu chồng nhau trên cùng trục để so sánh model.

### 3.8 Màn hình Upload (LAB_STAFF, trong `LabWorkspaceView`)
- Dropzone lớn (viền nét đứt, icon `Upload`), nhận `.csv .json .edf .zip .dcm .scp`, giới hạn 50MB, hiển thị tên/size.
- Form: recordingType (select có mô tả), signalFormat (tự đoán theo đuôi file, cho sửa), sampleRateHz (preset 250/360/500/1000), numLeads, leadNames (chip input, preset "12 đạo trình chuẩn"), thời gian bắt đầu/kết thúc, thiết bị, checkbox "Tự động phân tích AI".
- **Preview trước khi upload** (csv/json): vẽ nhanh 10s đầu Lead II để KTV kiểm tra tín hiệu.
- Progress bar upload (axios `onUploadProgress`), map lỗi 400/403/409 sang thông báo tiếng Việt rõ ràng.

---

## 4. ĐẶC TẢ KỸ THUẬT RENDERER (QUAN TRỌNG NHẤT)

### 4.1 Kiến trúc
```
EcgDataSource (interface)
 ├─ PlaybackDataSource  (signal-url → Worker parse → Float32Array per lead → phát theo sampleRate)
 └─ SocketDataSource    (tương lai: nhận chunk qua socket)
        │ push(chunk: Float32Array[], t0Ms)
        ▼
RingBuffer (Float32Array, capacity = sampleRate × windowSec × 2, per lead)
        ▼
EcgCanvasRenderer (requestAnimationFrame, đọc buffer, vẽ dirty-region)
        ▼
<canvas> (layer nền grid) + <canvas> (layer sóng) + <canvas>/<div> (overlay: cursor, tooltip, band)
```
- **3 lớp canvas chồng nhau**: lớp grid (vẽ 1 lần, chỉ vẽ lại khi resize/zoom), lớp sóng (mỗi frame), lớp overlay (hover/cursor).
- Hỗ trợ **HiDPI**: `canvas.width = cssWidth * devicePixelRatio`, `ctx.scale(dpr, dpr)`.
- `ResizeObserver` cho responsive; debounce 100ms.
- Sweep mode chỉ `clearRect` vùng hẹp phía trước con trỏ (eraser gap) và vẽ đoạn mới → không vẽ lại cả canvas mỗi frame.
- Mỗi frame tính `samplesToDraw = sampleRate × speed × deltaTime`; dùng `performance.now()` để không lệch nhịp khi tab bị throttle; khi tab ẩn (`visibilitychange`) thì pause.
- Vẽ path bằng 1 `beginPath()` + nhiều `lineTo()` + 1 `stroke()`; `lineJoin = 'round'`.

### 4.2 Downsampling
- Khi số mẫu > số pixel ngang × 2: dùng **min-max decimation theo cột pixel** (giữ nguyên đỉnh QRS — không được dùng trung bình vì sẽ làm mất đỉnh R).
- Overview/minimap: dùng **LTTB** (Largest-Triangle-Three-Buckets) ~ 1000–2000 điểm, tính sẵn trong Worker.
- Pill `Pts: N` hiển thị số điểm thực tế đang vẽ.

### 4.3 Zoom / Pan
- Wheel = zoom quanh vị trí chuột (trục X); `Shift + wheel` = pan; kéo chuột = pan; kéo + `Ctrl` = chọn vùng zoom (rubber-band).
- Pinch-zoom trên touch.
- Giới hạn zoom: tối thiểu 0.5s, tối đa toàn bộ bản ghi.
- `Reset Zoom` animate về toàn cảnh (300ms ease-out).
- Card 1 và Card 2 có thể **"Liên kết trục thời gian"** (toggle icon 🔗) để zoom/pan đồng bộ.

### 4.4 Hiệu năng (tiêu chí bắt buộc)
- 60fps ổn định với 12 lead × 500Hz trên laptop tầm trung; không có React re-render mỗi frame (state chart giữ trong `useRef`, chỉ đưa ra state React những thứ hiển thị chữ, throttle 4 lần/giây).
- Parse file + tính LTTB trong Web Worker; truyền `ArrayBuffer` bằng transferable.
- Bộ nhớ: bản ghi Holter dài → chỉ giữ dữ liệu theo chunk, lazy-load khi pan.

---

## 5. TRẠNG THÁI UI (phải thiết kế đủ)
| Trạng thái | Hiển thị |
|---|---|
| Đang tải tín hiệu | Skeleton sóng (đường ECG xám mờ chạy shimmer) |
| Analysis `queued` | Badge xám "Đang chờ phân tích" + spinner nhỏ |
| Analysis `running` | Badge xanh "Đang phân tích với {model}..." chữ nhấp nháy, thanh tiến trình indeterminate trên Card 1 |
| `completed` | Dải màu fade-in lần lượt (stagger 20ms) |
| `failed` | Banner đỏ nhạt: "Phân tích AI lỗi ({errorCode}). Quy trình khám vẫn tiếp tục." + nút "Chạy lại" |
| `skipped` | Banner xám: "Chưa cấu hình dịch vụ AI — chỉ hiển thị tín hiệu" |
| `poor_signal` | Banner vàng + gợi ý "Kiểm tra điện cực / ghi lại" |
| Signal URL hết hạn (10 phút) | Tự gọi lại `/signal-url` khi 403/expired, trong suốt với người dùng |
| Mất socket | Chấm cam "Mất kết nối realtime — đang thử lại", tự reconnect, khi có lại thì refetch analyses |
| Không có bản ghi | Empty state minh hoạ sóng ECG + CTA "Tải bản ghi ECG" (chỉ LAB_STAFF) |
| Định dạng chưa hỗ trợ vẽ | Thông báo rõ + vẫn hiển thị kết quả AI dạng timeline |

---

## 6. DESIGN TOKENS (thêm vào `@theme` trong `index.css`)
```css
@theme {
  --color-ecg-wave: #B91C1C;
  --color-ecg-wave-paper: #111827;
  --color-ecg-wave-monitor: #22C55E;
  --color-ecg-score: #0F766E;
  --color-ecg-grid: #E5E7EB;
  --color-ecg-paper-bg: #FFF5F5;
  --color-ecg-paper-minor: #FBD5D5;
  --color-ecg-paper-major: #F5A3A3;
  --color-ecg-tp: #86EFAC;      /* true_positive */
  --color-ecg-fp: #FCA5A5;      /* false_positive */
  --color-ecg-uncertain: #FCD34D;
  --color-sev-low: #FEF3C7;
  --color-sev-medium: #FDE68A;
  --color-sev-high: #FDBA74;
  --color-sev-critical: #F87171;
  --color-brush: #93C5FD;
  --color-brush-bg: #EEF2FF;
}
```
- Typography: tiêu đề card 14px/600, label 11–12px/500 `slate-500`, số liệu `tabular-nums`, trục chart 10px `slate-500`.
- Bo góc: card lớn 20px, card nhỏ 14px, pill 999px. Khoảng cách card 16px.
- Canvas đọc màu từ CSS variables qua `getComputedStyle` để đổi theme không cần sửa code.

---

## 7. TƯƠNG TÁC & TRẢI NGHIỆM
- Phím tắt: `Space` play/pause · `←/→` lùi/tiến 1s · `+/-` zoom · `0` reset zoom · `N`/`P` nhảy tới anomaly kế tiếp/trước · `F` full-screen · `G` bật/tắt giấy ECG.
- Crosshair dọc khi hover, tooltip hiển thị: thời gian `mm:ss.SSS`, biên độ mV, sample index.
- Thước đo (caliper): giữ `Alt` + kéo để đo khoảng thời gian (ms) và quy đổi ra bpm — tính năng bác sĩ rất hay dùng.
- Xuất ảnh: nút "Xuất PNG" đoạn đang xem (kèm thông tin bệnh nhân, thang đo) để đính kèm kết quả.
- Toast dùng component sẵn có của dự án; text toàn bộ tiếng Việt.

## 8. ACCESSIBILITY
- Màu dải bất thường **luôn kèm pattern/nhãn** (vd sọc chéo cho false_positive) để người mù màu phân biệt.
- Canvas có `role="img"` + `aria-label` tóm tắt ("ECG Lead II, 30 giây, 5 sự kiện bất thường"); bảng sự kiện là nguồn dữ liệu truy cập được bằng bàn phím.
- Tôn trọng `prefers-reduced-motion`: tắt glow/nhấp nháy, giữ sweep.
- Tương phản chữ ≥ 4.5:1.

## 9. PHÂN QUYỀN (dùng `useCan`)
| Hành động | LAB_STAFF | DOCTOR | NURSE/khác |
|---|---|---|---|
| Upload / huỷ bản ghi | ✅ (task của mình) | ❌ | ❌ |
| Xem sóng & kết quả AI | ✅ | ✅ | ✅ (chỉ xem) |
| Chạy lại AI | ✅ | ✅ | ❌ |
| Acknowledge / Resolve | ✅ | ✅ | ❌ |
| Review AI đúng/sai | ❌ | ✅ | ❌ |
Ẩn hẳn nút không có quyền (không chỉ disable).

---

## 10. CẤU TRÚC FILE ĐỀ XUẤT
```
src/
├─ types/ecg.ts
├─ services/lab/ecg.service.ts              # gọi API + adapter DTO → model
├─ hooks/
│   ├─ useEcgAlertSocket.ts                 # /lab-alerts, room encounter:{id}, 'ecg-alert-update'
│   ├─ useEcgRecording.ts                   # detail + analyses + refetch
│   └─ useEcgPlayback.ts                    # play/pause/seek/speed
├─ modules/lab/ecg/
│   ├─ EcgWorkspacePage.tsx                 # layout tổng (mục 3.1)
│   ├─ EcgSidebar.tsx
│   ├─ EcgKpiCards.tsx
│   ├─ EcgAnomalyChartCard.tsx              # Card 1
│   ├─ EcgLiveChartCard.tsx                 # Card 2
│   ├─ EcgEventsTable.tsx                   # Card 3
│   ├─ EcgEventDetailPanel.tsx              # Card 4 + review
│   ├─ EcgUploadForm.tsx
│   ├─ ReanalyzeModal.tsx
│   └─ chart/
│       ├─ EcgCanvas.tsx                    # wrapper React cho renderer
│       ├─ renderer/EcgCanvasRenderer.ts    # thuần TS, không phụ thuộc React
│       ├─ renderer/gridLayer.ts
│       ├─ renderer/bandLayer.ts
│       ├─ renderer/sweep.ts
│       ├─ data/RingBuffer.ts
│       ├─ data/EcgDataSource.ts
│       ├─ data/PlaybackDataSource.ts
│       ├─ math/minMaxDecimate.ts
│       ├─ math/lttb.ts
│       ├─ Minimap.tsx
│       └─ workers/ecgParser.worker.ts      # parse csv/json + LTTB
└─ modules/doctor/  → tái sử dụng EcgWorkspacePage với mode="review"
```

## 11. DỮ LIỆU MÔ PHỎNG CHUẨN TỪ BỘ `ECG_A` (BẮT BUỘC HỖ TRỢ)

Dự án có sẵn thư mục dữ liệu thực nghiệm `ECG_A` (model **Anomaly Transformer**) gồm `ECG_train.npy`, `ECG_test.npy`, `ECG_test_label.npy`. UI phải tích hợp sẵn bộ `ECG_A` này làm dataset mô phỏng mặc định (bên cạnh dữ liệu tổng hợp hoặc API thật) khi bật `VITE_ECG_MOCK=true` hoặc khi chọn dataset `ECG_A` trên Sidebar.

### 11.1 Đặc tả chính xác bộ dữ liệu `ECG_A`
| Tệp | Shape | Dtype | Thứ tự bộ nhớ | Min → Max | Ý nghĩa trên UI |
|---|---|---|---|---|---|
| `ECG_train.npy` | `(1833, 2)` | `<f8` (float64) | `fortran_order: True` | `-3.655` → `0.940` | Chuỗi huấn luyện bình thường (1833 mẫu × 2 kênh: `Lead I`, `Lead II`) |
| `ECG_test.npy` | `(1841, 2)` | `<f8` (float64) | `fortran_order: True` | `-3.720` → `1.235` | Chuỗi kiểm thử hiển thị trên chart: **1841 mẫu thời gian × 2 kênh** (`col0`: `[-3.235, 1.235]`, mẫu đầu `-0.72`; `col1`: `[-3.720, 1.0]`, mẫu đầu `+0.70`) |
| `ECG_test_label.npy` | `(1841,)` | `<f8` (`0` / `1`) | `fortran_order: False` | `0` hoặc `1` | Nhãn Ground-Truth tại từng điểm thời gian: có **269 điểm = 1** (chiếm **14.61%**), nằm liên tục tại đoạn **index `[498 .. 766]`** (độ dài 269 mẫu) |

> **Cực kỳ quan trọng khi đọc `.npy`:** `ECG_test.npy` có cờ `fortran_order: True` (column-major). Trong mảng phẳng `3682` số float64:
> - **`1841` phần tử đầu tiên `[0 .. 1840]`** là toàn bộ cột 0 (**Lead I**).
> - **`1841` phần tử tiếp theo `[1841 .. 3681]`** là toàn bộ cột 1 (**Lead II**).
> Không được đọc xen kẽ theo hàng `(2*i, 2*i+1)` vì sẽ làm hỏng hoàn toàn hình dạng sóng!

### 11.2 Script chuyển đổi `ECG_A` sang `public/mock/ecg_a.json` và `ecg_a_test.csv`
Tạo script `scripts/export-ecg-a.cjs` (chạy bằng Node.js thuần, không cần Python) để xuất:
1. `public/mock/ecg_a.json` — nạp trực tiếp vào chế độ mô phỏng trên Frontend.
2. `public/mock/ecg_a_test.csv` — dùng để test tính năng Upload file thật vào `POST /lab-tasks/:taskId/ecg-recordings` (`signalFormat: 'csv'`, `numLeads: 2`, `leadNames: 'I,II'`, `sampleRateHz: 100`).

```js
// scripts/export-ecg-a.cjs
const fs = require("fs");
const path = require("path");

function readNpy(filePath) {
  const buf = fs.readFileSync(filePath);
  const major = buf[6];
  const headerLen = major === 1 ? buf.readUInt16LE(8) : buf.readUInt32LE(8);
  const offset = (major === 1 ? 10 : 12) + headerLen;
  const header = buf.slice(major === 1 ? 10 : 12, offset).toString("latin1").trim();
  const f64 = new Float64Array(buf.buffer, buf.byteOffset + offset, (buf.byteLength - offset) / 8);
  return { header, data: f64 };
}

const srcDir = "d:/Kì 9 - Nháp/ECG_A";
const outDir = path.resolve(__dirname, "../public/mock");
fs.mkdirSync(outDir, { recursive: true });

const test = readNpy(path.join(srcDir, "ECG_test.npy")).data;
const label = readNpy(path.join(srcDir, "ECG_test_label.npy")).data;
const N = 1841;

// fortran_order = True -> cột 0 trước, cột 1 sau
const leadI = Array.from(test.slice(0, N));
const leadII = Array.from(test.slice(N, 2 * N));
const gtLabels = Array.from(label).map((v) => (v > 0 ? 1 : 0));

fs.writeFileSync(
  path.join(outDir, "ecg_a.json"),
  JSON.stringify({
    dataset: "ECG_A",
    shape: [N, 2],
    dtype: "<f8",
    sampleRateHz: 100, // 1 mẫu = 10ms -> tổng 18.410ms
    leads: ["I", "II"],
    anomalyCount: 269,
    anomalyRatio: 14.61,
    groundTruthSegments: [{ startIndex: 498, endIndex: 766, startOffsetMs: 4980, endOffsetMs: 7660 }],
    signals: { I: leadI, II: leadII },
    groundTruth: gtLabels,
  })
);

const csv = ["I,II", ...leadI.map((v, i) => `${v},${leadII[i]}`)].join("\n");
fs.writeFileSync(path.join(outDir, "ecg_a_test.csv"), csv);
```

### 11.3 Thuật toán tạo 4 nhãn dải màu `1-1 / 1-0 / 0-1 / 0-0` trên Card 1
Viết hàm thuần `buildConfusionSegments(groundTruth: (0|1)[], predicted: (0|1)[]): ConfusionSegment[]`:
```ts
export type ConfusionKind = '1-1' | '1-0' | '0-1' | '0-0';

export interface ConfusionSegment {
  kind: Exclude<ConfusionKind, '0-0'>; // '1-1' = Detected | '1-0' = Missed | '0-1' = False alarm
  startIndex: number;
  endIndex: number;
  startOffsetMs: number;
  endOffsetMs: number;
}
```
- Với mỗi index $i \in [0..1840]$:
  - `gt[i] === 1 && pred[i] === 1` → `'1-1'` (**Detected** — tô xanh lá `#86EFAC`)
  - `gt[i] === 1 && pred[i] === 0` → `'1-0'` (**Missed** — tô vàng `#FCD34D`)
  - `gt[i] === 0 && pred[i] === 1` → `'0-1'` (**False alarm** — tô đỏ `#FCA5A5`)
  - `gt[i] === 0 && pred[i] === 0` → `'0-0'` (**Normal** — không vẽ dải màu)
- Gộp các điểm liên tiếp cùng `kind` thành 1 segment `[startIndex, endIndex]`.
- Quy đổi thời gian với `sampleRateHz = 100`: `offsetMs = index * 10`.
- **Dữ liệu AI dự đoán mô phỏng (`mockAiPred`) cho `ECG_A` để hiển thị đủ cả 3 màu giống ảnh mẫu:**
  - Ground-truth `gt = 1` tại `[498 .. 766]`.
  - Cho AI dự đoán `pred = 1` tại:
    - `[505 .. 758]` → sinh ra vùng xanh lá lớn **`Detected (1-1)`** ở `[505 .. 758]`, và 2 dải vàng **`Missed (1-0)`** ở hai biên `[498 .. 504]` & `[759 .. 766]`.
    - Các vệt ngắn ngoài vùng bất thường: `[212 .. 216]`, `[1145 .. 1150]`, `[1580 .. 1584]` → sinh ra các vạch đỏ mảnh **`False alarm (0-1)`** giống hệt ảnh mẫu.

### 11.4 Kịch bản mô phỏng đồng bộ 2 biểu đồ (API 2 Live Telemetry + API 3 Anomaly Detection)
1. **Khi chọn `ECG_A` ở Sidebar:**
   - Hàng 6 ô KPI hiển thị ngay: `ECG_A` · `[1841, 2]` · `<f8` · `1841` · `2` · `14.61%` (chữ đỏ).
2. **Card 2 — `Live Telemetry (API 2) Streaming...`:**
   - Bơm dần mẫu từ `0 → 1840` vào `RingBuffer` với tốc độ `100 mẫu/giây` (hoặc tốc độ người dùng chọn `0.5× / 1× / 2× / 4×`).
   - Có 2 chế độ xem:
     - **Full Timeline Stream** (giống ảnh mẫu): trục X cố định `0 .. 1841`, đường sóng đỏ vẽ dần từ trái sang phải, pill `Pts: {currentCount}` tăng dần tới `1841` (hoặc `Pts: 544` khi downsample). Khi chạm `1841` tự động lặp vòng mới hoặc dừng tuỳ nút `Loop`.
     - **Hospital Monitor Sweep**: cửa sổ `600` mẫu (6 giây), con trỏ quét kèm khoảng xoá `eraser gap`.
3. **Card 1 — `Anomaly Detection (API 3) Evaluating with anomaly-transformer...`:**
   - Cứ mỗi cửa sổ `windowMs = 1000` (100 mẫu) mà Card 2 stream xong, Card 1 cập nhật đường sóng tới vị trí đó và **fade-in các dải màu `1-1`, `1-0`, `0-1`** vừa được đánh giá.
4. **Payload chuẩn khớp Backend NestJS (`EcgAnalyzeResult` trong `http-ecg-anomaly.provider.ts`):**
   Khi test luồng API/Adapter với `ECG_A` (`sampleRateHz = 100`), sử dụng payload mẫu sau:
   ```json
   {
     "overallResult": "abnormal",
     "maxAnomalyScore": 0.94,
     "thresholdUsed": 0.5,
     "windowMs": 1000,
     "strideMs": 100,
     "signalQuality": 0.98,
     "summaryMetrics": {
       "dataset": "ECG_A",
       "shape": [1841, 2],
       "dtype": "<f8",
       "anomalyCount": 269,
       "anomalyRatio": 0.1461,
       "hrMean": 76,
       "abnormalDurationMs": 2690
     },
     "inferenceLatencyMs": 142,
     "anomalies": [
       {
         "anomalyType": "pvc",
         "score": 0.94,
         "severity": "high",
         "startOffsetMs": 5050,
         "endOffsetMs": 7580,
         "affectedLeads": ["I", "II"],
         "heartRateBpm": 88,
         "details": { "startIndex": 505, "endIndex": 758, "confusion": "1-1" }
       },
       {
         "anomalyType": "unclassified",
         "score": 0.62,
         "severity": "low",
         "startOffsetMs": 2120,
         "endOffsetMs": 2160,
         "affectedLeads": ["I"],
         "heartRateBpm": 74,
         "details": { "startIndex": 212, "endIndex": 216, "confusion": "0-1" }
       }
     ]
   }
   ```

## 12. TIÊU CHÍ NGHIỆM THU
- [ ] Layout giống ảnh mẫu: sidebar chọn mode/dataset (`ECG_A`), hàng 6 ô KPI (`ECG_A | [1841, 2] | <f8 | 1841 | 2 | 14.61%`), 2 chart xếp dọc, mỗi chart có `Pts` + `Reset Zoom` + minimap brush.
- [ ] Đọc đúng thứ tự `fortran_order: True` của `ECG_A` (2 kênh `Lead I`, `Lead II`, 1841 mẫu, biên độ `[-3.72, 1.235]`).
- [ ] Card 1 hiển thị đúng 4 trạng thái Legend & dải màu: `Detected (1-1)` xanh lá, `Missed (1-0)` vàng, `False alarm (0-1)` đỏ, `Normal (0-0)` không màu, bám đúng vùng bất thường `[498..766]`.
- [ ] Card 2 chạy sóng live mượt 60fps (hỗ trợ cả Full Timeline Stream như ảnh mẫu và Sweep Monitor có eraser gap), play/pause/seek/speed hoạt động.
- [ ] Zoom/pan/brush đồng bộ giữa 2 chart khi bật liên kết.
- [ ] Click event ở bảng ↔ chart đồng bộ hai chiều.
- [ ] Realtime: nhận `ecg-alert-update` → UI cập nhật không reload; mất kết nối có thông báo & tự hồi phục.
- [ ] Đủ mọi trạng thái ở mục 5; lỗi API hiển thị tiếng Việt.
- [ ] Phân quyền đúng bảng mục 9.
- [ ] Responsive tablet/mobile; HiDPI nét; không re-render React mỗi frame.
- [ ] `npm run build` và `npm run lint` (oxlint) pass, không `any`.

## 13. CÁCH LÀM VIỆC
1. Trước khi code: đọc `src/index.css`, `src/services/api.ts`, `src/hooks/useVitalAlertSocket.ts`, `src/hooks/useCan.ts`, `src/modules/lab/LabWorkspaceView.tsx` để theo đúng convention.
2. Làm theo thứ tự: types → service + mock → renderer thuần (RingBuffer, decimate, grid, sweep) → `EcgCanvas` → Card 2 Live → Card 1 Anomaly + minimap → KPI → bảng + panel review → upload → socket → polish (animation, a11y, responsive).
3. Mỗi bước xong phải chạy được với mock data.
4. Không thay đổi backend; nếu thiếu dữ liệu (vd parse WFDB/EDF, preview signal JSON) thì ghi rõ đề xuất API cần bổ sung ở cuối.
