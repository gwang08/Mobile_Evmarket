import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { vehicleService, CreateVehicleRequest } from '../services/vehicleService';
import { Ionicons } from '@expo/vector-icons';

type CreateVehicleNavigationProp = StackNavigationProp<RootStackParamList>;

export default function CreateVehicleScreen() {
  const navigation = useNavigation<CreateVehicleNavigationProp>();
  const [loading, setLoading] = useState(false);
  
  // Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Specifications
  const [basicWarranty, setBasicWarranty] = useState('');
  const [batteryWarranty, setBatteryWarranty] = useState('');
  const [drivetrainWarranty, setDrivetrainWarranty] = useState('');
  
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [length, setLength] = useState('');
  const [curbWeight, setCurbWeight] = useState('');
  
  const [topSpeed, setTopSpeed] = useState('');
  const [motorType, setMotorType] = useState('');
  const [horsepower, setHorsepower] = useState('');
  const [acceleration, setAcceleration] = useState('');
  
  const [range, setRange] = useState('');
  const [chargeTime, setChargeTime] = useState('');
  const [chargingSpeed, setChargingSpeed] = useState('');
  const [batteryCapacity, setBatteryCapacity] = useState('');

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả');
      return false;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá hợp lệ');
      return false;
    }
    if (!brand.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập thương hiệu');
      return false;
    }
    if (!model.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập model');
      return false;
    }
    if (!year || isNaN(Number(year)) || Number(year) < 1900 || Number(year) > new Date().getFullYear() + 1) {
      Alert.alert('Lỗi', 'Vui lòng nhập năm sản xuất hợp lệ');
      return false;
    }
    if (!mileage || isNaN(Number(mileage)) || Number(mileage) < 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số km đã đi hợp lệ');
      return false;
    }
    if (!imageUrl.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập ít nhất một URL hình ảnh');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const vehicleData: CreateVehicleRequest = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      images: [imageUrl.trim()],
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year),
      mileage: Number(mileage),
      specifications: {
        warranty: {
          basic: basicWarranty.trim() || 'N/A',
          battery: batteryWarranty.trim() || 'N/A',
          drivetrain: drivetrainWarranty.trim() || 'N/A',
        },
        dimensions: {
          width: width.trim() || 'N/A',
          height: height.trim() || 'N/A',
          length: length.trim() || 'N/A',
          curbWeight: curbWeight.trim() || 'N/A',
        },
        performance: {
          topSpeed: topSpeed.trim() || 'N/A',
          motorType: motorType.trim() || 'N/A',
          horsepower: horsepower.trim() || 'N/A',
          acceleration: acceleration.trim() || 'N/A',
        },
        batteryAndCharging: {
          range: range.trim() || 'N/A',
          chargeTime: chargeTime.trim() || 'N/A',
          chargingSpeed: chargingSpeed.trim() || 'N/A',
          batteryCapacity: batteryCapacity.trim() || 'N/A',
        },
      },
    };

    try {
      setLoading(true);
      await vehicleService.createVehicle(vehicleData);
      Alert.alert(
        'Thành công!',
        'Xe của bạn đã được đăng bán thành công.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi đăng bán xe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiêu đề *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Nhập tiêu đề xe"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Mô tả chi tiết về xe"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Giá (VND) *</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Thương hiệu *</Text>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder="Honda, Toyota..."
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Model *</Text>
              <TextInput
                style={styles.input}
                value={model}
                onChangeText={setModel}
                placeholder="Civic, Camry..."
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Năm sản xuất *</Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={setYear}
                placeholder="2020"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Số km đã đi *</Text>
              <TextInput
                style={styles.input}
                value={mileage}
                onChangeText={setMileage}
                placeholder="50000"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>URL hình ảnh *</Text>
              <TextInput
                style={styles.input}
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="https://..."
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Thông số kỹ thuật (tùy chọn)</Text>
          
          <Text style={styles.subSectionTitle}>Bảo hành</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bảo hành cơ bản</Text>
            <TextInput
              style={styles.input}
              value={basicWarranty}
              onChangeText={setBasicWarranty}
              placeholder="4 years / 50,000 miles"
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Bảo hành pin</Text>
              <TextInput
                style={styles.input}
                value={batteryWarranty}
                onChangeText={setBatteryWarranty}
                placeholder="8 years / 120,000 miles"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Bảo hành hệ dẫn động</Text>
              <TextInput
                style={styles.input}
                value={drivetrainWarranty}
                onChangeText={setDrivetrainWarranty}
                placeholder="8 years / 120,000 miles"
              />
            </View>
          </View>

          <Text style={styles.subSectionTitle}>Kích thước</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Chiều rộng</Text>
              <TextInput
                style={styles.input}
                value={width}
                onChangeText={setWidth}
                placeholder="74.8 in"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Chiều cao</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="66 in"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Chiều dài</Text>
              <TextInput
                style={styles.input}
                value={length}
                onChangeText={setLength}
                placeholder="173.3 in"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Trọng lượng</Text>
              <TextInput
                style={styles.input}
                value={curbWeight}
                onChangeText={setCurbWeight}
                placeholder="3569 lbs"
              />
            </View>
          </View>

          <Text style={styles.subSectionTitle}>Hiệu suất</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Tốc độ tối đa</Text>
              <TextInput
                style={styles.input}
                value={topSpeed}
                onChangeText={setTopSpeed}
                placeholder="160 mph"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Loại motor</Text>
              <TextInput
                style={styles.input}
                value={motorType}
                onChangeText={setMotorType}
                placeholder="Single Motor RWD"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Công suất</Text>
              <TextInput
                style={styles.input}
                value={horsepower}
                onChangeText={setHorsepower}
                placeholder="491 hp"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Tăng tốc 0-60</Text>
              <TextInput
                style={styles.input}
                value={acceleration}
                onChangeText={setAcceleration}
                placeholder="4.9 seconds"
              />
            </View>
          </View>

          <Text style={styles.subSectionTitle}>Pin và Sạc</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Phạm vi hoạt động</Text>
              <TextInput
                style={styles.input}
                value={range}
                onChangeText={setRange}
                placeholder="430 miles (EPA)"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Thời gian sạc</Text>
              <TextInput
                style={styles.input}
                value={chargeTime}
                onChangeText={setChargeTime}
                placeholder="41 minutes (10-80%)"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Tốc độ sạc</Text>
              <TextInput
                style={styles.input}
                value={chargingSpeed}
                onChangeText={setChargingSpeed}
                placeholder="275 kW"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Dung lượng pin</Text>
              <TextInput
                style={styles.input}
                value={batteryCapacity}
                onChangeText={setBatteryCapacity}
                placeholder="81 kWh"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="car-sport" size={20} color="white" />
                <Text style={styles.submitButtonText}>Đăng bán xe</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    marginTop: 20,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 15,
    marginTop: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});