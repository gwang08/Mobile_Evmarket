import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BatterySpecifications as BatterySpec } from '../types';

interface BatterySpecificationsProps {
  specifications: BatterySpec | null;
  capacity: number;
  year: number;
  health: number | null;
}

export default function BatterySpecifications({ specifications, capacity, year, health }: BatterySpecificationsProps) {
  const getHealthColor = (health: number | null) => {
    if (!health) return '#95a5a6';
    if (health >= 90) return '#27ae60';
    if (health >= 70) return '#f39c12';
    return '#e74c3c';
  };

  const renderSpecRow = (label: string, value: string) => (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );

  // Handle null specifications
  if (!specifications) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Thông số kỹ thuật</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          {renderSpecRow('Dung lượng', `${capacity}kWh`)}
          {renderSpecRow('Năm sản xuất', year.toString())}
          {health && (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Sức khỏe pin</Text>
              <View style={styles.healthContainer}>
                <View style={[styles.healthDot, { backgroundColor: getHealthColor(health) }]} />
                <Text style={[styles.healthValue, { color: getHealthColor(health) }]}>
                  {health}%
                </Text>
              </View>
            </View>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.noDataText}>Thông tin chi tiết chưa có sẵn</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông số kỹ thuật</Text>
      
      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
        {renderSpecRow('Dung lượng', `${capacity}kWh`)}
        {renderSpecRow('Năm sản xuất', year.toString())}
        {health && (
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Sức khỏe pin</Text>
            <View style={styles.healthContainer}>
              <View style={[styles.healthDot, { backgroundColor: getHealthColor(health) }]} />
              <Text style={[styles.healthValue, { color: getHealthColor(health) }]}>
                {health}%
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Technical Specifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
        {renderSpecRow('Trọng lượng', specifications.weight)}
        {renderSpecRow('Điện áp', specifications.voltage)}
        {renderSpecRow('Hóa học pin', specifications.chemistry)}
        {renderSpecRow('Độ suy giảm', specifications.degradation)}
        {renderSpecRow('Thời gian sạc', specifications.chargingTime)}
        {renderSpecRow('Nhiệt độ hoạt động', specifications.temperatureRange)}
      </View>

      {/* Installation & Warranty */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lắp đặt & Bảo hành</Text>
        {renderSpecRow('Yêu cầu lắp đặt', specifications.installation)}
        {renderSpecRow('Thời hạn bảo hành', specifications.warrantyPeriod)}
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
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  specLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  healthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  healthValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});