import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AutoBidControlProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export default function AutoBidControl({ enabled, onToggle }: AutoBidControlProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="flash" size={20} color="#f39c12" />
          <Text style={styles.title}>Đấu giá tự động</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#bdc3c7', true: '#f39c12' }}
          thumbColor={enabled ? '#ffffff' : '#f4f3f4'}
        />
      </View>
      {enabled && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Hệ thống sẽ tự động đặt giá khi có người khác vượt giá của bạn.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff9e6',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f39c12',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  descriptionContainer: {
    marginTop: 15,
  },
  description: {
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 16,
  },
});
