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
import { Appointment } from "../types";
import { appointmentService } from "../services/appointmentService";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import ProposeDateModal from "../components/ProposeDateModal";

type AppointmentDetailRouteProp = RouteProp<
  RootStackParamList,
  "AppointmentDetail"
>;
type AppointmentDetailNavigationProp = StackNavigationProp<RootStackParamList>;

export default function AppointmentDetailScreen() {
  const route = useRoute<AppointmentDetailRouteProp>();
  const navigation = useNavigation<AppointmentDetailNavigationProp>();
  const { appointmentId } = route.params;
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProposeDateModal, setShowProposeDateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAppointmentDetail();
  }, [appointmentId]);

  const fetchAppointmentDetail = async () => {
    try {
      setLoading(true);
      // Since there's no single appointment endpoint, get from list and filter
      const response = await appointmentService.getMyAppointments(1, 100);
      const found = response.data.appointments.find(
        (apt) => apt.id === appointmentId
      );
      if (found) {
        setAppointment(found);
      } else {
        showError("Không tìm thấy lịch hẹn");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error fetching appointment detail:", error);
      showError("Không thể tải thông tin lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = (): "buyer" | "seller" => {
    return appointment?.buyerId === user?.id ? "buyer" : "seller";
  };

  const handleProposeDate = async (dates: string[]) => {
    if (!appointment) return;

    try {
      setSubmitting(true);
      await appointmentService.proposeDate(appointmentId, dates);
      showSuccess("Đã gửi đề xuất lịch hẹn thành công!");
      await fetchAppointmentDetail();
    } catch (error) {
      console.error("Error proposing date:", error);
      showError("Không thể gửi đề xuất lịch hẹn");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDate = (date: string) => {
    Alert.alert(
      "Xác nhận lịch hẹn",
      `Bạn có chắc muốn xác nhận lịch hẹn vào ${formatDate(date)}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            try {
              setSubmitting(true);
              await appointmentService.confirmAppointment(appointmentId, date);
              showSuccess("Đã xác nhận lịch hẹn thành công!");
              await fetchAppointmentDetail();
            } catch (error) {
              console.error("Error confirming appointment:", error);
              showError("Không thể xác nhận lịch hẹn");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleInspection = () => {
    if (!appointment) return;
    navigation.navigate("Inspection", { appointmentId: appointment.id });
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

  const isAppointmentDatePassed = () => {
    if (!appointment?.confirmedDate) return false;
    return new Date(appointment.confirmedDate) <= new Date();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy lịch hẹn</Text>
      </View>
    );
  }

  const product =
    appointment.transaction?.vehicle || appointment.transaction?.battery;
  const role = getUserRole();
  const otherParty = role === "buyer" ? appointment.seller : appointment.buyer;
  const myProposedDates =
    role === "buyer"
      ? appointment.buyerProposedDates
      : appointment.sellerProposedDates;
  const theirProposedDates =
    role === "buyer"
      ? appointment.sellerProposedDates
      : appointment.buyerProposedDates;

  return (
    <ScrollView style={styles.container}>
      {/* Product Info */}
      {product && (
        <View style={styles.productCard}>
          <Image
            source={{ uri: product.images[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.productInfo}>
            <Text style={styles.productTitle}>{product.title}</Text>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: role === "buyer" ? "#3498db" : "#e67e22" },
              ]}
            >
              <Ionicons
                name={role === "buyer" ? "person" : "storefront"}
                size={16}
                color="white"
              />
              <Text style={styles.roleText}>
                {role === "buyer" ? "Bạn là người mua" : "Bạn là người bán"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Other Party Info */}
      {otherParty && (
        <View style={styles.partyCard}>
          <Text style={styles.sectionTitle}>
            {role === "buyer" ? "Thông tin người bán" : "Thông tin người mua"}
          </Text>
          <View style={styles.partyInfo}>
            <Image
              source={{ uri: otherParty.avatar }}
              style={styles.partyAvatar}
            />
            <Text style={styles.partyName}>{otherParty.name}</Text>
          </View>
        </View>
      )}

      {/* Confirmed Date */}
      {appointment.confirmedDate && (
        <View style={styles.confirmedCard}>
          <View style={styles.confirmedHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
            <Text style={styles.confirmedTitle}>Lịch hẹn đã xác nhận</Text>
          </View>
          <Text style={styles.confirmedDate}>
            {formatDate(appointment.confirmedDate)}
          </Text>

          {isAppointmentDatePassed() && role === "buyer" && (
            <TouchableOpacity
              style={styles.inspectionButton}
              onPress={handleInspection}
            >
              <Ionicons name="car-outline" size={20} color="white" />
              <Text style={styles.inspectionButtonText}>
                Kiểm tra xe & Thanh toán
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* My Proposed Dates */}
      {myProposedDates && myProposedDates.length > 0 && (
        <View style={styles.datesCard}>
          <Text style={styles.sectionTitle}>Lịch bạn đề xuất</Text>
          {myProposedDates.map((date, index) => (
            <View key={index} style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={16} color="#3498db" />
              <Text style={styles.dateText}>{formatDate(date)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Their Proposed Dates */}
      {theirProposedDates && theirProposedDates.length > 0 && (
        <View style={styles.datesCard}>
          <Text style={styles.sectionTitle}>
            Lịch {role === "buyer" ? "người bán" : "người mua"} đề xuất
          </Text>
          {theirProposedDates.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dateItemSelectable}
              onPress={() =>
                !appointment.confirmedDate && handleConfirmDate(date)
              }
              disabled={!!appointment.confirmedDate || submitting}
            >
              <Ionicons name="calendar" size={16} color="#27ae60" />
              <Text style={styles.dateTextSelectable}>{formatDate(date)}</Text>
              {!appointment.confirmedDate && (
                <Ionicons name="chevron-forward" size={16} color="#27ae60" />
              )}
            </TouchableOpacity>
          ))}
          {!appointment.confirmedDate && (
            <Text style={styles.tapHint}>👆 Chạm để xác nhận lịch hẹn</Text>
          )}
        </View>
      )}

      {/* Action Buttons */}
      {!appointment.confirmedDate && appointment.status !== "CANCELLED" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.proposeButton}
            onPress={() => setShowProposeDateModal(true)}
            disabled={submitting}
          >
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text style={styles.proposeButtonText}>
              {myProposedDates?.length > 0
                ? "Đề xuất lịch mới"
                : "Đề xuất lịch hẹn"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ProposeDateModal
        visible={showProposeDateModal}
        onClose={() => setShowProposeDateModal(false)}
        onSubmit={handleProposeDate}
      />
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
  productCard: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
  },
  productImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  productInfo: {
    gap: 8,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
  partyCard: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  partyInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  partyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  partyName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2c3e50",
  },
  confirmedCard: {
    backgroundColor: "#d5f4e6",
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#27ae60",
  },
  confirmedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  confirmedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#27ae60",
  },
  confirmedDate: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 12,
  },
  inspectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27ae60",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  inspectionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  datesCard: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  dateText: {
    fontSize: 14,
    color: "#2c3e50",
  },
  dateItemSelectable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
  },
  dateTextSelectable: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "500",
    flex: 1,
  },
  tapHint: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 8,
  },
  actionButtons: {
    padding: 15,
  },
  proposeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  proposeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
