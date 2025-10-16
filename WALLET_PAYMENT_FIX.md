# 💳 Wallet Payment API Flow - Fixed

## 🔍 Vấn Đề Phát Hiện

Ban đầu tôi chỉ gọi 1 API cho WALLET payment:
```
POST /checkout
```

Nhưng thực tế WALLET payment cần **2 bước**:

1. **POST /checkout** - Khởi tạo transaction (status: PENDING)
2. **POST /checkout/{id}/pay-with-wallet** - Hoàn tất thanh toán (status: COMPLETED)

---

## ✅ Giải Pháp Đã Sửa

### Flow Mới (2-step)

#### Step 1: Initiate Checkout
```typescript
POST /checkout
{
    "listingId": "cmgnp83ci0024th4sedpussrr",
    "listingType": "VEHICLE",
    "paymentMethod": "WALLET"
}

Response:
{
  "message": "Checkout initiated successfully",
  "data": {
    "transactionId": "cmgnrgeux0003thpw5vsm7i27",
    "paymentInfo": null  // null for WALLET
  }
}
```

**Transaction Status:** PENDING ⏳

---

#### Step 2: Pay with Wallet
```typescript
POST /checkout/{transactionId}/pay-with-wallet

Response:
{
  "message": "Payment successful",
  "data": {
    "id": "cmgp8rl68000zef1q2h0i3ywj",
    "buyerId": "cmgnszotu0000th4ckjn4ornb",
    "status": "COMPLETED",  // ✅ NOW COMPLETED!
    "vehicleId": "cmgnszru6001kth4c6rfzu683",
    "batteryId": null,
    "finalPrice": 32500,
    "paymentGateway": "WALLET",
    "paymentDetail": null,
    "createdAt": "2025-10-13T14:41:45.968Z",
    "updatedAt": "2025-10-13T14:45:14.371Z"
  }
}
```

**Transaction Status:** COMPLETED ✅

---

## 📝 Code Changes

### 1. checkoutService.ts - Thêm API mới

```typescript
export const checkoutService = {
  // Existing
  async initiateCheckout(checkoutData: CheckoutRequest): Promise<CheckoutResponse> {
    const response = await apiClient.post<CheckoutResponse>('/checkout', checkoutData);
    return response.data;
  },

  // ✨ NEW - Step 2 for WALLET payment
  async payWithWallet(transactionId: string): Promise<{ message: string; data: Transaction }> {
    const response = await apiClient.post<{ message: string; data: Transaction }>(
      `/checkout/${transactionId}/pay-with-wallet`
    );
    return response.data;
  },
};
```

---

### 2. CheckoutScreen.tsx - 2-step Flow

```typescript
} else if (selectedPaymentMethod === 'WALLET') {
  // Wallet payment requires 2 steps:
  // 1. Initiate checkout (already done above - creates PENDING transaction)
  // 2. Pay with wallet (completes the transaction)
  
  const transactionId = response.data.transactionId;
  
  // Step 2: Complete payment with wallet
  const paymentResult = await checkoutService.payWithWallet(transactionId);
  
  // Payment successful, transaction is now COMPLETED
  Alert.alert(
    'Thanh toán thành công!',
    `Đã thanh toán ${formatPrice(product.price)} từ ví EVmarket.\n\n` +
    `Giao dịch đã hoàn tất. Bạn có thể xem lại trong lịch sử mua hàng.`,
    [
      {
        text: 'Xem lịch sử',
        onPress: () => {
          navigation.goBack();
          setTimeout(() => {
            navigation.navigate('TransactionHistory');
          }, 100);
        },
      },
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
        style: 'cancel'
      }
    ]
  );
}
```

---

## 🔄 So Sánh: MOMO vs WALLET

### MOMO Payment (1 step)
```
POST /checkout
  → paymentInfo: { deeplink, payUrl, ... }
  → Mở MoMo app
  → User thanh toán trên MoMo
  → MoMo callback về backend
  → Backend update transaction status
```

### WALLET Payment (2 steps) ✨
```
POST /checkout
  → transactionId: "xxx"
  → paymentInfo: null

POST /checkout/{transactionId}/pay-with-wallet
  → status: COMPLETED
  → Trừ tiền wallet ngay lập tức
```

---

## 🧪 Test Flow

### Test WALLET Payment

1. ✅ Chọn sản phẩm AVAILABLE
2. ✅ Chọn "Ví EVmarket"
3. ✅ Click "Thanh toán"
4. ✅ **Step 1:** POST /checkout → Get transactionId
5. ✅ **Step 2:** POST /checkout/{id}/pay-with-wallet → COMPLETED
6. ✅ Alert "Giao dịch đã hoàn tất"
7. ✅ GoBack() → Product detail reload
8. ✅ Product status → SOLD
9. ✅ Banner "Sản phẩm này đã được bán" hiển thị
10. ✅ Vào lịch sử → Transaction status COMPLETED

---

## ✅ Kết Quả

**Trước (Sai):**
- ❌ Chỉ gọi 1 API
- ❌ Transaction status: PENDING
- ❌ Message: "Đơn hàng sẽ được xử lý sau 24h"
- ❌ Lịch sử hiện PENDING

**Sau (Đúng):**
- ✅ Gọi 2 APIs (initiate → pay)
- ✅ Transaction status: COMPLETED
- ✅ Message: "Giao dịch đã hoàn tất"
- ✅ Lịch sử hiện COMPLETED
- ✅ Ví bị trừ tiền ngay
- ✅ Product status → SOLD ngay

---

## 📁 Files Changed

```
services/
└── checkoutService.ts    ✏️ Thêm payWithWallet() method

screens/
└── CheckoutScreen.tsx    ✏️ 2-step flow cho WALLET
```

---

## 🎯 API Endpoints Summary

| Method | Endpoint | Purpose | Payment Method |
|--------|----------|---------|----------------|
| POST | `/checkout` | Khởi tạo transaction | MOMO & WALLET |
| POST | `/checkout/{id}/pay-with-wallet` | Hoàn tất thanh toán | **WALLET only** |

---

Developed with ❤️ by EVmarket Team  
Fixed: October 16, 2025
