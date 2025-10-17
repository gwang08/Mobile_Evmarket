import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/core';
import { RootStackParamList } from '../navigation/RootNavigator';
import { SellerDetailResponse } from '../types';
import { userService } from '../services/userService';
import ReviewCard from '../components/ReviewCard';
import { useToast } from '../contexts/ToastContext';

type SellerDetailScreenRouteProp = RouteProp<RootStackParamList, 'SellerDetail'>;

export default function SellerDetailScreen() {
  const route = useRoute<SellerDetailScreenRouteProp>();
  const { sellerId } = route.params;
  const { showError } = useToast();

  const [sellerData, setSellerData] = useState<SellerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerDetail();
  }, [sellerId]);

  const fetchSellerDetail = async () => {
    try {
      setLoading(true);
      const data = await userService.getSellerProfile(sellerId);
      setSellerData(data);
    } catch (error) {
      console.error('Error fetching seller detail:', error);
      showError('Không thể tải thông tin người bán');
    } finally {
      setLoading(false);
    }
  };

  // Tính toán stats từ reviews
  const calculateStats = (reviews: any[]) => {
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
    
    // Đếm số sản phẩm unique
    const uniqueProducts = new Set(reviews.map(review => review.productId));
    const totalProducts = uniqueProducts.size;
    
    return {
      totalProducts,
      totalSales: totalReviews, // Giả sử mỗi review = 1 giao dịch
      totalReviews,
      averageRating
    };
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={[styles.star, i <= rating ? styles.starFilled : styles.starEmpty]}>
          ★
        </Text>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (!sellerData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không thể tải thông tin người bán</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSellerDetail}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { seller, reviews } = sellerData.data;
  const stats = calculateStats(reviews);

  return (
    <ScrollView style={styles.container}>
      {/* Seller Header */}
      <View style={styles.sellerHeader}>
        <Image
          source={{ uri: seller.avatar }}
          style={styles.sellerAvatar}
          defaultSource={{ uri: 'https://via.placeholder.com/100x100?text=Avatar' }}
        />
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>{seller.name}</Text>
          <Text style={styles.sellerEmail}>{seller.email}</Text>
          {seller.phone && (
            <TouchableOpacity onPress={() => handleCall(seller.phone!)}>
              <Text style={styles.sellerPhone}>{seller.phone}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.verifiedContainer}>
            <Text style={[styles.verifiedStatus, seller.isVerified ? styles.verified : styles.notVerified]}>
              {seller.isVerified ? '✓ Đã xác thực' : '⚠ Chưa xác thực'}
            </Text>
          </View>
        </View>
      </View>

      {/* Seller Bio */}
      {seller.bio && (
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Giới thiệu</Text>
          <Text style={styles.bioText}>{seller.bio}</Text>
        </View>
      )}

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Thống kê</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalProducts}</Text>
            <Text style={styles.statLabel}>Sản phẩm</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalSales}</Text>
            <Text style={styles.statLabel}>Đã bán</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalReviews}</Text>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.ratingContainer}>
              {renderStars(Math.round(stats.averageRating))}
            </View>
            <Text style={styles.ratingText}>
              {stats.averageRating.toFixed(1)} sao
            </Text>
          </View>
        </View>
      </View>

      {/* Member Since */}
      <View style={styles.memberSection}>
        <Text style={styles.memberText}>
          Thành viên từ: {seller.createdAt ? new Date(seller.createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'Không xác định'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {seller.phone && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.callButton]} 
            onPress={() => handleCall(seller.phone!)}
          >
            <Text style={styles.actionButtonText}>📞 Gọi điện</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.actionButton, styles.emailButton]} 
          onPress={() => handleEmail(seller.email || '')}
        >
          <Text style={styles.actionButtonText}>✉️ Email</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews Section */}
      <View style={styles.reviewsSection}>
        <Text style={styles.sectionTitle}>
          Đánh giá ({reviews.length})
        </Text>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <View style={styles.noReviews}>
            <Text style={styles.noReviewsText}>Chưa có đánh giá nào</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sellerHeader: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
  sellerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  sellerEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 3,
  },
  sellerPhone: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 5,
    textDecorationLine: 'underline',
  },
  verifiedContainer: {
    marginTop: 5,
  },
  verifiedStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  verified: {
    color: '#27ae60',
  },
  notVerified: {
    color: '#e67e22',
  },
  bioSection: {
    backgroundColor: 'white',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  bioText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  statsSection: {
    backgroundColor: 'white',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  star: {
    fontSize: 18,
    marginHorizontal: 1,
  },
  starFilled: {
    color: '#f39c12',
  },
  starEmpty: {
    color: '#ecf0f1',
  },
  ratingText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  memberSection: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
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
  memberText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButton: {
    backgroundColor: '#27ae60',
  },
  emailButton: {
    backgroundColor: '#3498db',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewsSection: {
    padding: 20,
  },
  noReviews: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
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
  noReviewsText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
});