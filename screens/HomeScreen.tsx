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

type HomeScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehiclesResponse, batteriesResponse] = await Promise.all([
        vehicleService.getAllVehicles(),
        batteryService.getAllBatteries()
      ]);
      
      // Show all vehicles and batteries, limit to display count
      const topVehicles = vehiclesResponse.data.vehicles.slice(0, 6);
      const topBatteries = batteriesResponse.data.batteries.slice(0, 6);
      
      console.log('Total vehicles from API:', vehiclesResponse.data.vehicles.length);
      console.log('Showing vehicles:', topVehicles.length);
      console.log('Total batteries from API:', batteriesResponse.data.batteries.length);
      console.log('Showing batteries:', topBatteries.length);
      
      setVehicles(topVehicles);
      setBatteries(topBatteries);
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
          <Text style={styles.title}>EV Market</Text>
          <Text style={styles.subtitle}>Thị trường xe điện hàng đầu</Text>
          
          <View style={styles.trustSection}>
            <Text style={styles.trustTitle}>The Trusted Marketplace for Second-hand EVs</Text>
            <Text style={styles.trustDescription}>
              Buy and sell pre-owned electric vehicles, batteries, and charging equipment with confidence. 
              All listings are verified by industry professionals.
            </Text>
            <TouchableOpacity style={styles.getStartedButton}>
              <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top EV Deals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top EV Deals</Text>
            <TouchableOpacity onPress={handleViewAllVehicles}>
              <Text style={styles.viewAllText}>View all</Text>
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
            <Text style={styles.sectionTitle}>Top Battery Listings</Text>
            <TouchableOpacity onPress={handleViewAllBatteries}>
              <Text style={styles.viewAllText}>View all</Text>
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
          <Text style={styles.whyChooseTitle}>Why Choose EV?</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>🌱</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Environmentally Friendly</Text>
              <Text style={styles.featureDescription}>
                Zero emissions and eco-friendly transportation for a better future.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>💰</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Cost Effective</Text>
              <Text style={styles.featureDescription}>
                Save on fuel costs and maintenance with electric vehicles.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>🔧</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Low Maintenance</Text>
              <Text style={styles.featureDescription}>
                Electric vehicles require less maintenance than traditional cars.
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Buy or Sell Your Electric Vehicle?</Text>
          <Text style={styles.ctaDescription}>
            Join thousands of satisfied users who trust our platform for their EV transactions.
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Browse Listings</Text>
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