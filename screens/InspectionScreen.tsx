import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Appointment, Vehicle, Battery } from "../types";
import { appointmentService } from "../services/appointmentService";
import { vehicleService } from "../services/vehicleService";
import { batteryService } from "../services/batteryService";
import { checkoutService } from "../services/checkoutService";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../contexts/ToastContext";

type InspectionRouteProp = RouteProp<RootStackParamList, "Inspection">;
type InspectionNavigationProp = StackNavigationProp<RootStackParamList>;

export default function InspectionScreen() {
  const route = useRoute<InspectionRouteProp>();
  const navigation = useNavigation<InspectionNavigationProp>();
  const { appointmentId } = route.params;
  const { showSuccess, showError, showInfo } = useToast();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [product, setProduct] = useState<Vehicle | Battery | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [appointmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Get appointment
      const response = await appointmentService.getMyAppointments(1, 100);
      const found = response.data.appointments.find(
        (apt) => apt.id === appointmentId
      );

      if (!found) {
        showError("Không tìm thấy lịch hẹn");
        navigation.goBack();
        return;
      }

      setAppointment(found);

      // Get full product details
      if (found.vehicleId) {
        const vehicleResponse = await vehicleService.getVehicleById(
          found.vehicleId
        );
        setProduct(vehicleResponse.data.vehicle);
      } else if (found.batteryId) {
        const batteryResponse = await batteryService.getBatteryById(
          found.batteryId
        );
        setProduct(batteryResponse.data.battery);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showError("Không thể tải thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!appointment || !product) return;

    Alert.alert(
      "Xác nhận thanh toán",
      `Bạn đồng ý mua sản phẩm này?\n\nBạn sẽ thanh toán 90% còn lại (${formatPrice(
        product.price * 0.9
      )}) để hoàn tất giao dịch.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          onPress: () => {
            navigation.navigate("FinalPayment", {
              appointmentId: appointment.id,
              transactionId: appointment.transactionId,
              productId: product.id,
              productType: appointment.vehicleId ? "vehicle" : "battery",
            });
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      "Từ chối sản phẩm",
      "Bạn có chắc muốn từ chối sản phẩm này?\n\nGiao dịch sẽ bị hủy và bạn sẽ không nhận được tiền cọc.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Từ chối",
          style: "destructive",
          onPress: async () => {
            try {
              setRejecting(true);
              await checkoutService.rejectTransaction(
                appointment!.transactionId
              );
              showInfo("Đã từ chối sản phẩm. Giao dịch đã kết thúc.");
              navigation.navigate("AppointmentList");
            } catch (error) {
              console.error("Error rejecting transaction:", error);
              showError("Không thể từ chối giao dịch");
            } finally {
              setRejecting(false);
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (!appointment || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy thông tin</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="car-sport" size={40} color="#3498db" />
        <Text style={styles.headerTitle}>Kiểm tra sản phẩm tại bãi</Text>
        <Text style={styles.headerSubtitle}>
          Hẹn:{" "}
          {appointment.confirmedDate && formatDate(appointment.confirmedDate)}
        </Text>
      </View>

      {/* Product Images */}
      <View style={styles.imageSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {product.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      </View>

      {/* Product Info */}
      <View style={styles.infoCard}>
        <Text style={styles.productTitle}>{product.title}</Text>
        <Text style={styles.productBrand}>{product.brand}</Text>

        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tổng giá trị:</Text>
            <Text style={styles.priceValue}>{formatPrice(product.price)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabelSmall}>Đã cọc (10%):</Text>
            <Text style={styles.priceValueSmall}>
              {formatPrice(product.price * 0.1)}
            </Text>
          </View>
          <View style={[styles.priceRow, styles.remainingRow]}>
            <Text style={styles.remainingLabel}>Còn lại (90%):</Text>
            <Text style={styles.remainingValue}>
              {formatPrice(product.price * 0.9)}
            </Text>
          </View>
        </View>
      </View>

      {/* Inspection Checklist */}
      <View style={styles.checklistCard}>
        <Text style={styles.checklistTitle}>📋 Danh sách kiểm tra</Text>
        <View style={styles.checklistItem}>
          <Ionicons name="checkbox-outline" size={20} color="#7f8c8d" />
          <Text style={styles.checklistText}>
            Kiểm tra ngoại thất xe (sơn, vết trầy, móp)
          </Text>
        </View>
        <View style={styles.checklistItem}>
          <Ionicons name="checkbox-outline" size={20} color="#7f8c8d" />
          <Text style={styles.checklistText}>
            Kiểm tra động cơ và hệ thống điện
          </Text>
        </View>
        <View style={styles.checklistItem}>
          <Ionicons name="checkbox-outline" size={20} color="#7f8c8d" />
          <Text style={styles.checklistText}>
            Kiểm tra pin (dung lượng, sức khỏe)
          </Text>
        </View>
        <View style={styles.checklistItem}>
          <Ionicons name="checkbox-outline" size={20} color="#7f8c8d" />
          <Text style={styles.checklistText}>Lái thử xe (nếu được phép)</Text>
        </View>
        <View style={styles.checklistItem}>
          <Ionicons name="checkbox-outline" size={20} color="#7f8c8d" />
          <Text style={styles.checklistText}>Kiểm tra giấy tờ xe</Text>
        </View>
      </View>

      {/* Warning */}
      <View style={styles.warningCard}>
        <Ionicons name="warning" size={24} color="#f39c12" />
        <View style={styles.warningContent}>
          <Text style={styles.warningTitle}>Lưu ý quan trọng</Text>
          <Text style={styles.warningText}>
            • Nếu chấp nhận: Bạn sẽ thanh toán 90% còn lại để hoàn tất giao
            dịch.{"\n"}• Nếu từ chối: Giao dịch sẽ kết thúc và bạn sẽ mất tiền
            cọc 10%.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={handleReject}
          disabled={rejecting}
        >
          <Ionicons name="close-circle" size={20} color="white" />
          <Text style={styles.rejectButtonText}>Từ chối</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAccept}
          disabled={rejecting}
        >
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.acceptButtonText}>
            Chấp nhận & Thanh toán 90%
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 5,
  },
  imageSection: {
    backgroundColor: "white",
    padding: 10,
    marginBottom: 10,
  },
  productImage: {
    width: 300,
    height: 200,
    borderRadius: 12,
    marginRight: 10,
  },
  infoCard: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  productBrand: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 15,
  },
  priceSection: {
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
    paddingTop: 15,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: "#2c3e50",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  priceLabelSmall: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  priceValueSmall: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  remainingRow: {
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
  },
  remainingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e67e22",
  },
  remainingValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e67e22",
  },
  checklistCard: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 15,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  checklistText: {
    fontSize: 14,
    color: "#2c3e50",
    flex: 1,
  },
  warningCard: {
    backgroundColor: "#fff3cd",
    flexDirection: "row",
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#f39c12",
  },
  warningContent: {
    flex: 1,
    marginLeft: 10,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 5,
  },
  warningText: {
    fontSize: 12,
    color: "#856404",
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 15,
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e74c3c",
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  rejectButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  acceptButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27ae60",
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  acceptButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
