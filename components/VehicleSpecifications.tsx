import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VehicleSpecifications as VehicleSpec } from '../types';

interface VehicleSpecificationsProps {
  specifications: VehicleSpec;
  year: number;
  mileage: number;
}

export default function VehicleSpecifications({ specifications, year, mileage }: VehicleSpecificationsProps) {
  const renderSpecSection = (title: string, items: { [key: string]: string }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {Object.entries(items).map(([key, value]) => (
        <View key={key} style={styles.specRow}>
          <Text style={styles.specLabel}>{formatLabel(key)}</Text>
          <Text style={styles.specValue}>{value}</Text>
        </View>
      ))}
    </View>
  );

  const formatLabel = (key: string) => {
    const labelMap: { [key: string]: string } = {
      basic: 'Bảo hành cơ bản',
      battery: 'Bảo hành pin',
      drivetrain: 'Bảo hành hệ truyền động',
      width: 'Chiều rộng',
      height: 'Chiều cao',
      length: 'Chiều dài',
      curbWeight: 'Trọng lượng',
      topSpeed: 'Tốc độ tối đa',
      motorType: 'Loại động cơ',
      horsepower: 'Mã lực',
      acceleration: 'Tăng tốc 0-60 mph',
      range: 'Quãng đường',
      chargeTime: 'Thời gian sạc',
      chargingSpeed: 'Tốc độ sạc',
      batteryCapacity: 'Dung lượng pin',
    };
    return labelMap[key] || key;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông số kỹ thuật</Text>
      
      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Năm sản xuất</Text>
          <Text style={styles.specValue}>{year}</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Số km đã đi</Text>
          <Text style={styles.specValue}>{mileage.toLocaleString('vi-VN')} km</Text>
        </View>
      </View>

      {/* Warranty */}
      {renderSpecSection('Bảo hành', specifications.warranty)}
      
      {/* Dimensions */}
      {renderSpecSection('Kích thước', specifications.dimensions)}
      
      {/* Performance */}
      {renderSpecSection('Hiệu suất', specifications.performance)}
      
      {/* Battery & Charging */}
      {renderSpecSection('Pin & Sạc', specifications.batteryAndCharging)}
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
});