import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { RouteProp, useRoute, useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import { Vehicle } from '../types';
import { vehicleService } from '../services/vehicleService';
import { useAuth } from '../contexts/AuthContext';
import ImageGallery from '../components/ImageGallery';
import VehicleSpecifications from '../components/VehicleSpecifications';
import SellerInfo from '../components/SellerInfo';
import ActionButtons from '../components/ActionButtons';

type VehicleDetailRouteProp = RouteProp<RootStackParamList, 'VehicleDetail'>;
type VehicleDetailNavigationProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

export default function VehicleDetailScreen() {
  const route = useRoute<VehicleDetailRouteProp>();
  const navigation = useNavigation<VehicleDetailNavigationProp>();
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, setShowLoginPrompt } = useAuth();

  useEffect(() => {
    fetchVehicleDetail();
  }, [vehicleId]);

  const fetchVehicleDetail = async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getVehicleById(vehicleId);
      setVehicle(response.data.vehicle);
    } catch (error) {
      console.error('Error fetching vehicle detail:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin xe. Vui lòng thử lại.');
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
    if (vehicle?.seller) {
      navigation.navigate('SellerDetail', { sellerId: vehicle.seller.id });
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
      productId: vehicleId, 
      productType: 'vehicle' 
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

    Alert.alert('Thương lượng', `Gửi tin nhắn thương lượng cho ${vehicle?.seller?.name}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải thông tin xe...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy thông tin xe</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <ImageGallery images={vehicle.images} />
        
        <View style={styles.content}>
          {/* Basic Info */}
          <View style={styles.basicInfo}>
            <Text style={styles.title}>{vehicle.title}</Text>
            <View style={styles.basicDetails}>
              <Text style={styles.brand}>{vehicle.brand} • {vehicle.model}</Text>
              <Text style={styles.year}>{vehicle.year}</Text>
            </View>
            <Text style={styles.mileage}>
              {vehicle.mileage.toLocaleString('vi-VN')} km
            </Text>
            {vehicle.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Đã xác minh</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Mô tả</Text>
            <Text style={styles.description}>{vehicle.description}</Text>
          </View>

          {/* Specifications */}
          <VehicleSpecifications 
            specifications={vehicle.specifications}
            year={vehicle.year}
            mileage={vehicle.mileage}
          />

          {/* Seller Info */}
          <SellerInfo 
            seller={vehicle.seller}
            onSellerPress={handleSellerPress}
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <ActionButtons 
        price={vehicle.price}
        productId={vehicleId}
        productType="vehicle"
        onBuyPress={handleBuyPress}
        onNegotiatePress={handleNegotiatePress}
        onLoginRequired={handleLoginRequired}
      />
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
  mileage: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
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
});