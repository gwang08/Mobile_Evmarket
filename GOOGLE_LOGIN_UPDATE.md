# Google Login API Update

## Ngày cập nhật
October 17, 2025

## Thay đổi

Cập nhật flow Google Login cho Mobile app từ 1 bước thành 2 bước để tương thích với API mới.

### Flow cũ (1 bước)
```
Mobile App -> GET /auth/google -> Nhận token trực tiếp
```

### Flow mới (2 bước)
```
Mobile App -> GET /auth/google?client_type=mobile -> Nhận code
Mobile App -> POST /auth/exchange-code (với code) -> Nhận token
```

## API Endpoints

### 1. Bước 1: Lấy Authorization Code
```
GET https://evmarket-api-staging.onrender.com/api/v1/auth/google?client_type=mobile
```

**Response:** Redirect về `evmarket://auth-callback?code=xxx`

### 2. Bước 2: Exchange Code sang Token
```
POST https://evmarket-api-staging.onrender.com/api/v1/auth/exchange-code
```

**Request Body:**
```json
{
  "code": "21b1517e7d55de811df656b6e8aeaa78833f60f010c56c046e966d2ce83caeb5"
}
```

**Response:**
```json
{
  "message": "Tokens exchanged successfully",
  "data": {
    "user": {
      "id": "cmgt6rnfr0000thmsrhq8dge5",
      "email": "dungdqse184451@fpt.edu.vn",
      "name": "Do Quang Dung (K18 HCM)",
      "avatar": null,
      "role": "MEMBER",
      "isVerified": false,
      "createdAt": "2025-10-16T08:56:54.375Z",
      "updatedAt": "2025-10-16T08:56:54.375Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Files đã sửa

### 1. `contexts/AuthContext.tsx`
- Thêm method `reloadAuthStatus()` để reload user state sau khi Google login
- Export trong AuthContextType interface

### 2. `screens/LoginScreen.tsx`
- Import `AsyncStorage` để lưu token và user data
- Cập nhật `handleGoogleLogin()` để:
  1. Gọi `/auth/google?client_type=mobile` để lấy code
  2. Parse code từ callback URL
  3. Gọi `/auth/exchange-code` với code để lấy token
  4. Lưu token và user vào AsyncStorage
  5. Reload auth context bằng `reloadAuthStatus()`

## Cách test

1. Mở app và click "Đăng nhập với Google"
2. Browser sẽ mở và redirect đến Google login
3. Sau khi đăng nhập Google, browser redirect về app với code
4. App tự động exchange code sang token
5. User được đăng nhập thành công

## Notes

- Deep link scheme: `evmarket://auth-callback`
- Cần cấu hình deep link trong `app.json` hoặc `app.config.js`
- Code chỉ sử dụng được 1 lần và có thời hạn ngắn (thường 5-10 phút)
