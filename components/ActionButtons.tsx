import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface ActionButtonsProps {
  price: number;
  productId?: string;
  productType?: 'vehicle' | 'battery';
  onBuyPress?: () => void;
  onNegotiatePress?: () => void;
  onAddToCartPress?: () => void;
  onViewCartPress?: () => void;
  onLoginRequired?: () => void; // Callback when login is required
}

export default function ActionButtons({ 
  price, 
  productId, 
  productType, 
  onBuyPress,
  onNegotiatePress,
  onAddToCartPress, 
  onViewCartPress,
  onLoginRequired
}: ActionButtonsProps) {
  const { isAuthenticated } = useAuth();
  const { showInfo } = useToast();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // For battery: use cart buttons
  // For vehicle: use buy/negotiate buttons
  const isBattery = productType === 'battery';
  const useCartButtons = isBattery && (onAddToCartPress || onViewCartPress);

  const handleAddToCartPress = () => {
    if (!isAuthenticated) {
      if (onLoginRequired) {
        onLoginRequired();
      } else {
        Alert.alert(
          'Yêu cầu đăng nhập',
          'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng. Vui lòng đăng nhập để tiếp tục.',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Đăng nhập', 
              onPress: () => {
                // Navigation sẽ được xử lý từ parent component
              }
            }
          ]
        );
      }
      return;
    }

    if (onAddToCartPress) {
      onAddToCartPress();
    } else {
      showInfo('Chức năng đang phát triển');
    }
  };

  const handleViewCartPress = () => {
    if (!isAuthenticated) {
      if (onLoginRequired) {
        onLoginRequired();
      } else {
        Alert.alert(
          'Yêu cầu đăng nhập',
          'Bạn cần đăng nhập để xem giỏ hàng. Vui lòng đăng nhập để tiếp tục.',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Đăng nhập', 
              onPress: () => {
                // Navigation sẽ được xử lý từ parent component
              }
            }
          ]
        );
      }
      return;
    }

    if (onViewCartPress) {
      onViewCartPress();
    } else {
      showInfo('Chức năng đang phát triển');
    }
  };

  const handleBuyPress = () => {
    if (!isAuthenticated) {
      if (onLoginRequired) {
        onLoginRequired();
      } else {
        Alert.alert(
          'Yêu cầu đăng nhập',
          'Bạn cần đăng nhập để mua sản phẩm này. Vui lòng đăng nhập để tiếp tục.',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Đăng nhập', 
              onPress: () => {
                // Navigation sẽ được xử lý từ parent component
              }
            }
          ]
        );
      }
      return;
    }

    if (onBuyPress) {
      onBuyPress();
    } else {
      showInfo('Chức năng đang phát triển');
    }
  };

  const handleNegotiatePress = () => {
    if (!isAuthenticated) {
      if (onLoginRequired) {
        onLoginRequired();
      } else {
        Alert.alert(
          'Yêu cầu đăng nhập',
          'Bạn cần đăng nhập để thương lượng với người bán. Vui lòng đăng nhập để tiếp tục.',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Đăng nhập', 
              onPress: () => {
                // Navigation sẽ được xử lý từ parent component
              }
            }
          ]
        );
      }
      return;
    }

    if (onNegotiatePress) {
      onNegotiatePress();
    } else {
      showInfo('Chức năng đang phát triển');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.priceSection}>
        <Text style={styles.priceLabel}>Giá bán</Text>
        <Text style={styles.price}>{formatPrice(price)}</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        {useCartButtons ? (
          <>
            <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCartPress}>
              <Text style={styles.addToCartButtonText}>Thêm vào giỏ hàng</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.viewCartButton} onPress={handleViewCartPress}>
              <Text style={styles.viewCartButtonText}>Xem giỏ hàng</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.negotiateButton} onPress={handleNegotiatePress}>
              <Text style={styles.negotiateButtonText}>Thương lượng</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.buyButton} onPress={handleBuyPress}>
              <Text style={styles.buyButtonText}>Mua ngay</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  priceSection: {
    marginBottom: 15,
  },
  priceLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  negotiateButton: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  negotiateButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  viewCartButton: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewCartButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
  },
});