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
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { cartService, CartItem } from "../services/cartService";
import { checkoutService } from "../services/checkoutService";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Ionicons } from "@expo/vector-icons";
import { parseErrorMessage } from "../utils/errorHandler";
import PaymentMethod from "../components/PaymentMethod";
import { Linking } from "react-native";

type CartScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function CartScreen() {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"MOMO" | "WALLET" | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        loadCart();
      }
    }, [isAuthenticated])
  );

  const loadCart = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await cartService.getCart();
      setCartItems(response.data.items);
    } catch (error) {
      console.error("Error loading cart:", error);
      showError("Không thể tải giỏ hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCart();
    setRefreshing(false);
  };

  const handleRemoveItem = async (itemId: string) => {
    Alert.alert(
      "Xóa sản phẩm",
      "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setRemovingItemId(itemId);
              await cartService.removeFromCart(itemId);
              showSuccess("Đã xóa sản phẩm khỏi giỏ hàng");
              loadCart();
            } catch (error) {
              console.error("Error removing item:", error);
              showError("Không thể xóa sản phẩm. Vui lòng thử lại.");
            } finally {
              setRemovingItemId(null);
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

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      showWarning("Vui lòng đăng nhập để thanh toán");
      navigation.navigate("Main", { screen: "Profile" });
      return;
    }

    if (cartItems.length === 0) {
      showWarning("Giỏ hàng của bạn đang trống");
      return;
    }

    if (!selectedPaymentMethod) {
      showWarning("Vui lòng chọn phương thức thanh toán");
      return;
    }

    try {
      setProcessing(true);

      // Checkout từng item trong cart
      // Lưu ý: API có thể hỗ trợ checkout nhiều items cùng lúc, nhưng hiện tại checkout từng item
      const checkoutPromises = cartItems.map((item) =>
        checkoutService.initiateCheckout({
          listingId: item.listingId,
          listingType: item.listingType,
          paymentMethod: selectedPaymentMethod,
          depositOnly: true, // Pay 10% deposit only
          ...(selectedPaymentMethod === "MOMO" && {
            redirectUrl: "evmarket://checkout-callback",
          }),
        })
      );

      const results = await Promise.all(checkoutPromises);

      // Handle MoMo payment if selected
      if (selectedPaymentMethod === "MOMO" && results[0]?.data?.paymentInfo) {
        const paymentInfo = results[0].data.paymentInfo;
        const supported = await Linking.canOpenURL(paymentInfo.deeplink);
        
        if (supported) {
          await Linking.openURL(paymentInfo.deeplink);
          showInfo("Đang chuyển đến MoMo để thanh toán...");
        } else {
          // Fallback to payUrl
          await Linking.openURL(paymentInfo.payUrl);
          showInfo("Đang chuyển đến MoMo để thanh toán...");
        }
      } else {
        // Wallet payment
        showSuccess("Thanh toán thành công! Vui lòng kiểm tra lịch sử đơn hàng.");
        // Clear cart after successful payment by removing each item
        try {
          await Promise.all(
            cartItems.map((item) => cartService.removeFromCart(item.id))
          );
        } catch (clearError) {
          console.error("Error clearing cart:", clearError);
          // Continue even if clearing fails
        }
        // Clear local state
        setCartItems([]);
        setTimeout(() => {
          navigation.navigate("TransactionHistory");
        }, 2000);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage = parseErrorMessage(error);
      showError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleProductPress = (item: CartItem) => {
    if (item.listingType === "BATTERY" && item.battery) {
      navigation.navigate("BatteryDetail", {
        batteryId: item.battery.id,
      });
    } else if (item.listingType === "VEHICLE" && item.vehicle) {
      navigation.navigate("VehicleDetail", {
        vehicleId: item.vehicle.id,
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="lock-closed-outline" size={80} color="#bdc3c7" />
        <Text style={styles.emptyTitle}>Vui lòng đăng nhập</Text>
        <Text style={styles.emptyText}>
          Bạn cần đăng nhập để xem giỏ hàng
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("Main", { screen: "Profile" })}
        >
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && cartItems.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#bdc3c7" />
        <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
        <Text style={styles.emptyText}>
          Thêm sản phẩm vào giỏ hàng để bắt đầu mua sắm
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

  // Group items by seller
  const itemsBySeller = cartItems.reduce((acc, item) => {
    const sellerId = item.battery?.seller?.id || item.vehicle?.seller?.id || "unknown";
    if (!acc[sellerId]) {
      acc[sellerId] = [];
    }
    acc[sellerId].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {Object.entries(itemsBySeller).map(([sellerId, items]) => {
          const seller = items[0].battery?.seller || items[0].vehicle?.seller;

          return (
            <View key={sellerId} style={styles.sellerGroup}>
              {seller && (
                <View style={styles.sellerHeader}>
                  <Image
                    source={{ uri: seller.avatar || "https://via.placeholder.com/40" }}
                    style={styles.sellerAvatar}
                  />
                  <Text style={styles.sellerName}>{seller.name}</Text>
                </View>
              )}
              
              {items.map((item) => {
                const product = item.battery || item.vehicle;
                if (!product) return null;

                // Use product.price if available, otherwise fallback to item.price
                const displayPrice = product.price || item.price || 0;

                return (
                  <View key={item.id} style={styles.cartItem}>
                    <TouchableOpacity
                      style={styles.itemContent}
                      onPress={() => handleProductPress(item)}
                    >
                      <Image
                        source={{ uri: product.images[0] || "https://via.placeholder.com/80" }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                      <View style={styles.itemInfo}>
                        <Text style={styles.productTitle} numberOfLines={2}>
                          {product.title}
                        </Text>
                        <Text style={styles.productPrice}>
                          {formatPrice(displayPrice)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.removeButton, removingItemId === item.id && styles.removeButtonDisabled]}
                      onPress={() => handleRemoveItem(item.id)}
                      disabled={removingItemId === item.id}
                    >
                      {removingItemId === item.id ? (
                        <ActivityIndicator size="small" color="#e74c3c" />
                      ) : (
                        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}

              <View style={styles.sellerTotal}>
                <Text style={styles.sellerTotalLabel}>Tổng tiền người bán:</Text>
                <Text style={styles.sellerTotalPrice}>
                  {formatPrice(
                    items.reduce((sum, item) => {
                      const product = item.battery || item.vehicle;
                      const itemPrice = product?.price || item.price || 0;
                      return sum + itemPrice;
                    }, 0)
                  )}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Phương thức thanh toán</Text>
          <PaymentMethod
            selectedMethod={selectedPaymentMethod}
            onMethodSelect={setSelectedPaymentMethod}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalPrice}>
            {formatPrice(
              cartItems.reduce((sum, item) => {
                const product = item.battery || item.vehicle;
                const itemPrice = product?.price || item.price || 0;
                return sum + itemPrice;
              }, 0)
            )}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (!selectedPaymentMethod || processing) && styles.checkoutButtonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={!selectedPaymentMethod || processing}
        >
          {processing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.checkoutButtonText}>Thanh toán</Text>
          )}
        </TouchableOpacity>
      </View>
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
  loginButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
  scrollView: {
    flex: 1,
  },
  sellerGroup: {
    backgroundColor: "white",
    marginBottom: 12,
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sellerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#ecf0f1",
  },
  itemInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e74c3c",
  },
  removeButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 36,
    minHeight: 36,
  },
  removeButtonDisabled: {
    opacity: 0.6,
  },
  sellerTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
  },
  sellerTotalLabel: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  sellerTotalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  paymentSection: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 15,
  },
  footer: {
    backgroundColor: "white",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e74c3c",
  },
  checkoutButton: {
    backgroundColor: "#3498db",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutButtonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

