import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Appointment } from "../types";
import { appointmentService } from "../services/appointmentService";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";

type AppointmentListNavigationProp = StackNavigationProp<RootStackParamList>;

export default function AppointmentListScreen() {
  const navigation = useNavigation<AppointmentListNavigationProp>();
  const { showError } = useToast();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [])
  );

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getMyAppointments(1, 50);
      setAppointments(response.data.appointments);
    } catch (error) {
      console.error("Error loading appointments:", error);
      showError("Không thể tải danh sách lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "#27ae60";
      case "PENDING":
        return "#f39c12";
      case "CANCELLED":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Đã xác nhận";
      case "PENDING":
        return "Chờ xác nhận";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getUserRole = (appointment: Appointment): "buyer" | "seller" => {
    return appointment.buyerId === user?.id ? "buyer" : "seller";
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    navigation.navigate("AppointmentDetail", { appointmentId: appointment.id });
  };

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const product = item.transaction?.vehicle || item.transaction?.battery;
    if (!product) return null;

    const role = getUserRole(item);
    const otherParty = role === "buyer" ? item.seller : item.buyer;

    return (
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => handleAppointmentPress(item)}
      >
        <Image
          source={{ uri: product.images[0] }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.appointmentInfo}>
          <View style={styles.roleContainer}>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: role === "buyer" ? "#3498db" : "#e67e22" },
              ]}
            >
              <Ionicons
                name={role === "buyer" ? "person" : "storefront"}
                size={14}
                color="white"
              />
              <Text style={styles.roleText}>
                {role === "buyer" ? "Người mua" : "Người bán"}
              </Text>
            </View>
          </View>

          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>

          <View style={styles.partyRow}>
            {otherParty && (
              <>
                <Image
                  source={{ uri: otherParty.avatar }}
                  style={styles.partyAvatar}
                />
                <Text style={styles.partyName}>{otherParty.name}</Text>
              </>
            )}
          </View>

          {item.confirmedDate ? (
            <View style={styles.dateRow}>
              <Ionicons name="calendar" size={14} color="#27ae60" />
              <Text style={styles.confirmedDate}>
                Hẹn: {formatDate(item.confirmedDate)}
              </Text>
            </View>
          ) : (
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={14} color="#f39c12" />
              <Text style={styles.pendingText}>Chưa chọn ngày hẹn</Text>
            </View>
          )}

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
      </TouchableOpacity>
    );
  };

  if (loading && appointments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải danh sách lịch hẹn...</Text>
      </View>
    );
  }

  if (appointments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={80} color="#bdc3c7" />
        <Text style={styles.emptyTitle}>Chưa có lịch hẹn nào</Text>
        <Text style={styles.emptyText}>
          Sau khi đặt cọc sản phẩm, bạn sẽ thấy lịch hẹn tại đây
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 22,
  },
  listContainer: {
    padding: 15,
  },
  appointmentCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
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
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  roleContainer: {
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: "row",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 6,
  },
  partyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  partyAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  partyName: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  confirmedDate: {
    fontSize: 12,
    color: "#27ae60",
    fontWeight: "600",
    marginLeft: 4,
  },
  pendingText: {
    fontSize: 12,
    color: "#f39c12",
    marginLeft: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    color: "white",
    fontWeight: "600",
  },
});
