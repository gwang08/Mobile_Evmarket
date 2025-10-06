import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Review } from '../types';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeText = (type: string) => {
    return type === 'vehicle' ? 'Xe điện' : 'Pin';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: review.buyer.avatar }}
          style={styles.buyerAvatar}
          defaultSource={{ uri: 'https://via.placeholder.com/40x40?text=Avatar' }}
        />
        <View style={styles.buyerInfo}>
          <Text style={styles.buyerName}>{review.buyer.name}</Text>
          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
        </View>
        <View style={styles.ratingContainer}>
          {renderStars(review.rating)}
        </View>
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productType}>{getTypeText(review.type)}</Text>
        <Text style={styles.productTitle}>{review.productTitle}</Text>
      </View>

      {/* Comment */}
      <Text style={styles.comment}>{review.comment}</Text>

      {/* Media */}
      {review.mediaUrls && review.mediaUrls.length > 0 && (
        <View style={styles.mediaContainer}>
          {review.mediaUrls.slice(0, 3).map((url, index) => (
            <TouchableOpacity key={index} style={styles.mediaItem}>
              <Image
                source={{ uri: url }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
          {review.mediaUrls.length > 3 && (
            <View style={[styles.mediaItem, styles.moreMedia]}>
              <Text style={styles.moreMediaText}>+{review.mediaUrls.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Edited indicator */}
      {review.hasBeenEdited && (
        <Text style={styles.editedText}>Đã chỉnh sửa</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  buyerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  buyerInfo: {
    flex: 1,
  },
  buyerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
    marginHorizontal: 1,
  },
  starFilled: {
    color: '#f39c12',
  },
  starEmpty: {
    color: '#ecf0f1',
  },
  productInfo: {
    marginBottom: 10,
  },
  productType: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginTop: 2,
  },
  comment: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 12,
  },
  mediaContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  mediaItem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  moreMedia: {
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMediaText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  editedText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
    alignSelf: 'flex-end',
  },
});