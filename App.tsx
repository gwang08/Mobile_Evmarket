import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Linking } from "react-native";

import RootNavigator from "./navigation/RootNavigator";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider, useToast } from "./contexts/ToastContext";

function AppContent() {
  const { showSuccess, showError, showWarning } = useToast();

  useEffect(() => {
    // Handle deep link when app is already running
    const handleDeepLink = (url: string) => {
      // Ignore Expo dev server links
      if (
        url.startsWith("exp://") ||
        url.startsWith("http://") ||
        url.startsWith("https://")
      ) {
        return;
      }

      // Check if it's a payment success callback (for wallet deposit)
      if (url.includes("evmarket://payment")) {
        const urlObj = new URL(url);
        const resultCode = urlObj.searchParams.get("resultCode");
        const message = urlObj.searchParams.get("message");

        if (resultCode === "0") {
          // Payment successful
          showSuccess(
            "Nạp tiền thành công! Số dư đã được cập nhật vào ví.",
            4000
          );
        } else if (resultCode === "1006") {
          // User cancelled
          showWarning("Bạn đã hủy nạp tiền.");
        } else {
          // Payment failed
          showError(message || "Nạp tiền thất bại. Vui lòng thử lại.");
        }
      }

      // Check if it's a deposit checkout callback (10% deposit payment)
      if (url.includes("evmarket://checkout-callback")) {
        const urlObj = new URL(url);
        const resultCode = urlObj.searchParams.get("resultCode");
        const message = urlObj.searchParams.get("message");
        const transactionId = urlObj.searchParams.get("orderId"); // MoMo gửi orderId

        if (resultCode === "0") {
          // Deposit payment successful - navigate to Appointments tab
          showSuccess(
            "Đặt cọc 10% thành công! Vui lòng xem lịch hẹn và sắp xếp với người bán.",
            5000
          );
        } else if (resultCode === "1006") {
          // User cancelled
          showWarning("Bạn đã hủy đặt cọc.");
        } else {
          // Payment failed
          showError(message || "Đặt cọc thất bại. Vui lòng thử lại.");
        }
      }

      // Check if it's a final payment callback (90% final payment)
      if (url.includes("evmarket://final-payment-callback")) {
        const urlObj = new URL(url);
        const resultCode = urlObj.searchParams.get("resultCode");
        const message = urlObj.searchParams.get("message");

        if (resultCode === "0") {
          // Final payment successful - transaction completed
          showSuccess(
            "Thanh toán 90% thành công! Giao dịch đã hoàn tất.",
            5000
          );
        } else if (resultCode === "1006") {
          // User cancelled
          showWarning("Bạn đã hủy thanh toán.");
        } else {
          // Payment failed
          showError(message || "Thanh toán thất bại. Vui lòng thử lại.");
        }
      }
    };

    // Handle deep link when app is opened from closed state
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    // Handle deep link when app is already running
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    getInitialURL();

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <NavigationContainer>
      <RootNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
