# 🚗 EV Market - Mobile App

Ứng dụng di động cho thị trường xe điện và pin, được xây dựng bằng React Native với Expo.

## 📱 Tính năng chính

- 🏠 **Trang chủ**: Hiển thị sản phẩm nổi bật
- 🔍 **Sản phẩm**: Duyệt xe điện và pin với tìm kiếm, lọc
- 💰 **Ví điện tử**: Nạp tiền, xem số dư qua MoMo
- 👤 **Hồ sơ**: Quản lý tài khoản, đăng nhập/đăng ký
- 🛒 **Mua hàng**: Checkout có bảo vệ authentication
- 📋 **Chi tiết**: Xem thông tin sản phẩm và người bán

## 🛠 Tech Stack

- **Framework**: React Native với Expo (~54.0.12)
- **Language**: TypeScript
- **Navigation**: React Navigation v6 (Stack + Bottom Tabs)
- **HTTP Client**: Axios với interceptors
- **State Management**: React Context
- **Storage**: AsyncStorage
- **UI**: React Native components + Expo Vector Icons

## 📁 Cấu trúc dự án

```text
Mobile_Evmarket/
├── 📱 App.js                    # Entry point
├── 🎯 app.json                  # Expo configuration
├── 📦 package.json              # Dependencies
├── 
├── 🗂 components/               # Reusable components
│   ├── ProductCard.tsx          # Card hiển thị sản phẩm
│   ├── SearchBar.tsx            # Thanh tìm kiếm
│   └── ...
│
├── 🖥 screens/                  # Màn hình chính
│   ├── HomeScreen.tsx           # Trang chủ
│   ├── ProductsScreen.tsx       # Danh sách sản phẩm
│   ├── WalletScreen.tsx         # Ví điện tử
│   ├── ProfileScreen.tsx        # Hồ sơ người dùng
│   ├── VehicleDetailScreen.tsx  # Chi tiết xe điện
│   ├── BatteryDetailScreen.tsx  # Chi tiết pin
│   ├── SellerDetailScreen.tsx   # Thông tin người bán
│   ├── CheckoutScreen.tsx       # Thanh toán
│   ├── LoginScreen.tsx          # Đăng nhập
│   └── RegisterScreen.tsx       # Đăng ký
│
├── 🧭 navigation/               # Điều hướng
│   ├── RootNavigator.tsx        # Stack Navigator chính
│   └── TabNavigator.tsx         # Bottom Tab Navigator
│
├── 🌐 services/                 # API services
│   ├── vehicleService.ts        # API xe điện
│   ├── batteryService.ts        # API pin
│   ├── userService.ts           # API người dùng
│   └── walletService.ts         # API ví điện tử
│
├── ⚙️ config/                   # Cấu hình
│   └── api.ts                   # Axios client setup
│
├── 🎨 contexts/                 # React Context
│   └── AuthContext.tsx          # Authentication state
│
├── 🏷 types/                    # TypeScript definitions
│   └── index.ts                 # Tất cả types/interfaces
│
└── 🖼 assets/                   # Hình ảnh, icons
    ├── icon.png
    ├── splash-icon.png
    └── ...
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 hoặc cao hơn)
- npm hoặc yarn
- Expo CLI: `npm install -g @expo/cli`
- Android Studio (cho Android) hoặc Xcode (cho iOS)

### Installation

1. **Clone repository**

   ```bash
   git clone https://github.com/gwang08/Mobile_Evmarket.git
   cd Mobile_Evmarket
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   # Tạo file .env từ template
   cp .env.example .env

   # Cập nhật các giá trị trong .env
   nano .env
   ```

4. **Start development server**

   ```bash
   # Start Expo development server
   npx expo start

   # Hoặc với tunnel để test trên device thật
   npx expo start --tunnel
   ```

5. **Run on device**

   - **Android**: Scan QR code bằng Expo Go app
   - **iOS**: Scan QR code bằng Camera app
   - **Simulator**: Nhấn `a` (Android) hoặc `i` (iOS) trong terminal

## 🔧 Environment Variables

Tạo file `.env` với các biến sau:

```env
# API Configuration
API_BASE_URL=https://evmarket-api-staging.onrender.com/api/v1

# App Configuration
APP_ENV=development
APP_VERSION=1.0.0
```

## 🗂 Chi tiết Architecture

### Navigation Structure

```text
RootStackNavigator
├── MainTabNavigator (headerShown: false)
│   ├── Home Tab (Trang chủ)
│   ├── Products Tab (Sản phẩm)
│   ├── Wallet Tab (Ví)
│   └── Profile Tab (Hồ sơ)
├── VehicleDetail (Chi tiết xe)
├── BatteryDetail (Chi tiết pin)
├── SellerDetail (Thông tin người bán)
└── Checkout (Thanh toán)
```

### API Integration

**Base URL**: `https://evmarket-api-staging.onrender.com/api/v1`

**Authentication**: JWT Token trong AsyncStorage

**Key Endpoints**:

- `GET /vehicles/` - Danh sách xe điện
- `GET /batteries/` - Danh sách pin
- `GET /wallet/` - Thông tin ví
- `POST /wallet/deposit` - Nạp tiền
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký

### State Management

**AuthContext**: Quản lý trạng thái đăng nhập

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  showLoginPrompt: boolean;
  setShowLoginPrompt: (show: boolean) => void;
}
```

### TypeScript Types

**Core Types**:

- `User` - Thông tin người dùng
- `Vehicle` - Thông tin xe điện
- `Battery` - Thông tin pin
- `Wallet` - Thông tin ví
- `Seller` - Thông tin người bán

## 🎨 UI/UX Guidelines

### Color Scheme

- **Primary**: `#3498db` (Blue)
- **Success**: `#27ae60` (Green)
- **Danger**: `#e74c3c` (Red)
- **Dark**: `#2c3e50`
- **Light**: `#ecf0f1`

### Design Principles

- **Cards**: Rounded corners (12-16px), subtle shadows
- **Buttons**: Consistent padding (12-16px), clear CTAs
- **Typography**: Clear hierarchy, readable sizes
- **Spacing**: Consistent margins (8, 12, 16, 20px)

## 🔐 Authentication Flow

1. **Guest User**: Có thể xem sản phẩm, không thể checkout
2. **Login Required**: Checkout, Wallet, Profile editing
3. **Token Management**: Auto-refresh, 401 handling
4. **Persistent Session**: AsyncStorage lưu token

## 💳 Payment Integration

**MoMo Integration**:

- Tạo deposit request qua API
- Nhận payUrl từ response
- Mở MoMo app bằng `Linking.openURL()`
- User hoàn tất thanh toán trong MoMo
- Quay lại app, refresh để xem số dư mới

## 🧪 Testing

```bash
# Run tests (nếu có)
npm test

# TypeScript type checking
npx tsc --noEmit

# Linting
npx eslint . --ext .ts,.tsx
```

## 📦 Build & Deploy

### Development Build

```bash
npx expo build:android --type development
npx expo build:ios --type development
```

### Production Build

```bash
# Android APK
npx expo build:android --type app-bundle

# iOS IPA
npx expo build:ios
```

### EAS Build (Recommended)

```bash
# Setup EAS
npm install -g @expo/eas-cli
eas login

# Build
eas build --platform android
eas build --platform ios
```

## 🐛 Common Issues & Solutions

### 1. Metro bundler issues

```bash
npx expo start --clear
```

### 2. Navigation type errors

Đảm bảo types trong `navigation/` khớp với screen names

### 3. API 500 errors

Kiểm tra backend server status và authentication token

### 4. AsyncStorage issues

```bash
npx expo install @react-native-async-storage/async-storage
```

## 🤝 Contributing

### Git Workflow

1. **Branch naming**: `feature/ten-tinh-nang` hoặc `fix/ten-bug`
2. **Commit messages**: Tiếng Việt hoặc tiếng Anh, mô tả rõ ràng
3. **Pull Requests**: Code review trước khi merge

### Code Standards

- **TypeScript**: Strict typing, interface definitions
- **ESLint**: Follow configured rules
- **Prettier**: Auto-formatting
- **Naming**: camelCase cho functions, PascalCase cho components

## 📚 Learning Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📞 Support

- **Technical Issues**: Tạo issue trên GitHub
- **Questions**: Discussion section hoặc team chat
- **Documentation**: Cập nhật README khi có thay đổi

---

### Happy Coding! 🚀

> Được tạo với ❤️ bởi EV Market Team
 

 
