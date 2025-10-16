import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import { Vehicle, Battery } from '../types';
import { vehicleService } from '../services/vehicleService';
import { batteryService } from '../services/batteryService';
import VehicleCard from '../components/VehicleCard';
import BatteryCard from '../components/BatteryCard';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

type HomeScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isAuthenticated, setShowLoginPrompt } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch 6 available vehicles and batteries
      const [availableVehicles, availableBatteries] = await Promise.all([
        vehicleService.getAvailableVehicles(6),
        batteryService.getAvailableBatteries(6)
      ]);
      
  
      
      setVehicles(availableVehicles);
      setBatteries(availableBatteries);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVehiclePress = (vehicle: Vehicle) => {
    navigation.navigate('VehicleDetail', { vehicleId: vehicle.id });
  };

  const handleBatteryPress = (battery: Battery) => {
    navigation.navigate('BatteryDetail', { batteryId: battery.id });
  };

  const handleViewAllVehicles = () => {
    navigation.navigate('Products', { initialTab: 'vehicles' });
  };

  const handleViewAllBatteries = () => {
    navigation.navigate('Products', { initialTab: 'batteries' });
  };

  const handleTransactionHistoryPress = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Bạn cần đăng nhập để xem lịch sử mua hàng.',
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Đăng nhập', 
            onPress: () => {
              navigation.navigate('Main', { screen: 'Profile' });
              setShowLoginPrompt(true);
            }
          }
        ]
      );
      return;
    }
    navigation.navigate('TransactionHistory');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>EV Market</Text>
              <Text style={styles.subtitle}>Thị trường xe điện hàng đầu</Text>
            </View>
            <View style={styles.headerButtons}>
              {isAuthenticated && (
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={handleTransactionHistoryPress}
                >
                  <Ionicons name="receipt" size={24} color="#3498db" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <View style={styles.trustSection}>
            <Text style={styles.trustTitle}>Nền tảng tin cậy cho xe điện đã qua sử dụng</Text>
            <Text style={styles.trustDescription}>
              Mua bán xe điện, pin và thiết bị sạc đã qua sử dụng với sự an tâm. 
              Tất cả tin đăng đều được xác minh bởi chuyên gia trong ngành.
            </Text>
            <TouchableOpacity style={styles.getStartedButton}>
              <Text style={styles.getStartedText}>Bắt đầu ngay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top EV Deals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Xe điện hàng đầu</Text>
            <TouchableOpacity onPress={handleViewAllVehicles}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.grid}>
            {vehicles.map((vehicle) => (
              <VehicleCard 
                key={vehicle.id} 
                vehicle={vehicle}
                onPress={() => handleVehiclePress(vehicle)}
              />
            ))}
          </View>
        </View>

        {/* Top Battery Listings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pin xe điện hàng đầu</Text>
            <TouchableOpacity onPress={handleViewAllBatteries}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.grid}>
            {batteries.map((battery) => (
              <BatteryCard 
                key={battery.id} 
                battery={battery}
                onPress={() => handleBatteryPress(battery)}
              />
            ))}
          </View>
        </View>

        {/* Why Choose EV Section */}
        <View style={styles.whyChooseSection}>
          <Text style={styles.whyChooseTitle}>Tại sao chọn xe điện?</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>🌱</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Thân thiện môi trường</Text>
              <Text style={styles.featureDescription}>
                Không khí thải và phương tiện giao thông thân thiện với môi trường cho tương lai tốt đẹp hơn.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>💰</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Tiết kiệm chi phí</Text>
              <Text style={styles.featureDescription}>
                Tiết kiệm chi phí nhiên liệu và bảo dưỡng với xe điện.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>🔧</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Bảo dưỡng đơn giản</Text>
              <Text style={styles.featureDescription}>
                Xe điện yêu cầu ít bảo dưỡng hơn so với xe truyền thống.
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Sẵn sàng mua hoặc bán xe điện của bạn?</Text>
          <Text style={styles.ctaDescription}>
            Tham gia cùng hàng ngàn người dùng hài lòng tin tưởng nền tảng của chúng tôi cho giao dịch xe điện.
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Khám phá sản phẩm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  content: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  trustSection: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
  },
  trustTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  trustDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 20,
  },
  getStartedButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  getStartedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  whyChooseSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  whyChooseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  ctaSection: {
    backgroundColor: '#3498db',
    padding: 30,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  ctaDescription: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  ctaButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },
});