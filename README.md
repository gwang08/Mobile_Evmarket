# Mobile EVMarket

Ứng dụng di động (Expo React Native) cho thị trường mua bán xe và pin xe điện. Cung cấp trải nghiệm duyệt sản phẩm, xem chi tiết pin/xe, quản lý ví, thanh toán và hồ sơ người dùng.

## 🚀 Công nghệ chính

- **Expo** ~54
- **React Native** 0.81 & React 19
- **TypeScript**
- **React Navigation** (Bottom Tabs + Stack)
- **Axios** (API client có interceptor token)
- **AsyncStorage** (lưu token & user)
- **Vector Icons** (@expo/vector-icons / react-native-vector-icons)

## 📂 Cấu trúc thư mục

```text
.
├── App.tsx                  # Điểm vào ứng dụng
├── app.json                 # Cấu hình Expo
├── index.js                 # Đăng ký root
├── tsconfig.json            # Cấu hình TypeScript
├── package.json             # Scripts & dependencies
├── assets/                  # Icon, splash, favicon
├── components/              # UI components tái sử dụng
├── config/api.ts            # Cấu hình axios + interceptors
├── contexts/AuthContext.tsx # Quản lý auth, token, user state
├── navigation/              # Điều hướng Root & Tabs
├── screens/                 # Các màn hình chính (Home, Login, Detail,...)
├── services/                # Gọi API (battery, vehicle, user, wallet)
└── types/                   # Khai báo types dùng chung
```

## ✨ Tính năng hiện có

- Đăng ký / Đăng nhập (lưu token, tự logout khi 401)
- Duyệt danh sách xe & pin
- Xem chi tiết: xe, pin, người bán
- Thêm thanh toán / Checkout cơ bản
- Quản lý ví (Wallet)
- Hồ sơ người dùng (Profile)
- Interceptor tự động đính kèm Bearer token & xử lý hết hạn

## 🧩 Kiến trúc & Nguyên tắc

- Tầng `services/` tách biệt gọi API → dễ test & thay đổi endpoint
- `AuthContext` giữ trạng thái toàn cục (user + token) & đồng bộ AsyncStorage
- Components nhỏ, chuyên biệt → tái sử dụng ở nhiều screen
- Điều hướng phân lớp: RootNavigator (Stack) + TabNavigator (Bottom Tabs)

## 🔐 Xử lý xác thực

- Token lưu trong `AsyncStorage` dưới key `accessToken`
- Interceptor thêm header `Authorization: Bearer <token>` nếu có
- Khi API trả 401 → xoá token + user → Context nhận biết và chuyển hướng đăng nhập

## 🌐 API

Hiện tại base URL được hardcode trong `config/api.ts`:

```text
https://evmarket-api-staging-backup.onrender.com/api/v1
```

Bạn có thể chuyển sang dùng biến môi trường bằng cách:

1. Cài thư viện: `expo install expo-constants` (nếu cần) hoặc dùng `react-native-dotenv`
2. Tạo file `.env`:

```env
API_BASE_URL=https://evmarket-api-staging-backup.onrender.com/api/v1
```

3. Điều chỉnh `config/api.ts` để đọc từ env.

## 🛠 Yêu cầu hệ thống

- Node.js ≥ 18
- Expo CLI (nên dùng expo trong npx) / Expo Go app trên thiết bị
- Yarn hoặc npm (tuỳ chọn)

## 📦 Cài đặt

```bash
# Cài dependencies
npm install
# hoặc
yarn
```

npm start
npm run ios
## ▶️ Chạy ứng dụng

```bash
# Khởi động dev server (QR)
npm start

# Mở Android emulator / thiết bị
npm run android

# Mở iOS simulator (macOS)
npm run ios

# Chạy trên web
npm run web
```

## 🧪 Kiểm thử

(Hiện chưa cấu hình test). Gợi ý:

- Thêm Jest + React Native Testing Library
- Test services (mock axios) & components quan trọng

eas login
## 📤 Build & Phát hành (Gợi ý)

Sử dụng EAS:

```bash
npm install -g eas-cli
eas login
EAS_PROJECT_ID=... eas build -p android --profile preview
```

(Chưa tích hợp trong repo — cần thêm `eas.json`).

## 🔄 Mở rộng đề xuất

- Thêm bộ nhớ cache offline (react-query / tanstack query)
- State management nâng cao (Zustand / Redux Toolkit) nếu phức tạp hơn
- Đa ngôn ngữ (i18n)
- Dark mode
- Thêm phân trang & skeleton loading
- Thử CI (GitHub Actions) lint + test + build

## 🐞 Gỡ lỗi nhanh

| Vấn đề | Nguyên nhân thường gặp | Cách xử lý |
|--------|------------------------|------------|
| 401 liên tục | Token hết hạn hoặc bị xoá | Đăng nhập lại, kiểm tra interceptor |
| Không fetch được API | Sai baseURL / mạng | Kiểm tra `config/api.ts`, thử curl |
| App không chạy trên thiết bị | Chưa cài Expo Go / cùng mạng | Mở Expo Go, scan QR, kiểm tra firewall |

## 📚 Scripts

| Script | Mục đích |
|--------|---------|
| `npm start` | Khởi động Expo Dev Tools |
| `npm run android` | Mở trên Android |
| `npm run ios` | Mở trên iOS (macOS) |
| `npm run web` | Chạy bản web |

## 📄 License

(Thêm nội dung giấy phép nếu cần, ví dụ MIT).

## 🤝 Đóng góp

1. Fork repo
2. Tạo nhánh mới: `feat/tinh-nang-x`
3. Commit rõ ràng: `feat: thêm màn hình ví`
4. Tạo Pull Request

## 🗺 Roadmap ngắn hạn (gợi ý)

- [ ] Thêm màn hình lịch sử giao dịch ví
- [ ] Thêm bộ lọc nâng cao cho sản phẩm
- [ ] Tối ưu bundle & lazy loading màn hình chi tiết
- [ ] Thêm unit test cho services

---
Nếu cần bổ sung thêm mục (ví dụ ERD, sequence diagram, performance), hãy cho tôi biết để cập nhật tiếp.
