import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import { vehicleService } from '../services/vehicleService';
import { batteryService } from '../services/batteryService';
import { Vehicle, Battery } from '../types';
import { useAuth } from '../contexts/AuthContext';

type MyListingsNavigationProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList, 'MyListings'>,
  BottomTabNavigationProp<TabParamList>
>;

export default function MyListingsScreen() {
  const navigation = useNavigation<MyListingsNavigationProp>();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [filteredBatteries, setFilteredBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'batteries'>('vehicles');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'AVAILABLE', 'SOLD', 'DELISTED'
    sortBy: 'newest', // 'newest', 'oldest', 'price-high', 'price-low'
  });

  useEffect(() => {
    if (user?.id) {
      loadMyListings();
    }
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadMyListings();
      }
    }, [user?.id])
  );

  const loadMyListings = async () => {
    if (!user?.id) {
      console.log('No user ID available');
      return;
    }

    try {
      setLoading(true);
      const [vehiclesResponse, batteriesResponse] = await Promise.all([
        vehicleService.getMyVehicles(user.id),
        batteryService.getMyBatteries(user.id),
      ]);
      setVehicles(vehiclesResponse.data.vehicles);
      setBatteries(batteriesResponse.data.batteries);
      applyFilters(vehiclesResponse.data.vehicles, batteriesResponse.data.batteries);
    } catch (error) {
      console.error('Error loading my listings:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách sản phẩm của bạn');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (vehicleList: Vehicle[], batteryList: Battery[]) => {
    let filteredVehicleList = [...vehicleList];
    let filteredBatteryList = [...batteryList];

    // Filter by status
    if (filters.status !== 'all') {
      filteredVehicleList = filteredVehicleList.filter(v => v.status === filters.status);
      filteredBatteryList = filteredBatteryList.filter(b => b.status === filters.status);
    }

    // Sort
    const sortFn = (a: any, b: any) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price-high':
          return b.price - a.price;
        case 'price-low':
          return a.price - b.price;
        default:
          return 0;
      }
    };

    filteredVehicleList.sort(sortFn);
    filteredBatteryList.sort(sortFn);

    setFilteredVehicles(filteredVehicleList);
    setFilteredBatteries(filteredBatteryList);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyListings();
    setRefreshing(false);
  };

  const handleDelete = (type: 'vehicle' | 'battery', id: string, title: string) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa "${title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => confirmDelete(type, id),
        },
      ]
    );
  };

  const confirmDelete = async (type: 'vehicle' | 'battery', id: string) => {
    try {
      if (type === 'vehicle') {
        await vehicleService.deleteVehicle(id);
        const updatedVehicles = vehicles.filter(v => v.id !== id);
        setVehicles(updatedVehicles);
        applyFilters(updatedVehicles, batteries);
      } else {
        await batteryService.deleteBattery(id);
        const updatedBatteries = batteries.filter(b => b.id !== id);
        setBatteries(updatedBatteries);
        applyFilters(vehicles, updatedBatteries);
      }
      Alert.alert('Thành công', 'Đã xóa sản phẩm');
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Lỗi', 'Không thể xóa sản phẩm');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return '#27ae60';
      case 'SOLD':
        return '#e74c3c';
      case 'DELISTED':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Đang bán';
      case 'SOLD':
        return 'Đã bán';
      case 'DELISTED':
        return 'Đã gỡ';
      default:
        return status;
    }
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
    >
      <Image source={{ uri: item.images[0] }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.productPrice}>
          {item.price.toLocaleString('vi-VN')} VND
        </Text>
        <View style={styles.productMeta}>
          <Text style={styles.productBrand}>{item.brand} {item.model}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('CreateVehicle')}
          >
            <Text style={styles.editButtonText}>Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete('vehicle', item.id, item.title)}
          >
            <Text style={styles.deleteButtonText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderBatteryItem = ({ item }: { item: Battery }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('BatteryDetail', { batteryId: item.id })}
    >
      <Image source={{ uri: item.images[0] }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.productPrice}>
          {item.price.toLocaleString('vi-VN')} VND
        </Text>
        <View style={styles.productMeta}>
          <Text style={styles.productBrand}>{item.brand} - {item.capacity}kWh</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('CreateBattery')}
          >
            <Text style={styles.editButtonText}>Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete('battery', item.id, item.title)}
          >
            <Text style={styles.deleteButtonText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📦</Text>
      <Text style={styles.emptyStateTitle}>Chưa có sản phẩm</Text>
      <Text style={styles.emptyStateDescription}>
        Bạn chưa đăng bán sản phẩm nào. Hãy bắt đầu đăng bán để kiếm thêm thu nhập!
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('Main', { screen: 'Sell' })}
      >
        <Text style={styles.addButtonText}>+ Đăng bán ngay</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải sản phẩm của bạn...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with filters */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterButtonText}>🔍 Lọc & Sắp xếp</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vehicles' && styles.activeTab]}
          onPress={() => setActiveTab('vehicles')}
        >
          <Text style={[styles.tabText, activeTab === 'vehicles' && styles.activeTabText]}>
            Xe điện ({filteredVehicles.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'batteries' && styles.activeTab]}
          onPress={() => setActiveTab('batteries')}
        >
          <Text style={[styles.tabText, activeTab === 'batteries' && styles.activeTabText]}>
            Pin điện ({filteredBatteries.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'vehicles' ? (
          filteredVehicles.length > 0 ? (
            <FlatList
              data={filteredVehicles}
              renderItem={renderVehicleItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            renderEmptyState()
          )
        ) : (
          filteredBatteries.length > 0 ? (
            <FlatList
              data={filteredBatteries}
              renderItem={renderBatteryItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            renderEmptyState()
          )
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lọc & Sắp xếp</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Trạng thái</Text>
              {['all', 'AVAILABLE', 'SOLD', 'DELISTED'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    filters.status === status && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilters({ ...filters, status })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.status === status && styles.filterOptionTextActive,
                    ]}
                  >
                    {status === 'all'
                      ? 'Tất cả'
                      : status === 'AVAILABLE'
                      ? 'Đang bán'
                      : status === 'SOLD'
                      ? 'Đã bán'
                      : 'Đã gỡ'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sắp xếp theo</Text>
              {[
                { key: 'newest', label: 'Mới nhất' },
                { key: 'oldest', label: 'Cũ nhất' },
                { key: 'price-high', label: 'Giá cao → thấp' },
                { key: 'price-low', label: 'Giá thấp → cao' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    filters.sortBy === option.key && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilters({ ...filters, sortBy: option.key })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.sortBy === option.key && styles.filterOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                applyFilters(vehicles, batteries);
                setShowFilters(false);
              }}
            >
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  filterButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#ecf0f1',
  },
  productInfo: {
    padding: 15,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productBrand: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f39c12',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#7f8c8d',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 30,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  filterOption: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    marginBottom: 10,
  },
  filterOptionActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: 'white',
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  applyButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});