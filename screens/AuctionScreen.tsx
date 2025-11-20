import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { AuctionItem } from '../types';
import { auctionService } from '../services/auctionService';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

type AuctionScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function AuctionScreen() {
  const navigation = useNavigation<AuctionScreenNavigationProp>();
  const { isAuthenticated, setShowLoginPrompt } = useAuth();
  const { showError, showSuccess } = useToast();
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'vehicles' | 'batteries'>('all');

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await auctionService.getLiveAuctions();
      const auctionsWithType = response.data.results.map(auction => ({
        ...auction,
        listingType: auction.model ? 'VEHICLE' : 'BATTERY' as 'VEHICLE' | 'BATTERY'
      }));
      setAuctions(auctionsWithType);
      filterAuctions(auctionsWithType, activeTab);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      showError('Không thể tải danh sách đấu giá');
    } finally {
      setLoading(false);
    }
  };

  const filterAuctions = (auctionList: AuctionItem[], tab: 'all' | 'vehicles' | 'batteries') => {
    if (tab === 'all') {
      setFilteredAuctions(auctionList);
    } else if (tab === 'vehicles') {
      setFilteredAuctions(auctionList.filter(a => a.listingType === 'VEHICLE'));
    } else {
      setFilteredAuctions(auctionList.filter(a => a.listingType === 'BATTERY'));
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  useEffect(() => {
    filterAuctions(auctions, activeTab);
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAuctions();
    setRefreshing(false);
  };

  const handleAuctionPress = (auction: AuctionItem) => {
    navigation.navigate('AuctionDetail', {
      listingId: auction.id,
      listingType: auction.listingType,
    });
  };

  const handleCreateAuction = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Bạn cần đăng nhập để tạo đấu giá.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đăng nhập',
            onPress: () => {
              navigation.navigate('Main', { screen: 'Profile' });
              setShowLoginPrompt(true);
            },
          },
        ]
      );
      return;
    }
    navigation.navigate('CreateAuction');
  };

  const getTimeRemaining = (endTime: string | null) => {
    if (!endTime) return 'Chưa bắt đầu';
    
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return 'Đã kết thúc';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const renderAuctionCard = (auction: AuctionItem) => (
    <TouchableOpacity
      key={auction.id}
      style={styles.card}
      onPress={() => handleAuctionPress(auction)}
    >
      <Image source={{ uri: auction.images[0] }} style={styles.cardImage} />
      
      {/* Live badge */}
      <View style={styles.liveBadge}>
        <View style={styles.liveIndicator} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      {/* Type badge */}
      <View style={styles.typeBadge}>
        <Text style={styles.typeText}>
          {auction.listingType === 'VEHICLE' ? 'XE' : 'PIN'}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {auction.title}
        </Text>
        <Text style={styles.cardBrand}>{auction.brand}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Giá hiện tại:</Text>
          <Text style={styles.priceValue}>{formatPrice(auction.price)}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="#e74c3c" />
            <Text style={styles.timeText}>{getTimeRemaining(auction.auctionEndsAt)}</Text>
          </View>
          {auction.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.verifiedText}>Đã xác minh</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Đang tải đấu giá...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Đấu giá</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateAuction}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.createButtonText}>Tạo đấu giá</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Tất cả ({auctions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vehicles' && styles.activeTab]}
          onPress={() => setActiveTab('vehicles')}
        >
          <Text style={[styles.tabText, activeTab === 'vehicles' && styles.activeTabText]}>
            Xe ({auctions.filter(a => a.listingType === 'VEHICLE').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'batteries' && styles.activeTab]}
          onPress={() => setActiveTab('batteries')}
        >
          <Text style={[styles.tabText, activeTab === 'batteries' && styles.activeTabText]}>
            Pin ({auctions.filter(a => a.listingType === 'BATTERY').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Auctions List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          {filteredAuctions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="hammer-outline" size={64} color="#bdc3c7" />
              <Text style={styles.emptyText}>Không có đấu giá nào đang diễn ra</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredAuctions.map(renderAuctionCard)}
            </View>
          )}
        </View>
      </ScrollView>
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
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 5,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
  },
  activeTab: {
    backgroundColor: '#e74c3c',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeTabText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#ecf0f1',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  cardBrand: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  priceRow: {
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#e74c3c',
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  verifiedText: {
    fontSize: 9,
    color: '#27ae60',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});
