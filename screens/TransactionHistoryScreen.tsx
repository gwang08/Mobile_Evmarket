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
import { Transaction } from "../types";
import { transactionService } from "../services/transactionService";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { AxiosError } from "axios";

type TransactionHistoryNavigationProp = StackNavigationProp<RootStackParamList>;

export default function TransactionHistoryScreen() {
  const navigation = useNavigation<TransactionHistoryNavigationProp>();
  const { showError } = useToast();
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadTransactions();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        loadTransactions();
      }
    }, [isAuthenticated])
  );

  const loadTransactions = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await transactionService.getMyTransactions(1, 20);
      setTransactions(response.data.transactions);
      setHasMore(response.data.page < response.data.totalPages);
      setPage(1);
    } catch (error) {
      console.error("Error loading transactions:", error);
      
      // Handle 401 error specifically
      if (error instanceof AxiosError && error.response?.status === 401) {
        showError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        // Navigation will be handled by AuthContext
        setTimeout(() => {
          navigation.navigate("Main", { screen: "Profile" });
        }, 2000);
      } else {
        showError("Không thể tải lịch sử đơn hàng. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "#27ae60";
      case "COMPLETED":
        return "#27ae60";
      case "DEPOSIT_PAID":
        return "#f39c12";
      case "PENDING":
        return "#3498db";
      case "FAILED":
        return "#e74c3c";
      case "CANCELLED":
        return "#95a5a6";
      default:
        return "#95a5a6";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PAID":
        return "Đã thanh toán";
      case "COMPLETED":
        return "Hoàn thành";
      case "DEPOSIT_PAID":
        return "Đã đặt cọc";
      case "PENDING":
        return "Đang xử lý";
      case "FAILED":
        return "Thất bại";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getProductInfo = (transaction: Transaction) => {
    // Nếu có vehicle
    if (transaction.vehicle) {
      return {
        title: transaction.vehicle.title,
        images: transaction.vehicle.images,
        type: "VEHICLE",
        id: transaction.vehicleId,
      };
    }
    
    // Nếu có battery (single)
    if (transaction.battery) {
      return {
        title: transaction.battery.title,
        images: transaction.battery.images,
        type: "BATTERY",
        id: transaction.batteryId,
      };
    }
    
    // Nếu có batteries (array) - lấy item đầu tiên
    if (transaction.batteries && transaction.batteries.length > 0) {
      const battery = transaction.batteries[0];
      return {
        title: battery.title,
        images: battery.images,
        type: "BATTERY",
        id: null,
      };
    }
    
    return null;
  };

  const handleTransactionPress = (transaction: Transaction) => {
    // If deposit paid, navigate to appointments list
    if (transaction.status === "DEPOSIT_PAID") {
      navigation.navigate("AppointmentList");
      return;
    }

    const productInfo = getProductInfo(transaction);
    if (!productInfo) return;

    if (productInfo.type === "VEHICLE" && productInfo.id) {
      navigation.navigate("VehicleDetail", {
        vehicleId: productInfo.id,
      });
    } else if (productInfo.type === "BATTERY" && productInfo.id) {
      navigation.navigate("BatteryDetail", {
        batteryId: productInfo.id,
      });
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const productInfo = getProductInfo(item);
    if (!productInfo) return null;

    const isMultipleBatteries = item.batteries && item.batteries.length > 0;

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => handleTransactionPress(item)}
      >
        <Image
          source={{ uri: productInfo.images[0] || "https://via.placeholder.com/80" }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.transactionInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {productInfo.title}
            {isMultipleBatteries && item.batteries && item.batteries.length > 1 && (
              <Text style={styles.multipleText}> (+{item.batteries.length - 1} sản phẩm khác)</Text>
            )}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.createdAt)}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatCurrency(item.finalPrice)}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
          {item.status === "DEPOSIT_PAID" && (
            <View style={styles.pendingPaymentBadge}>
              <Ionicons name="alert-circle" size={14} color="#e67e22" />
              <Text style={styles.pendingPaymentText}>Cần thanh toán 90%</Text>
            </View>
          )}
          <View style={styles.paymentRow}>
            <Ionicons
              name={
                item.paymentGateway === "MOMO" 
                  ? "phone-portrait" 
                  : item.paymentGateway === "INTERNAL"
                  ? "wallet"
                  : "card"
              }
              size={14}
              color="#7f8c8d"
            />
            <Text style={styles.paymentMethod}>
              {item.paymentGateway === "MOMO" 
                ? "MoMo" 
                : item.paymentGateway === "INTERNAL"
                ? "Ví EVmarket"
                : item.paymentGateway}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
      </TouchableOpacity>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="lock-closed-outline" size={80} color="#bdc3c7" />
        <Text style={styles.emptyTitle}>Vui lòng đăng nhập</Text>
        <Text style={styles.emptyText}>
          Bạn cần đăng nhập để xem lịch sử đơn hàng
        </Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => navigation.navigate("Main", { screen: "Profile" })}
        >
          <Text style={styles.shopButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={80} color="#bdc3c7" />
        <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
        <Text style={styles.emptyText}>
          Lịch sử mua hàng của bạn sẽ được hiển thị tại đây
        </Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => navigation.navigate("Main", { screen: "Products" })}
        >
          <Text style={styles.shopButtonText}>Khám phá sản phẩm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3498db"]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
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
    backgroundColor: "#f5f6fa",
    padding: 20,
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
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 15,
  },
  transactionCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
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
    backgroundColor: "#ecf0f1",
  },
  transactionInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 5,
  },
  multipleText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#7f8c8d",
  },
  transactionDate: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e74c3c",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  pendingPaymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff3cd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 5,
  },
  pendingPaymentText: {
    fontSize: 12,
    color: "#e67e22",
    fontWeight: "600",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  paymentMethod: {
    fontSize: 12,
    color: "#7f8c8d",
  },
});
