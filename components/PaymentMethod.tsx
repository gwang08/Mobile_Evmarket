import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

interface PaymentMethodProps {
  selectedMethod: 'MOMO' | 'WALLET' | null;
  onMethodSelect: (method: 'MOMO' | 'WALLET') => void;
}

export default function PaymentMethod({ selectedMethod, onMethodSelect }: PaymentMethodProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phương thức thanh toán</Text>
      
      {/* MoMo Payment */}
      <TouchableOpacity
        style={[
          styles.methodCard,
          selectedMethod === 'MOMO' && styles.selectedCard
        ]}
        onPress={() => onMethodSelect('MOMO')}
      >
        <View style={styles.methodContent}>
          <View style={styles.methodIcon}>
            <View style={styles.momoIcon}>
              <Text style={styles.momoText}>M</Text>
            </View>
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>Ví MoMo</Text>
            <Text style={styles.methodDescription}>
              Thanh toán qua ví điện tử MoMo
            </Text>
          </View>
          <View style={styles.radioButton}>
            {selectedMethod === 'MOMO' && (
              <View style={styles.radioSelected} />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Wallet Payment */}
      <TouchableOpacity
        style={[
          styles.methodCard,
          selectedMethod === 'WALLET' && styles.selectedCard
        ]}
        onPress={() => onMethodSelect('WALLET')}
      >
        <View style={styles.methodContent}>
          <View style={styles.methodIcon}>
            <Text style={styles.walletIcon}>💳</Text>
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>Ví EVmarket</Text>
            <Text style={styles.methodDescription}>
              Thanh toán bằng số dư trong ví EVmarket của bạn
            </Text>
          </View>
          <View style={styles.radioButton}>
            {selectedMethod === 'WALLET' && (
              <View style={styles.radioSelected} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
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
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  methodCard: {
    borderWidth: 2,
    borderColor: '#ecf0f1',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  selectedCard: {
    borderColor: '#3498db',
    backgroundColor: '#f8fbff',
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  walletIcon: {
    fontSize: 30,
  },
  momoIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#d82d8b',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  momoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  methodDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 16,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
  },
});