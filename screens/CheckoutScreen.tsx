import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Vehicle, Battery } from '../types';
import { vehicleService } from '../services/vehicleService';
import { batteryService } from '../services/batteryService';
import PaymentMethod from '../components/PaymentMethod';

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;
type CheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function CheckoutScreen() {
  const route = useRoute<CheckoutScreenRouteProp>();
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const { productId, productType } = route.params;

  const [product, setProduct] = useState<Vehicle | Battery | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'qr' | 'momo' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProductDetail();
  }, [productId, productType]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      if (productType === 'vehicle') {
        const response = await vehicleService.getVehicleById(productId);
        setProduct(response.data.vehicle);
      } else {
        const response = await batteryService.getBatteryById(productId);
        setProduct(response.data.battery);
      }
    } catch (error) {
      console.error('Error fetching product detail:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin sản phẩm');
      navigation.goBack();
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

  const handlePayment = () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Thông báo', 'Vui lòng chọn phương thức thanh toán');
      return;
    }

    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      
      const paymentMethodText = selectedPaymentMethod === 'qr' ? 'Quét mã QR' : 'Ví MoMo';
      
      Alert.alert(
        'Thanh toán thành công!',
        `Đã thanh toán ${formatPrice(product?.price || 0)} qua ${paymentMethodText}\n\nĐơn hàng sẽ được xử lý trong vòng 24h.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    }, 2000);
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