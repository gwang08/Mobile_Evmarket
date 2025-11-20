import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Switch,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { AuctionDetailResponse, Bid } from '../types';
import { auctionService } from '../services/auctionService';
import { checkoutService } from '../services/checkoutService';
import { transactionService } from '../services/transactionService';
import { supabase } from '../config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ImageGallery from '../components/ImageGallery';
import QuickBidButtons from '../components/QuickBidButtons';
import AutoBidControl from '../components/AutoBidControl';

type AuctionDetailScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type AuctionDetailScreenRouteProp = RouteProp<RootStackParamList, 'AuctionDetail'>;

export default function AuctionDetailScreen() {
  const navigation = useNavigation<AuctionDetailScreenNavigationProp>();
  const route = useRoute<AuctionDetailScreenRouteProp>();
  const { listingId, listingType } = route.params;
  const { isAuthenticated, user, setShowLoginPrompt } = useAuth();
  const { showError, showSuccess } = useToast();

  const [auction, setAuction] = useState<AuctionDetailResponse['data'] | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isPayingDeposit, setIsPayingDeposit] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [isAutoPlacingBid, setIsAutoPlacingBid] = useState(false);
  const [bidInputFocused, setBidInputFocused] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'WALLET' | 'MOMO' | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const channelRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const priceAnimValue = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const autoBidTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bidInputRef = useRef<TextInput>(null);

  const fetchAuctionDetail = async () => {
    try {
      setLoading(true);
      const response = await auctionService.getAuctionDetail(listingType, listingId);
      console.log('=== AUCTION DETAIL ===');
      console.log('Current Price:', response.data.price);
      console.log('Starting Price:', response.data.startingPrice);
      console.log('Bid Increment:', response.data.bidIncrement);
      console.log('Total Bids:', response.data.bids.length);
      console.log('Bids:', response.data.bids);
      
      setAuction(response.data);
      setBids(response.data.bids);
      
      // Set initial bid amount (current price + bid increment)
      // Use highest bid if exists, otherwise use starting price
      let currentPrice = response.data.startingPrice;
      if (response.data.bids.length > 0) {
        currentPrice = response.data.bids[0].amount; // Use highest bid, NOT server price
      }
      const nextMinBid = currentPrice + response.data.bidIncrement;
      console.log('Actual Current Price (from bids[0] or startingPrice):', currentPrice);
      console.log('Next Min Bid (for input):', nextMinBid);
      setBidAmount(nextMinBid.toString());
    } catch (error: any) {
      console.error('Error fetching auction detail:', error);
      showError('Không thể tải thông tin đấu giá');
    } finally {
      setLoading(false);
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    fetchAuctionDetail();

    // Subscribe to realtime bid updates
    const filterField = listingType === 'VEHICLE' ? 'vehicleId' : 'batteryId';
    const channel = supabase.channel(`auction-room-${listingId}`);
    
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Bid',
          filter: `${filterField}=eq.${listingId}`,
        },
        (payload) => {
          console.log('=== NEW BID RECEIVED (REALTIME) ===');
          console.log('Bid payload:', payload.new);
          const newBid = payload.new as Bid;
          console.log('New bid amount:', newBid.amount);
          
          // Add new bid to the list
          setBids(prev => [newBid, ...prev]);
          
          // Update auction price and calculate next bid
          setAuction(prev => {
            if (!prev) return null;
            const nextMinBid = newBid.amount + prev.bidIncrement;
            console.log('Updated price to:', newBid.amount);
            console.log('Next min bid (for input):', nextMinBid);
            setBidAmount(nextMinBid.toString());
            return { ...prev, price: newBid.amount };
          });
          
          // Price animation
          Animated.sequence([
            Animated.parallel([
              Animated.timing(priceAnimValue, {
                toValue: 1.2,
                duration: 200,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(priceAnimValue, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (autoBidTimeoutRef.current) {
        clearTimeout(autoBidTimeoutRef.current);
      }
    };
  }, [listingId, listingType]);

  // Auto-bid logic - separate useEffect to handle auto-bidding
  useEffect(() => {
    if (!auction || !autoBidEnabled || !user?.id || bids.length === 0) {
      return;
    }

    const highestBid = bids[0];
    
    // Don't auto-bid if I'm already the highest bidder
    if (highestBid.bidderId === user.id) {
      console.log('Auto-bid: Already highest bidder');
      return;
    }

    // Use actual current price (starting price if no bids, otherwise highest bid amount)
    const currentPrice = bids.length > 0 ? bids[0].amount : auction.startingPrice;
    const nextMinBid = currentPrice + auction.bidIncrement;
    
    console.log('Auto-bid: Will place unlimited bid', nextMinBid);
    
    // Clear previous timeout
    if (autoBidTimeoutRef.current) {
      clearTimeout(autoBidTimeoutRef.current);
    }
    
    // Delay to avoid race condition
    autoBidTimeoutRef.current = setTimeout(() => {
      console.log('Auto-bid: Executing unlimited bid for', nextMinBid);
      handleAutoBid(nextMinBid);
    }, 1500);

    return () => {
      if (autoBidTimeoutRef.current) {
        clearTimeout(autoBidTimeoutRef.current);
      }
    };
  }, [bids, auction, autoBidEnabled, user?.id]);

  // Countdown timer
  useEffect(() => {
    if (!auction?.auctionEndsAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(auction.auctionEndsAt!).getTime();
      
      // Check if auction has start time
      if (auction.auctionStartsAt) {
        const start = new Date(auction.auctionStartsAt).getTime();
        
        // If not started yet, show time until start
        if (now < start) {
          const diffToStart = start - now;
          const days = Math.floor(diffToStart / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diffToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diffToStart % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diffToStart % (1000 * 60)) / 1000);
          
          if (days > 0) {
            setTimeRemaining(`Bắt đầu sau ${days} ngày ${hours} giờ`);
          } else {
            setTimeRemaining(`Bắt đầu sau ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          }
          return;
        }
      }

      // Calculate time remaining until end
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Đã kết thúc');
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        // Refetch to get userAuctionResult
        fetchAuctionDetail();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [auction]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAuctionDetail();
    setRefreshing(false);
  };

  const handleAutoBid = async (amount: number) => {
    if (!isAuthenticated || !auction) return;
    
    try {
      setIsAutoPlacingBid(true);
      await auctionService.placeBid(listingType, listingId, { amount });
      console.log('Auto-bid placed:', amount);
    } catch (error: any) {
      console.error('Auto-bid error:', error);
      // Disable auto-bid on error
      setAutoBidEnabled(false);
      showError('Đấu giá tự động thất bại: ' + (error.response?.data?.message || 'Lỗi không xác định'));
    } finally {
      setIsAutoPlacingBid(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!isAuthenticated) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để đặt giá.', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => {
          navigation.navigate('Main', { screen: 'Profile' });
          setShowLoginPrompt(true);
        }},
      ]);
      return;
    }

    const amount = parseInt(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (!auction) return;

    const minBid = auction.price + auction.bidIncrement;
    if (amount < minBid) {
      showError(`Giá đặt phải ít nhất ${formatPrice(minBid)}`);
      return;
    }

    try {
      setIsPlacingBid(true);
      
      // Optimistic update
      const optimisticBid: Bid = {
        id: 'temp-' + Date.now(),
        amount,
        bidderId: user?.id || '',
        vehicleId: listingType === 'VEHICLE' ? listingId : null,
        batteryId: listingType === 'BATTERY' ? listingId : null,
        createdAt: new Date().toISOString(),
        bidder: {
          id: user?.id || '',
          name: user?.name || 'Bạn',
          avatar: user?.avatar || '',
        },
      };
      
      setBids(prev => [optimisticBid, ...prev]);
      setAuction(prev => prev ? { ...prev, price: amount } : null);
      if (auction) {
        setBidAmount((amount + auction.bidIncrement).toString());
      }
      
      await auctionService.placeBid(listingType, listingId, { amount });
      showSuccess('Đặt giá thành công!');
      // No need to reload, realtime will update
    } catch (error: any) {
      console.error('Error placing bid:', error);
      
      // Handle specific error messages
      if (error.response?.status === 403) {
        if (error.response?.data?.message?.includes('deposit')) {
          showError('Bạn cần đặt cọc trước khi đấu giá');
        } else if (error.response?.data?.message?.includes('own auction')) {
          showError('Bạn không thể đấu giá sản phẩm của chính mình');
        } else {
          showError(error.response?.data?.message || 'Không thể đặt giá');
        }
      } else if (error.response?.status === 400) {
        const msg = error.response?.data?.message || '';
        if (msg.includes('highest bidder')) {
          showError('Bạn đang giữ giá cao nhất');
        } else if (msg.includes('not started')) {
          showError('Đấu giá chưa bắt đầu');
        } else if (msg.includes('already ended')) {
          showError('Đấu giá đã kết thúc');
        } else if (msg.includes('must be at least')) {
          showError(msg);
        } else {
          showError('Không thể đặt giá. Vui lòng thử lại');
        }
      } else {
        showError('Không thể đặt giá. Vui lòng thử lại');
      }
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handlePayDeposit = async () => {
    if (!isAuthenticated) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để đặt cọc.', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => {
          navigation.navigate('Main', { screen: 'Profile' });
          setShowLoginPrompt(true);
        }},
      ]);
      return;
    }

    if (!auction) return;

    Alert.alert(
      'Xác nhận đặt cọc',
      `Bạn sẽ đặt cọc ${formatPrice(auction.depositAmount)} để tham gia đấu giá. Tiền cọc sẽ được hoàn lại nếu bạn không thắng đấu giá.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đồng ý', onPress: async () => {
          try {
            setIsPayingDeposit(true);
            await auctionService.payDeposit(listingType, listingId);
            showSuccess('Đặt cọc thành công! Bạn có thể đấu giá ngay bây giờ.');
            await fetchAuctionDetail();
          } catch (error: any) {
            console.error('Error paying deposit:', error);
            showError(error.response?.data?.message || 'Không thể đặt cọc. Vui lòng thử lại');
          } finally {
            setIsPayingDeposit(false);
          }
        }},
      ]
    );
  };

  const handleAuctionPayment = async () => {
    if (!selectedPayment || !auction) {
      showError('Vui lòng chọn phương thức thanh toán');
      return;
    }

    try {
      setIsProcessingPayment(true);
      
      // Fetch transactions to get transaction ID for this auction
      const transactionsResponse = await transactionService.getMyTransactions(1, 100);
      const auctionTransaction = transactionsResponse.data.transactions.find(
        (txn) => 
          txn.type === 'AUCTION' && 
          txn.status === 'PAYMENT_PENDING' &&
          ((listingType === 'VEHICLE' && txn.vehicleId === listingId) || 
           (listingType === 'BATTERY' && txn.batteryId === listingId))
      );

      if (!auctionTransaction) {
        showError('Không tìm thấy giao dịch đấu giá');
        return;
      }

      const response = await checkoutService.payAuctionTransaction(auctionTransaction.id, selectedPayment);

      if (selectedPayment === 'WALLET') {
        showSuccess('Thanh toán thành công!');
        navigation.navigate('TransactionHistory');
      } else {
        // MoMo payment
        const payUrl = response.data.paymentDetail?.payUrl;
        if (payUrl) {
          const { Linking } = require('react-native');
          const canOpen = await Linking.canOpenURL(payUrl);
          if (canOpen) {
            await Linking.openURL(payUrl);
            showSuccess('Đang chuyển đến cổng thanh toán MoMo...');
          } else {
            showError('Không thể mở liên kết thanh toán');
          }
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      showError(error.response?.data?.message || 'Thanh toán thất bại');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để mua ngay.', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => {
          navigation.navigate('Main', { screen: 'Profile' });
          setShowLoginPrompt(true);
        }},
      ]);
      return;
    }

    if (!auction?.buyNowPrice) return;

    Alert.alert(
      'Xác nhận mua ngay',
      `Bạn sẽ mua sản phẩm với giá ${formatPrice(auction.buyNowPrice)}. Vui lòng hoàn tất thanh toán trong vòng 24 giờ.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Mua ngay', onPress: async () => {
          try {
            setIsBuyingNow(true);
            await auctionService.buyNow(listingType, listingId);
            showSuccess('Mua thành công! Vui lòng thanh toán trong vòng 24 giờ.');
            navigation.navigate('TransactionHistory');
          } catch (error: any) {
            console.error('Error buying now:', error);
            showError(error.response?.data?.message || 'Không thể mua. Vui lòng thử lại');
          } finally {
            setIsBuyingNow(false);
          }
        }},
      ]
    );
  };

  const handleQuickBid = (amount: number) => {
    setBidAmount(amount.toString());
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!auction) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Không tìm thấy đấu giá</Text>
      </View>
    );
  }

  const highestBid = bids.length > 0 ? bids[0] : null;
  const isOwner = user?.id === auction.sellerId;
  
  // Check if auction has started
  const hasStarted = !auction.auctionStartsAt || new Date(auction.auctionStartsAt).getTime() <= Date.now();

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {/* Image Gallery */}
        <ImageGallery images={auction.images} />

        {/* Countdown Timer */}
        <View style={styles.timerSection}>
          <View style={styles.timerBox}>
            <Ionicons name="time" size={24} color="#e74c3c" />
            <View style={styles.timerContent}>
              <Text style={styles.timerLabel}>Thời gian còn lại</Text>
              <Text style={styles.timerValue}>{timeRemaining}</Text>
            </View>
          </View>
        </View>

        {/* Current Price */}
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Giá hiện tại</Text>
          <Animated.Text 
            style={[
              styles.priceValue,
              {
                transform: [{ scale: priceAnimValue }],
                opacity: priceAnimValue,
              }
            ]}
          >
            {formatPrice(bids.length > 0 ? bids[0].amount : auction.startingPrice)}
          </Animated.Text>
          {auction.buyNowPrice && (
            <Text style={styles.buyNowPrice}>Giá mua ngay: {formatPrice(auction.buyNowPrice)}</Text>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{auction.title}</Text>
          <Text style={styles.brand}>{auction.brand}</Text>
          {auction.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#27ae60" />
              <Text style={styles.verifiedText}>Đã xác minh</Text>
            </View>
          )}
          <Text style={styles.description}>{auction.description}</Text>
        </View>

        {/* Auction Info */}
        <View style={styles.auctionInfoSection}>
          <Text style={styles.sectionTitle}>Thông tin đấu giá</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Giá khởi điểm:</Text>
            <Text style={styles.infoValue}>{formatPrice(auction.startingPrice)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bước giá:</Text>
            <Text style={styles.infoValue}>{formatPrice(auction.bidIncrement)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tiền đặt cọc:</Text>
            <Text style={styles.infoValue}>{formatPrice(auction.depositAmount)}</Text>
          </View>
          {auction.auctionStartsAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bắt đầu:</Text>
              <Text style={styles.infoValue}>{formatDate(auction.auctionStartsAt)}</Text>
            </View>
          )}
          {auction.auctionEndsAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kết thúc:</Text>
              <Text style={styles.infoValue}>{formatDate(auction.auctionEndsAt)}</Text>
            </View>
          )}
        </View>

        {/* Bids History */}
        <View style={styles.bidsSection}>
          <Text style={styles.sectionTitle}>Lịch sử đặt giá ({bids.length})</Text>
          {bids.length === 0 ? (
            <Text style={styles.noBidsText}>Chưa có ai đặt giá</Text>
          ) : (
            bids.map((bid, index) => (
              <View key={bid.id} style={styles.bidItem}>
                <View style={styles.bidLeft}>
                  {bid.bidder?.avatar ? (
                    <Image source={{ uri: bid.bidder.avatar }} style={styles.bidderAvatar} />
                  ) : (
                    <View style={[styles.bidderAvatar, styles.bidderAvatarPlaceholder]}>
                      <Ionicons name="person" size={20} color="#95a5a6" />
                    </View>
                  )}
                  <View style={styles.bidInfo}>
                    <Text style={styles.bidderName}>{bid.bidder?.name || 'Người dùng'}</Text>
                    <Text style={styles.bidTime}>{formatDate(bid.createdAt)}</Text>
                  </View>
                </View>
                <View style={styles.bidRight}>
                  {index === 0 && <Ionicons name="trophy" size={20} color="#f39c12" />}
                  <Text style={[styles.bidAmount, index === 0 && styles.highestBidAmount]}>
                    {formatPrice(bid.amount)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Seller Info */}
        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>Người bán</Text>
          <View style={styles.sellerInfo}>
            {auction.seller.avatar ? (
              <Image source={{ uri: auction.seller.avatar }} style={styles.sellerAvatar} />
            ) : (
              <View style={[styles.sellerAvatar, styles.sellerAvatarPlaceholder]}>
                <Ionicons name="person" size={30} color="#95a5a6" />
              </View>
            )}
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{auction.seller.name}</Text>
              {auction.seller.isVerified && (
                <View style={styles.sellerVerifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#27ae60" />
                  <Text style={styles.sellerVerifiedText}>Đã xác minh</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {!isOwner && (
        <View style={styles.bottomBar}>
          {timeRemaining === 'Đã kết thúc' ? (
            // Auction ended - show result based on userAuctionResult
            auction.userAuctionResult === 'WON' ? (
              // User won - show payment options
              <View style={styles.paymentContainer}>
                <View style={styles.congratsHeader}>
                  <Ionicons name="trophy" size={40} color="#f39c12" />
                  <Text style={styles.congratsTitle}>Chúc mừng! Bạn đã thắng đấu giá!</Text>
                </View>
                
                <View style={styles.paymentPriceSection}>
                  <View style={styles.paymentPriceRow}>
                    <Text style={styles.paymentPriceLabel}>Giá trúng đấu giá:</Text>
                    <Text style={styles.paymentPriceValue}>{formatPrice(bids[0]?.amount || auction.startingPrice)}</Text>
                  </View>
                  <View style={styles.paymentPriceRow}>
                    <Text style={styles.paymentPriceLabel}>Tiền cọc đã đặt:</Text>
                    <Text style={styles.paymentPriceValue}>-{formatPrice(auction.depositAmount)}</Text>
                  </View>
                  <View style={[styles.paymentPriceRow, styles.paymentTotalRow]}>
                    <Text style={styles.paymentTotalLabel}>Cần thanh toán:</Text>
                    <Text style={styles.paymentTotalValue}>
                      {formatPrice((bids[0]?.amount || auction.startingPrice) - auction.depositAmount)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.paymentMethodTitle}>Chọn phương thức thanh toán:</Text>
                
                <TouchableOpacity
                  style={[styles.paymentOption, selectedPayment === 'WALLET' && styles.paymentOptionSelected]}
                  onPress={() => setSelectedPayment('WALLET')}
                >
                  <Ionicons name="wallet" size={24} color="#27ae60" />
                  <Text style={styles.paymentOptionText}>Ví điện tử</Text>
                  <View style={[styles.radio, selectedPayment === 'WALLET' && styles.radioSelected]}>
                    {selectedPayment === 'WALLET' && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.paymentOption, selectedPayment === 'MOMO' && styles.paymentOptionSelected]}
                  onPress={() => setSelectedPayment('MOMO')}
                >
                  <Ionicons name="card" size={24} color="#d82d8b" />
                  <Text style={styles.paymentOptionText}>MoMo</Text>
                  <View style={[styles.radio, selectedPayment === 'MOMO' && styles.radioSelected]}>
                    {selectedPayment === 'MOMO' && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.payButton, (!selectedPayment || isProcessingPayment) && styles.disabledButton]}
                  onPress={handleAuctionPayment}
                  disabled={!selectedPayment || isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text style={styles.payButtonText}>Thanh toán ngay</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : auction.userAuctionResult === 'LOST' ? (
              // User lost
              <View style={styles.resultContainer}>
                <Ionicons name="sad-outline" size={60} color="#e74c3c" />
                <Text style={styles.resultTitle}>Đấu giá thất bại</Text>
                <Text style={styles.resultMessage}>
                  Rất tiếc, bạn không thắng trong phiên đấu giá này.
                </Text>
                <Text style={styles.resultSubtext}>
                  Tiền cọc {formatPrice(auction.depositAmount)} sẽ được hoàn lại vào ví của bạn sau vài tiếng.
                </Text>
              </View>
            ) : (
              // User did not participate
              <View style={styles.resultContainer}>
                <Ionicons name="information-circle-outline" size={60} color="#95a5a6" />
                <Text style={styles.resultTitle}>Chưa tham gia</Text>
                <Text style={styles.resultMessage}>
                  Bạn không tham gia phiên đấu giá này.
                </Text>
              </View>
            )
          ) : !hasStarted ? (
            <View style={styles.notStartedContainer}>
              <Ionicons name="time-outline" size={24} color="#95a5a6" />
              <Text style={styles.notStartedText}>Đấu giá chưa bắt đầu</Text>
              <Text style={styles.notStartedSubtext}>Vui lòng quay lại khi đấu giá bắt đầu</Text>
            </View>
          ) : !auction.hasUserDeposit ? (
            <TouchableOpacity
              style={[styles.depositButton, isPayingDeposit && styles.disabledButton]}
              onPress={handlePayDeposit}
              disabled={isPayingDeposit}
            >
              {isPayingDeposit ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="cash-outline" size={20} color="white" />
                  <Text style={styles.depositButtonText}>Đặt cọc {formatPrice(auction.depositAmount)}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              {/* Auto-bid Control */}
              <AutoBidControl
                enabled={autoBidEnabled}
                onToggle={setAutoBidEnabled}
              />
              
              {/* Quick Bid Buttons */}
              <QuickBidButtons
                currentPrice={bids.length > 0 ? bids[0].amount : auction.startingPrice}
                bidIncrement={auction.bidIncrement}
                onSelectMultiplier={handleQuickBid}
              />
              
              {/* Bid Input */}
              <View style={styles.bidInputSection}>
                <View style={styles.bidInputLabelRow}>
                  <Text style={styles.bidInputLabel}>Đặt giá nhanh:</Text>
                  {bidInputFocused && (
                    <Text 
                      style={styles.doneButtonText} 
                      onPress={() => {
                        bidInputRef.current?.blur();
                        setBidInputFocused(false);
                      }}
                    >
                      Xong
                    </Text>
                  )}
                </View>
                <View style={styles.bidInputContainer}>
                  <TextInput
                    ref={bidInputRef}
                    style={styles.bidInput}
                    value={bidAmount}
                    onChangeText={setBidAmount}
                    keyboardType="numeric"
                    placeholder="Nhập giá"
                    placeholderTextColor="#95a5a6"
                    onFocus={() => setBidInputFocused(true)}
                    onBlur={() => setBidInputFocused(false)}
                  />
                  <Text style={styles.bidInputSuffix}>VND</Text>
                </View>
                {bidAmount && !isNaN(parseInt(bidAmount)) && (
                  <Text style={styles.bidInputFormatted}>Giá tối thiểu: {formatPrice(parseInt(bidAmount))}</Text>
                )}
                <View style={styles.bidButtonRow}>
                  <TouchableOpacity
                    style={[styles.placeBidButton, (isPlacingBid || isAutoPlacingBid) && styles.disabledButton]}
                    onPress={handlePlaceBid}
                    disabled={isPlacingBid || isAutoPlacingBid}
                  >
                    {isPlacingBid || isAutoPlacingBid ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.placeBidButtonText}>Đặt giá</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              {auction.buyNowPrice && (
                <TouchableOpacity
                  style={[styles.buyNowButton, isBuyingNow && styles.disabledButton]}
                  onPress={handleBuyNow}
                  disabled={isBuyingNow}
                >
                  {isBuyingNow ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="flash" size={18} color="white" />
                      <Text style={styles.buyNowButtonText}>Mua ngay</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      {/* Owner Status */}
      {isOwner && (
        <View style={styles.ownerBar}>
          <Text style={styles.ownerText}>Đây là sản phẩm của bạn</Text>
        </View>
      )}
    </KeyboardAvoidingView>
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
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  timerSection: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#e74c3c',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  timerContent: {
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  timerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    fontFamily: 'monospace',
  },
  priceSection: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  priceLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  buyNowPrice: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  brand: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  verifiedText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  auctionInfoSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  bidsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  noBidsText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingVertical: 20,
  },
  bidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  bidLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bidderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  bidderAvatarPlaceholder: {
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bidInfo: {
    flex: 1,
  },
  bidderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  bidTime: {
    fontSize: 12,
    color: '#95a5a6',
  },
  bidRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bidAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  highestBidAmount: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  sellerSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  sellerAvatarPlaceholder: {
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  sellerVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerVerifiedText: {
    fontSize: 12,
    color: '#27ae60',
  },
  bottomBar: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 10,
    padding: 15,
  },
  depositButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  depositButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bidInputSection: {
    marginBottom: 15,
  },
  bidInputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bidInputLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  doneButtonText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  bidInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  bidInputSuffix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    marginLeft: 8,
  },
  bidInputFormatted: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  bidButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  placeBidButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeBidButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyNowButton: {
    backgroundColor: '#f39c12',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  buyNowButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  ownerBar: {
    backgroundColor: '#95a5a6',
    padding: 15,
    alignItems: 'center',
  },
  ownerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  notStartedContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  notStartedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginTop: 10,
  },
  notStartedSubtext: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 5,
    textAlign: 'center',
  },
  // Payment UI styles
  paymentContainer: {
    padding: 15,
  },
  congratsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  congratsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f39c12',
    marginTop: 10,
    textAlign: 'center',
  },
  paymentPriceSection: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  paymentPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  paymentPriceLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  paymentPriceValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  paymentTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    marginTop: 8,
    paddingTop: 10,
  },
  paymentTotalLabel: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  paymentTotalValue: {
    fontSize: 18,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ecf0f1',
    marginBottom: 10,
    gap: 12,
  },
  paymentOptionSelected: {
    borderColor: '#3498db',
    backgroundColor: '#f0f8ff',
  },
  paymentOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#3498db',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
  },
  payButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    alignItems: 'center',
    padding: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 15,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultSubtext: {
    fontSize: 13,
    color: '#95a5a6',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
});
