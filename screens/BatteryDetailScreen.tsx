import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { RouteProp, useRoute, useNavigation, CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import { Battery } from '../types';
import { batteryService } from '../services/batteryService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ImageGallery from '../components/ImageGallery';
import BatterySpecifications from '../components/BatterySpecifications';
import SellerInfo from '../components/SellerInfo';
import ActionButtons from '../components/ActionButtons';

type BatteryDetailRouteProp = RouteProp<RootStackParamList, 'BatteryDetail'>;
type BatteryDetailNavigationProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

export default function BatteryDetailScreen() {
  const route = useRoute<BatteryDetailRouteProp>();
  const navigation = useNavigation<BatteryDetailNavigationProp>();
  const { batteryId } = route.params;
  const [battery, setBattery] = useState<Battery | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, setShowLoginPrompt } = useAuth();
  const { showError, showInfo } = useToast();

  useEffect(() => {
    fetchBatteryDetail();
  }, [batteryId]);

  // Reload when screen comes into focus (after returning from checkout)
  useFocusEffect(
    React.useCallback(() => {
      fetchBatteryDetail();
    }, [batteryId])
  );

  const fetchBatteryDetail = async () => {
    try {
      setLoading(true);
      const response = await batteryService.getBatteryById(batteryId);
      setBattery(response.data.battery);
    } catch (error) {
      console.error('Error fetching battery detail:', error);
      showError('Không thể tải thông tin pin. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRequired = () => {
    Alert.alert(
      'Yêu cầu đăng nhập',
      'Bạn cần đăng nhập để thực hiện hành động này. Vui lòng đăng nhập để tiếp tục.',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng nhập', 
          onPress: () => {
            // Navigate to Profile tab and show login
            navigation.navigate('Main', { screen: 'Profile' });
            setShowLoginPrompt(true);
          }
        }
      ]
    );
  };

  const handleSellerPress = () => {
    if (battery?.seller) {
      navigation.navigate('SellerDetail', { sellerId: battery.seller.id });
    }
  };

  const handleBuyPress = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Bạn cần đăng nhập để mua sản phẩm này. Vui lòng đăng nhập để tiếp tục.',
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Đăng nhập', 
            onPress: () => {
              // Navigate to Profile tab and show login
              navigation.navigate('Main', { screen: 'Profile' });
              setShowLoginPrompt(true);
            }
          }
        ]
      );
      return;
    }

    navigation.navigate('Checkout', { 
      productId: batteryId, 
      productType: 'battery' 
    });
  };

  const handleNegotiatePress = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Bạn cần đăng nhập để thương lượng với người bán. Vui lòng đăng nhập để tiếp tục.',
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Đăng nhập', 
            onPress: () => {
              // Navigate to Profile tab and show login
              navigation.navigate('Main', { screen: 'Profile' });
              setShowLoginPrompt(true);
            }
          }
        ]
      );
      return;
    }

    showInfo(`Gửi tin nhắn thương lượng cho ${battery?.seller?.name}`);
  };

  const getHealthColor = (health: number | null) => {
    if (!health) return '#95a5a6';
    if (health >= 90) return '#27ae60';
    if (health >= 70) return '#f39c12';
    return '#e74c3c';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải thông tin pin...</Text>
      </View>
    );
  }

  if (!battery) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy thông tin pin</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <ImageGallery images={battery.images} />
        
        <View style={styles.content}>
          {/* Basic Info */}
          <View style={styles.basicInfo}>
            <Text style={styles.title}>{battery.title}</Text>
            <View style={styles.basicDetails}>
              <Text style={styles.brand}>{battery.brand}</Text>
              <Text style={styles.year}>{battery.year}</Text>
            </View>
            <View style={styles.batteryDetails}>
              <Text style={styles.capacity}>{battery.capacity}kWh</Text>
              {battery.health && (
                <View style={styles.healthContainer}>
                  <View style={[styles.healthDot, { backgroundColor: getHealthColor(battery.health) }]} />
                  <Text style={[styles.health, { color: getHealthColor(battery.health) }]}>
                    {battery.health}% sức khỏe
                  </Text>
                </View>
              )}
            </View>
            {battery.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Đã xác minh</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Mô tả</Text>
            <Text style={styles.description}>{battery.description}</Text>
          </View>

          {/* Specifications */}
          <BatterySpecifications 
            specifications={battery.specifications}
            capacity={battery.capacity}
            year={battery.year}
            health={battery.health}
          />

          {/* Seller Info */}
          <SellerInfo 
            seller={battery.seller}
            onSellerPress={handleSellerPress}
          />
        </View>
      </ScrollView>

      {/* Action Buttons - Only show if battery is AVAILABLE */}
      {battery.status === 'AVAILABLE' && (
        <ActionButtons 
          price={battery.price}
          productId={batteryId}
          productType="battery"
          onBuyPress={handleBuyPress}
          onNegotiatePress={handleNegotiatePress}
          onLoginRequired={handleLoginRequired}
        />
      )}
      
      {/* Show status message if not available */}
      {battery.status === 'SOLD' && (
        <View style={styles.soldBanner}>
          <Text style={styles.soldText}>Sản phẩm này đã được bán</Text>
        </View>
      )}
      
      {battery.status === 'DELISTED' && (
        <View style={styles.delistedBanner}>
          <Text style={styles.delistedText}>Sản phẩm này đã bị gỡ khỏi danh sách</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  basicInfo: {
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  basicDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brand: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  year: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  batteryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  capacity: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  health: {
    fontSize: 14,
    fontWeight: '500',
  },
  verifiedBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionContainer: {
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
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  soldBanner: {
    backgroundColor: '#e74c3c',
    padding: 15,
    alignItems: 'center',
  },
  soldText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  delistedBanner: {
    backgroundColor: '#95a5a6',
    padding: 15,
    alignItems: 'center',
  },
  delistedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});