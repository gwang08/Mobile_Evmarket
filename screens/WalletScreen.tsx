import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Linking,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { walletService } from '../services/walletService';
import { Wallet } from '../types';

const WalletScreen: React.FC = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositForm, setShowDepositForm] = useState(false);

  // Các mức tiền gợi ý
  const suggestedAmounts = [50000, 100000, 200000, 500000, 1000000];

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const response = await walletService.getWalletBalance();
      setWallet(response.data);
    } catch (error) {
      console.error('Error loading wallet:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleDeposit = async () => {
    const amount = parseInt(depositAmount.replace(/[^0-9]/g, ''));
    
    if (!amount || amount < 10000) {
      Alert.alert('Lỗi', 'Số tiền nạp tối thiểu là 10,000 VND');
      return;
    }

    if (amount > 50000000) {
      Alert.alert('Lỗi', 'Số tiền nạp tối đa là 50,000,000 VND');
      return;
    }

    try {
      setDepositing(true);
      const response = await walletService.depositToWallet(amount);
      
      Alert.alert(
        'Xác nhận thanh toán',
        `Bạn sẽ được chuyển đến trang thanh toán MoMo để nạp ${formatCurrency(amount)}`,
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Tiếp tục',
            onPress: () => {
              Linking.openURL(response.data.payUrl);
              setShowDepositForm(false);
              setDepositAmount('');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating deposit:', error);
      Alert.alert('Lỗi', 'Không thể tạo yêu cầu nạp tiền');
    } finally {
      setDepositing(false);
    }
  };

  const selectSuggestedAmount = (amount: number) => {
    setDepositAmount(amount.toString());
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
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
      {/* Header với số dư */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="wallet" size={32} color="#27ae60" />
          <Text style={styles.balanceTitle}>Ví của tôi</Text>
        </View>
        
        <View style={styles.balanceContent}>
          <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
          <Text style={styles.balanceAmount}>
            {wallet ? formatCurrency(wallet.availableBalance) : '0 VND'}
          </Text>
          
          {wallet && wallet.lockedBalance > 0 && (
            <View style={styles.lockedBalance}>
              <Text style={styles.lockedLabel}>Số dư bị khóa</Text>
              <Text style={styles.lockedAmount}>
                {formatCurrency(wallet.lockedBalance)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Nút hành động */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.depositButton}
          onPress={() => setShowDepositForm(!showDepositForm)}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.depositButtonText}>Nạp tiền</Text>
        </TouchableOpacity>
      </View>

      {/* Form nạp tiền */}
      {showDepositForm && (
        <View style={styles.depositForm}>
          <Text style={styles.formTitle}>Nạp tiền vào ví</Text>
          
          {/* Các mức tiền gợi ý */}
          <Text style={styles.suggestedLabel}>Chọn nhanh:</Text>
          <View style={styles.suggestedAmounts}>
            {suggestedAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.suggestedButton,
                  depositAmount === amount.toString() && styles.suggestedButtonActive
                ]}
                onPress={() => selectSuggestedAmount(amount)}
              >
                <Text style={[
                  styles.suggestedButtonText,
                  depositAmount === amount.toString() && styles.suggestedButtonTextActive
                ]}>
                  {formatCurrency(amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input số tiền tùy chỉnh */}
          <Text style={styles.inputLabel}>Hoặc nhập số tiền:</Text>
          <TextInput
            style={styles.amountInput}
            value={depositAmount}
            onChangeText={setDepositAmount}
            placeholder="Nhập số tiền (VND)"
            keyboardType="numeric"
            returnKeyType="done"
          />

          <Text style={styles.noteText}>
            * Số tiền nạp tối thiểu: 10,000 VND{'\n'}
            * Số tiền nạp tối đa: 50,000,000 VND
          </Text>

          {/* Nút xác nhận */}
          <TouchableOpacity
            style={[styles.confirmButton, (!depositAmount || depositing) && styles.confirmButtonDisabled]}
            onPress={handleDeposit}
            disabled={!depositAmount || depositing}
          >
            {depositing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="card" size={20} color="white" />
                <Text style={styles.confirmButtonText}>Thanh toán với MoMo</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowDepositForm(false);
              setDepositAmount('');
            }}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Thông tin bổ sung */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Thông tin ví</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ID ví:</Text>
          <Text style={styles.infoValue}>{wallet?.id || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày tạo:</Text>
          <Text style={styles.infoValue}>
            {wallet?.createdAt ? new Date(wallet.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

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
    color: '#666',
  },
  balanceCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 12,
  },
  balanceContent: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 16,
  },
  lockedBalance: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  lockedLabel: {
    fontSize: 12,
    color: '#e74c3c',
    marginBottom: 4,
  },
  lockedAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
  actionButtons: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  depositButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#27ae60',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  depositButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  depositForm: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  suggestedLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  suggestedAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  suggestedButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  suggestedButtonActive: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  suggestedButtonText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
  },
  suggestedButtonTextActive: {
    color: 'white',
  },
  inputLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  noteText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 20,
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  confirmButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 12,
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
});

export default WalletScreen;