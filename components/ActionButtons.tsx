import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface ActionButtonsProps {
  price: number;
  productId?: string;
  productType?: 'vehicle' | 'battery';
  onBuyPress?: () => void;
  onNegotiatePress?: () => void;
  onLoginRequired?: () => void; // Callback when login is required
}

export default function ActionButtons({ 
  price, 
  productId, 
  productType, 
  onBuyPress, 
  onNegotiatePress,
  onLoginRequired
}: ActionButtonsProps) {
  const { isAuthenticated } = useAuth();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
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
                // Chuyển đến tab Profile để đăng nhập
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
      Alert.alert('Mua ngay', 'Chức năng đang phát triển');
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
                // Chuyển đến tab Profile để đăng nhập
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
      Alert.alert('Thương lượng', 'Chức năng đang phát triển');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.priceSection}>
        <Text style={styles.priceLabel}>Giá bán</Text>
        <Text style={styles.price}>{formatPrice(price)}</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.negotiateButton} onPress={handleNegotiatePress}>
          <Text style={styles.negotiateButtonText}> Thương lượng</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.buyButton} onPress={handleBuyPress}>
          <Text style={styles.buyButtonText}> Mua ngay</Text>
        </TouchableOpacity>
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
});