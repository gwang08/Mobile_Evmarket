import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 cards per row with margins

export default function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: vehicle.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />
        {vehicle.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {vehicle.title}
        </Text>
        
        <View style={styles.details}>
          <Text style={styles.brand}>{vehicle.brand}</Text>
          <Text style={styles.year}>{vehicle.year}</Text>
        </View>
        
        <Text style={styles.mileage}>
          {vehicle.mileage.toLocaleString('vi-VN')} km
        </Text>
        
        <Text style={styles.price}>
          {formatPrice(vehicle.price)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: 'white',
    borderRadius: 12,
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
  imageContainer: {
    position: 'relative',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    display: 'none', // Hide status badge
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    display: 'none', // Hide status text
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#3498db',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 18,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  brand: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
  },
  year: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  mileage: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
});