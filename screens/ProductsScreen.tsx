import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import { Vehicle, Battery } from '../types';
import { vehicleService } from '../services/vehicleService';
import { batteryService } from '../services/batteryService';
import VehicleCard from '../components/VehicleCard';
import BatteryCard from '../components/BatteryCard';
import { useToast } from '../contexts/ToastContext';

type ProductsScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type ProductsScreenRouteProp = RouteProp<TabParamList, 'Products'>;
type TabType = 'vehicles' | 'batteries';

export default function ProductsScreen() {
  const navigation = useNavigation<ProductsScreenNavigationProp>();
  const route = useRoute<ProductsScreenRouteProp>();
  const { showError } = useToast();
  
  // Set initial tab based on route params
  const [activeTab, setActiveTab] = useState<TabType>(route.params?.initialTab || 'vehicles');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Vehicle filters
  const [selectedBrand, setSelectedBrand] = useState('Tất cả');
  const [selectedYear, setSelectedYear] = useState('Tất cả');
  const [priceRange, setPriceRange] = useState('Tất cả');
  
  // Battery filters
  const [selectedBatteryBrand, setSelectedBatteryBrand] = useState('Tất cả');
  const [selectedCapacity, setSelectedCapacity] = useState('Tất cả');
  const [selectedHealth, setSelectedHealth] = useState('Tất cả');

  // Update active tab when route params change
  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all pages from API to get complete list
      const [allVehicles, allBatteries] = await Promise.all([
        fetchAllVehicles(),
        fetchAllBatteries()
      ]);
      
      setVehicles(allVehicles);
      setBatteries(allBatteries);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fetch all vehicles from all pages
  const fetchAllVehicles = async (): Promise<Vehicle[]> => {
    const allVehicles: Vehicle[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await vehicleService.getAllVehicles(currentPage, 10);
      allVehicles.push(...response.data.vehicles);
      
      if (currentPage >= (response.data.totalPages || 1)) {
        hasMore = false;
      } else {
        currentPage++;
      }
    }
    
    return allVehicles;
  };

  // Helper function to fetch all batteries from all pages
  const fetchAllBatteries = async (): Promise<Battery[]> => {
    const allBatteries: Battery[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await batteryService.getAllBatteries(currentPage, 10);
      allBatteries.push(...response.data.batteries);
      
      if (currentPage >= (response.data.totalPages || 1)) {
        hasMore = false;
      } else {
        currentPage++;
      }
    }
    
    return allBatteries;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter only AVAILABLE items first for dropdown options
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE');
  const availableBatteries = batteries.filter(b => b.status === 'AVAILABLE');



  // Get unique brands for vehicles (only from AVAILABLE)
  const vehicleBrands = ['Tất cả', ...Array.from(new Set(availableVehicles.map(v => v.brand)))];
  
  // Get unique years for vehicles (only from AVAILABLE)
  const vehicleYears = ['Tất cả', ...Array.from(new Set(availableVehicles.map(v => v.year.toString()))).sort((a, b) => b.localeCompare(a))];
  
  // Price ranges
  const priceRanges = [
    'Tất cả',
    'Dưới 500 triệu',
    '500 triệu - 1 tỷ',
    '1 tỷ - 1.5 tỷ',
    'Trên 1.5 tỷ'
  ];

  // Get unique brands for batteries (only from AVAILABLE)
  const batteryBrands = ['Tất cả', ...Array.from(new Set(availableBatteries.map(b => b.brand)))];
  
  // Capacity ranges
  const capacityRanges = [
    'Tất cả',
    'Dưới 50kWh',
    '50-75kWh',
    '75-100kWh',
    'Trên 100kWh'
  ];
  
  // Health ranges
  const healthRanges = [
    'Tất cả',
    'Trên 95%',
    '90-95%',
    '80-90%',
    'Dưới 80%'
  ];

  // Filter vehicles (already filtered to AVAILABLE only)
  const filteredVehicles = availableVehicles.filter(vehicle => {
    const matchesSearch = vehicle.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrand === 'Tất cả' || vehicle.brand === selectedBrand;
    const matchesYear = selectedYear === 'Tất cả' || vehicle.year.toString() === selectedYear;
    
    let matchesPrice = true;
    if (priceRange !== 'Tất cả') {
      const price = vehicle.price;
      switch (priceRange) {
        case 'Dưới 500 triệu':
          matchesPrice = price < 500000000;
          break;
        case '500 triệu - 1 tỷ':
          matchesPrice = price >= 500000000 && price <= 1000000000;
          break;
        case '1 tỷ - 1.5 tỷ':
          matchesPrice = price > 1000000000 && price <= 1500000000;
          break;
        case 'Trên 1.5 tỷ':
          matchesPrice = price > 1500000000;
          break;
      }
    }
    
    return matchesSearch && matchesBrand && matchesYear && matchesPrice;
  });

  // Filter batteries (already filtered to AVAILABLE only)
  const filteredBatteries = availableBatteries.filter(battery => {
    const matchesSearch = battery.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         battery.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBatteryBrand === 'Tất cả' || battery.brand === selectedBatteryBrand;
    
    let matchesCapacity = true;
    if (selectedCapacity !== 'Tất cả') {
      const capacity = battery.capacity;
      switch (selectedCapacity) {
        case 'Dưới 50kWh':
          matchesCapacity = capacity < 50;
          break;
        case '50-75kWh':
          matchesCapacity = capacity >= 50 && capacity <= 75;
          break;
        case '75-100kWh':
          matchesCapacity = capacity > 75 && capacity <= 100;
          break;
        case 'Trên 100kWh':
          matchesCapacity = capacity > 100;
          break;
      }
    }
    
    let matchesHealth = true;
    if (selectedHealth !== 'Tất cả' && battery.health) {
      const health = battery.health;
      switch (selectedHealth) {
        case 'Trên 95%':
          matchesHealth = health > 95;
          break;
        case '90-95%':
          matchesHealth = health >= 90 && health <= 95;
          break;
        case '80-90%':
          matchesHealth = health >= 80 && health < 90;
          break;
        case 'Dưới 80%':
          matchesHealth = health < 80;
          break;
      }
    }
    
    return matchesSearch && matchesBrand && matchesCapacity && matchesHealth;
  });

  const handleVehiclePress = (vehicle: Vehicle) => {
    navigation.navigate('VehicleDetail', { vehicleId: vehicle.id });
  };

  const handleBatteryPress = (battery: Battery) => {
    navigation.navigate('BatteryDetail', { batteryId: battery.id });
  };

  const resetFilters = () => {
    if (activeTab === 'vehicles') {
      setSelectedBrand('Tất cả');
      setSelectedYear('Tất cả');
      setPriceRange('Tất cả');
    } else {
      setSelectedBatteryBrand('Tất cả');
      setSelectedCapacity('Tất cả');
      setSelectedHealth('Tất cả');
    }
    setSearchQuery('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
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
        {/* Header with Tabs */}
        <View style={styles.header}>
          <Text style={styles.title}>Sản phẩm</Text>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'vehicles' && styles.activeTab]}
              onPress={() => setActiveTab('vehicles')}
            >
              <Text style={[styles.tabText, activeTab === 'vehicles' && styles.activeTabText]}>
                Xe điện 
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'batteries' && styles.activeTab]}
              onPress={() => setActiveTab('batteries')}
            >
              <Text style={[styles.tabText, activeTab === 'batteries' && styles.activeTabText]}>
                Pin 
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={`Tìm kiếm ${activeTab === 'vehicles' ? 'xe điện' : 'pin'}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Bộ lọc</Text>
            <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
              <Text style={styles.resetText}>Đặt lại</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'vehicles' ? (
            <>
              {/* Vehicle Filters */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <Text style={styles.filterLabel}>Hãng:</Text>
                {vehicleBrands.map((brand) => (
                  <TouchableOpacity
                    key={brand}
                    style={[styles.filterButton, selectedBrand === brand && styles.filterButtonActive]}
                    onPress={() => setSelectedBrand(brand)}
                  >
                    <Text style={[styles.filterButtonText, selectedBrand === brand && styles.filterButtonTextActive]}>
                      {brand}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <Text style={styles.filterLabel}>Năm:</Text>
                {vehicleYears.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[styles.filterButton, selectedYear === year && styles.filterButtonActive]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[styles.filterButtonText, selectedYear === year && styles.filterButtonTextActive]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <Text style={styles.filterLabel}>Giá:</Text>
                {priceRanges.map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[styles.filterButton, priceRange === range && styles.filterButtonActive]}
                    onPress={() => setPriceRange(range)}
                  >
                    <Text style={[styles.filterButtonText, priceRange === range && styles.filterButtonTextActive]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              {/* Battery Filters */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <Text style={styles.filterLabel}>Hãng:</Text>
                {batteryBrands.map((brand) => (
                  <TouchableOpacity
                    key={brand}
                    style={[styles.filterButton, selectedBatteryBrand === brand && styles.filterButtonActive]}
                    onPress={() => setSelectedBatteryBrand(brand)}
                  >
                    <Text style={[styles.filterButtonText, selectedBatteryBrand === brand && styles.filterButtonTextActive]}>
                      {brand}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <Text style={styles.filterLabel}>Dung lượng:</Text>
                {capacityRanges.map((capacity) => (
                  <TouchableOpacity
                    key={capacity}
                    style={[styles.filterButton, selectedCapacity === capacity && styles.filterButtonActive]}
                    onPress={() => setSelectedCapacity(capacity)}
                  >
                    <Text style={[styles.filterButtonText, selectedCapacity === capacity && styles.filterButtonTextActive]}>
                      {capacity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <Text style={styles.filterLabel}>Sức khỏe:</Text>
                {healthRanges.map((health) => (
                  <TouchableOpacity
                    key={health}
                    style={[styles.filterButton, selectedHealth === health && styles.filterButtonActive]}
                    onPress={() => setSelectedHealth(health)}
                  >
                    <Text style={[styles.filterButtonText, selectedHealth === health && styles.filterButtonTextActive]}>
                      {health}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {activeTab === 'vehicles' 
              ? `${filteredVehicles.length} xe điện` 
              : `${filteredBatteries.length} pin`
            }
          </Text>
        </View>

        {/* Products Grid */}
        <View style={styles.grid}>
          {activeTab === 'vehicles' ? (
            filteredVehicles.map((vehicle) => (
              <VehicleCard 
                key={vehicle.id} 
                vehicle={vehicle}
                onPress={() => handleVehiclePress(vehicle)}
              />
            ))
          ) : (
            filteredBatteries.map((battery) => (
              <BatteryCard 
                key={battery.id} 
                battery={battery}
                onPress={() => handleBatteryPress(battery)}
              />
            ))
          )}
        </View>

        {/* Empty State */}
        {((activeTab === 'vehicles' && filteredVehicles.length === 0) ||
          (activeTab === 'batteries' && filteredBatteries.length === 0)) && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Không tìm thấy {activeTab === 'vehicles' ? 'xe điện' : 'pin'} nào
            </Text>
            <TouchableOpacity onPress={resetFilters} style={styles.clearFiltersButton}>
              <Text style={styles.clearFiltersText}>Xóa bộ lọc</Text>
            </TouchableOpacity>
          </View>
        )}
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
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ecf0f1',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 21,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3498db',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeTabText: {
    color: 'white',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e74c3c',
    borderRadius: 15,
  },
  resetText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  filterRow: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginRight: 10,
    paddingVertical: 8,
    minWidth: 50,
  },
  filterButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  resultsContainer: {
    marginBottom: 15,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 15,
  },
  clearFiltersButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});