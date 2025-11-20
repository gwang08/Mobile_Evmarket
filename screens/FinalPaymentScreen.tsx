import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Linking,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Vehicle, Battery } from "../types";
import { vehicleService } from "../services/vehicleService";
import { batteryService } from "../services/batteryService";
import { checkoutService } from "../services/checkoutService";
import PaymentMethod from "../components/PaymentMethod";
import { useToast } from "../contexts/ToastContext";
import { parseErrorMessage } from "../utils/errorHandler";
import { Ionicons } from "@expo/vector-icons";

type FinalPaymentRouteProp = RouteProp<RootStackParamList, "FinalPayment">;
type FinalPaymentNavigationProp = StackNavigationProp<RootStackParamList>;

export default function FinalPaymentScreen() {
  const route = useRoute<FinalPaymentRouteProp>();
  const navigation = useNavigation<FinalPaymentNavigationProp>();
  const { appointmentId, transactionId, productId, productType } = route.params;
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const [product, setProduct] = useState<Vehicle | Battery | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "MOMO" | "WALLET" | null
  >(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProductDetail();
  }, [productId, productType]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      if (productType === "vehicle") {
        const response = await vehicleService.getVehicleById(productId);
        setProduct(response.data.vehicle);
      } else {
        const response = await batteryService.getBatteryById(productId);
        setProduct(response.data.battery);
      }
    } catch (error) {
      console.error("Error fetching product detail:", error);
      const errorMessage = parseErrorMessage(error);
      showError(errorMessage);
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      showWarning("Vui lòng chọn phương thức thanh toán");
      return;
    }

    if (!product) {
      showError("Không tìm thấy thông tin sản phẩm");
      return;
    }

    try {
      setProcessing(true);

      const checkoutData = {
        listingId: productId,
        listingType:
          productType === "vehicle"
            ? ("VEHICLE" as const)
            : ("BATTERY" as const),
        paymentMethod: selectedPaymentMethod,
        depositOnly: false, // Pay remaining 90%
        ...(selectedPaymentMethod === "MOMO" && {
          redirectUrl: "evmarket://final-payment-callback",
        }),
      };

      const response = await checkoutService.initiateCheckout(checkoutData);

      if (selectedPaymentMethod === "MOMO" && response.data.paymentInfo) {
        const { deeplink, payUrl, qrCodeUrl, deeplinkMiniApp } =
          response.data.paymentInfo;

        let opened = false;

        if (deeplink) {
          try {
            await Linking.openURL(deeplink);
            opened = true;
            console.log("✅ Opened MoMo app via deeplink");
          } catch (error) {
            console.warn("❌ Failed to open deeplink:", error);
          }
        }

        if (!opened && qrCodeUrl) {
          try {
            await Linking.openURL(qrCodeUrl);
            opened = true;
            console.log("✅ Opened MoMo app via QR deeplink");
          } catch (error) {
            console.warn("❌ Failed to open QR deeplink:", error);
          }
        }

        if (!opened && deeplinkMiniApp) {
          try {
            await Linking.openURL(deeplinkMiniApp);
            opened = true;
            console.log("✅ Opened MoMo app via miniapp deeplink");
          } catch (error) {
            console.warn("❌ Failed to open miniapp deeplink:", error);
          }
        }

        if (!opened && payUrl) {
          try {
            await Linking.openURL(payUrl);
            console.log("✅ Opened MoMo web payment page");
          } catch (error) {
            console.error("❌ Failed to open payment URL:", error);
            showError("Không thể mở trang thanh toán. Vui lòng thử lại.");
            return;
          }
        }

        if (!opened) {
          showError(
            "Không thể mở ứng dụng MoMo. Vui lòng kiểm tra và thử lại."
          );
          return;
        }

        showInfo(
          "Vui lòng hoàn tất thanh toán 90% trên MoMo. App sẽ tự động cập nhật khi thanh toán thành công.",
          5000
        );

        setTimeout(() => {
          navigation.navigate("Main", { screen: "Profile" });
        }, 2000);
      } else if (selectedPaymentMethod === "WALLET") {
        const newTransactionId = response.data.transactionId;

        const paymentResult = await checkoutService.payWithWallet(
          newTransactionId
        );

        const finalAmount = product.price * 0.9;
        showSuccess(
          `Thanh toán thành công ${formatPrice(
            finalAmount
          )} từ ví EVmarket! Giao dịch hoàn tất.`,
          4000
        );

        setTimeout(() => {
          navigation.navigate("Main", { screen: "Profile" });
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error processing final payment:", error);
      const errorMessage = parseErrorMessage(error);
      showError(errorMessage, 4000);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không thể tải thông tin sản phẩm</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Product Info */}
        <View style={styles.productCard}>
          <Image
            source={{ uri: product.images[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.productInfo}>
            <Text style={styles.productTitle}>{product.title}</Text>
            <Text style={styles.productBrand}>{product.brand}</Text>
            <Text style={styles.productPrice}>
              {formatPrice(product.price)}
            </Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tóm tắt thanh toán</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng giá trị:</Text>
            <Text style={styles.summaryValue}>
              {formatPrice(product.price)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: "#27ae60" }]}>
              Đã thanh toán (10%):
            </Text>
            <Text style={[styles.summaryValue, { color: "#27ae60" }]}>
              -{formatPrice(product.price * 0.1)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Thanh toán ngay (90%):</Text>
            <Text style={styles.totalValue}>
              {formatPrice(product.price * 0.9)}
            </Text>
          </View>
          <View style={styles.noteBox}>
            <View style={styles.noteRow}>
              <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
              <Text style={styles.noteText}>
                Bạn đã kiểm tra và chấp nhận sản phẩm.
              </Text>
            </View>
            <View style={styles.noteRow}>
              <Ionicons name="cash-outline" size={20} color="#3498db" />
              <Text style={styles.noteText}>
                Thanh toán 90% còn lại để hoàn tất giao dịch.
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <PaymentMethod
          selectedMethod={selectedPaymentMethod}
          onMethodSelect={setSelectedPaymentMethod}
        />
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.paymentButtonContainer}>
        <TouchableOpacity
          style={[
            styles.paymentButton,
            !selectedPaymentMethod && styles.paymentButtonDisabled,
            processing && styles.paymentButtonProcessing,
          ]}
          onPress={handlePayment}
          disabled={!selectedPaymentMethod || processing}
        >
          {processing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.processingText}>Đang xử lý...</Text>
            </View>
          ) : (
            <Text style={styles.paymentButtonText}>
              Thanh toán {formatPrice(product.price * 0.9)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#7f8c8d",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  productCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  productBrand: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e67e22",
  },
  noteBox: {
    backgroundColor: "#d5f4e6",
    borderLeftWidth: 4,
    borderLeftColor: "#27ae60",
    padding: 12,
    marginTop: 15,
    borderRadius: 6,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  noteText: {
    fontSize: 13,
    color: "#27ae60",
    flex: 1,
  },
  paymentButtonContainer: {
    padding: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
  },
  paymentButton: {
    backgroundColor: "#27ae60",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentButtonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  paymentButtonProcessing: {
    backgroundColor: "#f39c12",
  },
  paymentButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  processingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
