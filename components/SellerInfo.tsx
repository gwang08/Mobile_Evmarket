import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Seller } from '../types';

interface SellerInfoProps {
  seller?: Seller;
  onSellerPress?: () => void;
}

export default function SellerInfo({ seller, onSellerPress }: SellerInfoProps) {
  if (!seller) {
    return null;
  }

  const handleSellerPress = () => {
    if (onSellerPress) {
      onSellerPress();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông tin người bán</Text>
      
      <TouchableOpacity style={styles.sellerCard} onPress={handleSellerPress}>
        <Image
          source={{ uri: seller.avatar }}
          style={styles.avatar}
          defaultSource={{ uri: 'https://via.placeholder.com/50x50?text=Avatar' }}
        />
        
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>{seller.name}</Text>
          <Text style={styles.sellerLabel}>Người bán</Text>
        </View>
        
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>›</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.messageButton}>
          <Text style={styles.messageButtonText}>Nhắn tin</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.callButton}>
          <Text style={styles.callButtonText}>Gọi điện</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  sellerLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 20,
    color: '#bdc3c7',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  messageButtonText: {
    color: '#2c3e50',
    fontSize: 14,
    fontWeight: '600',
  },
  callButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});