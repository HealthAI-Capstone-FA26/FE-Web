# Bệnh viện Đa khoa Mai Phương - Frontend Web Application

Dự án Frontend Web App phục vụ cho Cổng thông tin & Hệ thống Y tế của **Bệnh viện Đa khoa Mai Phương** (Thuộc Đồ án Tốt nghiệp Capstone - Mai Phương Health AI).

---

## 🚀 Công nghệ sử dụng (Tech Stack)

Dự án được xây dựng dựa trên các công nghệ web hiện đại nhất nhằm đảm bảo hiệu năng cao, trải nghiệm người dùng mượt mà và khả năng mở rộng tốt:

### 1. **Core Framework & Language**
- **[React 19](https://react.dev/)**: Thư viện JavaScript hàng đầu để xây dựng giao diện người dùng dựa trên Component.
- **[TypeScript](https://www.typescriptlang.org/)**: Ngôn ngữ mở rộng của JavaScript giúp kiểm soát kiểu dữ liệu chặt chẽ (Type-safe), giảm thiểu lỗi runtime và tối ưu hóa trải nghiệm lập trình.

### 2. **Build Tool & Dev Server**
- **[Vite 8](https://vitejs.dev/)**: Công cụ build thế hệ mới cực nhanh, hỗ trợ Hot Module Replacement (HMR) tức thì trong quá trình phát triển.

### 3. **Styling & UI Design**
- **[Tailwind CSS v4](https://tailwindcss.com/)**: Utility-first CSS Framework giúp thiết kế giao diện linh hoạt, hiện đại (Glassmorphism, Responsive Grid, Micro-animations).
- **PostCSS & Autoprefixer**: Tự động xử lý CSS và tối ưu tương thích đa trình duyệt.
- **[Lucide React](https://lucide.dev/)**: Bộ icon vector y tế & tiện ích sắc nét, nhẹ và nhất quán.

### 4. **Routing & Navigation**
- **[React Router DOM v7](https://reactrouter.com/)**: Thư viện điều hướng trang (SPA Client-side Routing), xử lý các tuyến đường trang chủ, trang chi tiết tin tức, chuyên khoa, v.v.

### 5. **Code Quality & Tooling**
- **[Oxlint](https://oxc.rs/docs/guide/usage/linter.html)**: Công cụ linter mã nguồn siêu nhanh bằng Rust giúp duy trì chất lượng mã nguồn sạch sẽ.

---

## 🛠️ Hướng dẫn cài đặt và chạy ứng dụng

### Yêu cầu môi trường:
- **Node.js**: `v18+` trở lên
- **npm** hoặc **yarn**

### Các bước khởi chạy:

1. **Cài đặt phụ thuộc (Dependencies):**
   ```bash
   npm install
   ```

2. **Khởi chạy môi trường phát triển (Dev Mode):**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173/`

3. **Kiểm tra lỗi mã nguồn (Linting):**
   ```bash
   npm run lint
   ```

4. **Đóng gói sản phẩm (Production Build):**
   ```bash
   npm run build
   ```

---

## 📁 Cấu trúc thư mục chính (Project Structure)

```text
FE_Webapp/
├── public/                  # Tài nguyên tĩnh (Favicon, hình ảnh AI)
│   ├── images/              # Ảnh thiết bị, tin tức, dịch vụ
│   └── favicon.svg          # Logo favicon MP
├── src/
│   ├── components/          # Các Reusable Component
│   │   ├── home/            # Các khối giao diện Homepage (Hero, News, Video,...)
│   │   └── layout/          # Header, Footer
│   ├── pages/               # Các trang chính (Home, NewsDetailPage,...)
│   ├── App.tsx              # Cấu hình Routes chính
│   └── main.tsx             # Entry point
├── index.html               # Thẻ HTML chính & Title web
├── package.json             # Danh sách dependencies & scripts
└── README.md                # Tài liệu dự án
```

---
*© 2026 Bệnh viện Đa khoa Mai Phương - HealthAI Capstone Project.*
