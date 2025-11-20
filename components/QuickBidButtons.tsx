import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface QuickBidButtonsProps {
  currentPrice: number;
  bidIncrement: number;
  onSelectMultiplier: (amount: number) => void;
}

const MULTIPLIERS = [
  { label: 'x2', value: 2 },
  { label: 'x3', value: 3 },
  { label: 'x5', value: 5 },
  { label: 'x10', value: 10 },
];

export default function QuickBidButtons({ currentPrice, bidIncrement, onSelectMultiplier }: QuickBidButtonsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const calculateBidAmount = (multiplier: number) => {
    return currentPrice + (bidIncrement * multiplier);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Đặt giá nhanh:</Text>
      <View style={styles.buttonsRow}>
        {MULTIPLIERS.map(({ label, value }) => (
          <TouchableOpacity
            key={value}
            style={styles.quickBidButton}
            onPress={() => onSelectMultiplier(calculateBidAmount(value))}
          >
            <Text style={styles.multiplierLabel}>{label}</Text>
            <Text style={styles.quickBidAmount}>{formatPrice(calculateBidAmount(value))}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    fontWeight: '500',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBidButton: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  multiplierLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 4,
  },
  quickBidAmount: {
    fontSize: 10,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});
