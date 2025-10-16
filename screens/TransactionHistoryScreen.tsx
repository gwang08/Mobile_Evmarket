import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Transaction } from '../types';
import { transactionService } from '../services/transactionService';
import { Ionicons } from '@expo/vector-icons';

type TransactionHistoryNavigationProp = StackNavigationProp<RootStackParamList>;

export default function TransactionHistoryScreen() {
  const navigation = useNavigation<TransactionHistoryNavigationProp>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTransactions();
    }, [])
  );

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getMyTransactions(1, 20);
      
      // Filter only COMPLETED transactions
      const completedTransactions = response.data.transactions.filter(
        (transaction) => transaction.status === 'COMPLETED'
      );
      
      setTransactions(completedTransactions);
      setHasMore(response.data.page < response.data.totalPages);
      setPage(1);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    // Chỉ hiển thị giao dịch COMPLETED
    return '#27ae60';
  };

  const getStatusText = (status: string) => {
    // Chỉ hiển thị giao dịch COMPLETED
    return 'Hoàn thành';
  };

  const handleTransactionPress = (transaction: Transaction) => {
    if (transaction.vehicle) {
      navigation.navigate('VehicleDetail', { vehicleId: transaction.vehicle.id });
    } else if (transaction.battery) {
      navigation.navigate('BatteryDetail', { batteryId: transaction.battery.id });
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const product = item.vehicle || item.battery;
    if (!product) return null;

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => handleTransactionPress(item)}
      >
        <Image
          source={{ uri: product.images[0] }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.transactionInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatCurrency(item.finalPrice)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
          <View style={styles.paymentRow}>
            <Ionicons 
              name={item.paymentGateway === 'MOMO' ? 'phone-portrait' : 'wallet'} 
              size={14} 
              color="#7f8c8d" 
            />
            <Text style={styles.paymentMethod}>
              {item.paymentGateway === 'MOMO' ? 'MoMo' : 'Ví EVmarket'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
      </TouchableOpacity>
    );
  };

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={80} color="#bdc3c7" />
        <Text style={styles.emptyTitle}>Chưa có giao dịch nào</Text>
        <Text style={styles.emptyText}>
          Lịch sử mua hàng của bạn sẽ được hiển thị tại đây
        </Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => navigation.navigate('Main', { screen: 'Products' })}
        >
          <Text style={styles.shopButtonText}>Khám phá sản phẩm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
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
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  transactionDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});
