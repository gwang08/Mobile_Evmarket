import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Vehicle, Battery } from '../types';
import { vehicleService } from '../services/vehicleService';
import { batteryService } from '../services/batteryService';
import { checkoutService } from '../services/checkoutService';
import PaymentMethod from '../components/PaymentMethod';
import { useToast } from '../contexts/ToastContext';
import { parseErrorMessage } from '../utils/errorHandler';

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;
type CheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function CheckoutScreen() {
  const route = useRoute<CheckoutScreenRouteProp>();
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const { productId, productType } = route.params;
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const [product, setProduct] = useState<Vehicle | Battery | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'MOMO' | 'WALLET' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProductDetail();
  }, [productId, productType]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      if (productType === 'vehicle') {
        const response = await vehicleService.getVehicleById(productId);
        const vehicle = response.data.vehicle;
        setProduct(vehicle);
        
        // Check if product is not available
        if (vehicle.status !== 'AVAILABLE') {
          const message = vehicle.status === 'SOLD' 
            ? 'Sản phẩm này đã được bán. Vui lòng chọn sản phẩm khác.'
            : 'Sản phẩm này không còn khả dụng.';
          showError(message);
          setTimeout(() => navigation.goBack(), 2000);
          return;
        }
      } else {
        const response = await batteryService.getBatteryById(productId);
        const battery = response.data.battery;
        setProduct(battery);
        
        // Check if product is not available
        if (battery.status !== 'AVAILABLE') {
          const message = battery.status === 'SOLD' 
            ? 'Sản phẩm này đã được bán. Vui lòng chọn sản phẩm khác.'
            : 'Sản phẩm này không còn khả dụng.';
          showError(message);
          setTimeout(() => navigation.goBack(), 2000);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching product detail:', error);
      const errorMessage = parseErrorMessage(error);
      showError(errorMessage);
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      showWarning('Vui lòng chọn phương thức thanh toán');
      return;
    }

    if (!product) {
      showError('Không tìm thấy thông tin sản phẩm');
      return;
    }

    try {
      setProcessing(true);

      const checkoutData = {
        listingId: productId,
        listingType: productType === 'vehicle' ? 'VEHICLE' as const : 'BATTERY' as const,
        paymentMethod: selectedPaymentMethod,
      };

      const response = await checkoutService.initiateCheckout(checkoutData);

      if (selectedPaymentMethod === 'MOMO' && response.data.paymentInfo) {
        // Open MoMo app using deeplink
        const { deeplink, payUrl } = response.data.paymentInfo;
        
        const canOpen = await Linking.canOpenURL(deeplink);
        if (canOpen) {
          await Linking.openURL(deeplink);
          
          // Show instruction with toast
          showInfo('Vui lòng hoàn tất thanh toán trên ứng dụng MoMo. Sau khi thanh toán, quay lại ứng dụng để kiểm tra trạng thái đơn hàng.', 5000);
          
          // Navigate to home after a short delay
          setTimeout(() => {
            navigation.navigate('Main');
          }, 1500);
        } else {
          // Fallback to web URL if can't open MoMo app
          await Linking.openURL(payUrl);
        }
      } else if (selectedPaymentMethod === 'WALLET') {
        // Wallet payment requires 2 steps:
        // 1. Initiate checkout (already done above - creates PENDING transaction)
        // 2. Pay with wallet (completes the transaction)
        
        const transactionId = response.data.transactionId;
        
        // Step 2: Complete payment with wallet
        const paymentResult = await checkoutService.payWithWallet(transactionId);
        
        // Payment successful, transaction is now COMPLETED
        showSuccess(`Thanh toán thành công ${formatPrice(product.price)} từ ví EVmarket!`, 4000);
        
        // Navigate back to show SOLD status
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error processing checkout:', error);
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
            <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tóm tắt đơn hàng</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giá sản phẩm:</Text>
            <Text style={styles.summaryValue}>{formatPrice(product.price)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
            <Text style={styles.summaryValue}>Miễn phí</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalValue}>{formatPrice(product.price)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <PaymentMethod
          selectedMethod={selectedPaymentMethod}
          onMethodSelect={setSelectedPaymentMethod}
        />

        {/* Seller Info */}
        {product.seller && (
          <View style={styles.sellerCard}>
            <Text style={styles.sellerTitle}>Thông tin người bán</Text>
            <View style={styles.sellerInfo}>
              <Image
                source={{ uri: product.seller.avatar }}
                style={styles.sellerAvatar}
              />
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{product.seller.name}</Text>
                <Text style={styles.sellerEmail}>{product.seller.email}</Text>
                {product.seller.isVerified && (
                  <Text style={styles.verifiedBadge}>✓ Đã xác thực</Text>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.paymentButtonContainer}>
        <TouchableOpacity
          style={[
            styles.paymentButton,
            !selectedPaymentMethod && styles.paymentButtonDisabled,
            processing && styles.paymentButtonProcessing
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
              Thanh toán {formatPrice(product.price)}
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
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
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
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  productBrand: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
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
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  summaryValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 10,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  sellerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sellerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 3,
  },
  sellerEmail: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 3,
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  paymentButtonContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  paymentButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  paymentButtonProcessing: {
    backgroundColor: '#f39c12',
  },
  paymentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});