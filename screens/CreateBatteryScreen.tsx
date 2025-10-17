import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { batteryService, CreateBatteryRequest } from '../services/batteryService';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../contexts/ToastContext';
import { parseErrorMessage } from '../utils/errorHandler';

type CreateBatteryNavigationProp = StackNavigationProp<RootStackParamList>;

export default function CreateBatteryScreen() {
  const navigation = useNavigation<CreateBatteryNavigationProp>();
  const { showSuccess, showError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [capacity, setCapacity] = useState('');
  const [year, setYear] = useState('');
  const [health, setHealth] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Specifications
  const [weight, setWeight] = useState('');
  const [voltage, setVoltage] = useState('');
  const [chemistry, setChemistry] = useState('');
  const [degradation, setDegradation] = useState('');
  const [chargingTime, setChargingTime] = useState('');
  const [installation, setInstallation] = useState('');
  const [warrantyPeriod, setWarrantyPeriod] = useState('');
  const [temperatureRange, setTemperatureRange] = useState('');

  const validateForm = () => {
    if (!title.trim()) {
      showWarning('Vui lòng nhập tiêu đề');
      return false;
    }
    if (!description.trim()) {
      showWarning('Vui lòng nhập mô tả');
      return false;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      showWarning('Vui lòng nhập giá hợp lệ');
      return false;
    }
    if (!brand.trim()) {
      showWarning('Vui lòng nhập thương hiệu');
      return false;
    }
    if (!capacity || isNaN(Number(capacity)) || Number(capacity) <= 0) {
      showWarning('Vui lòng nhập dung lượng pin hợp lệ');
      return false;
    }
    if (!year || isNaN(Number(year)) || Number(year) < 1900 || Number(year) > new Date().getFullYear() + 1) {
      showWarning('Vui lòng nhập năm sản xuất hợp lệ');
      return false;
    }
    if (!health || isNaN(Number(health)) || Number(health) < 0 || Number(health) > 100) {
      showWarning('Vui lòng nhập mức độ sức khỏe pin hợp lệ (0-100%)');
      return false;
    }
    if (!imageUrl.trim()) {
      showWarning('Vui lòng nhập ít nhất một URL hình ảnh');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const batteryData: CreateBatteryRequest = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      images: [imageUrl.trim()],
      brand: brand.trim(),
      capacity: Number(capacity),
      year: Number(year),
      health: Number(health),
      specifications: {
        weight: weight.trim() || 'N/A',
        voltage: voltage.trim() || 'N/A',
        chemistry: chemistry.trim() || 'N/A',
        degradation: degradation.trim() || 'N/A',
        chargingTime: chargingTime.trim() || 'N/A',
        installation: installation.trim() || 'N/A',
        warrantyPeriod: warrantyPeriod.trim() || 'N/A',
        temperatureRange: temperatureRange.trim() || 'N/A',
      },
    };

    try {
      setLoading(true);
      await batteryService.createBattery(batteryData);
      showSuccess('Pin của bạn đã được đăng bán thành công!');
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error: any) {
      const errorMessage = parseErrorMessage(error);
      showError(errorMessage);
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
              placeholder="Nhập tiêu đề pin"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Mô tả chi tiết về pin"
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
                placeholder="Tesla, BYD, LG..."
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Dung lượng (kWh) *</Text>
              <TextInput
                style={styles.input}
                value={capacity}
                onChangeText={setCapacity}
                placeholder="75"
                keyboardType="numeric"
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
              <Text style={styles.label}>Sức khỏe pin (%) *</Text>
              <TextInput
                style={styles.input}
                value={health}
                onChangeText={setHealth}
                placeholder="85"
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
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Trọng lượng</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="528kg"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Điện áp</Text>
              <TextInput
                style={styles.input}
                value={voltage}
                onChangeText={setVoltage}
                placeholder="408V"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Loại hóa học</Text>
              <TextInput
                style={styles.input}
                value={chemistry}
                onChangeText={setChemistry}
                placeholder="NMC, LFP, NCA..."
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Mức độ suy giảm</Text>
              <TextInput
                style={styles.input}
                value={degradation}
                onChangeText={setDegradation}
                placeholder="27% (73% capacity)"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Thời gian sạc</Text>
              <TextInput
                style={styles.input}
                value={chargingTime}
                onChangeText={setChargingTime}
                placeholder="75 minutes (0-80%)"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Yêu cầu lắp đặt</Text>
              <TextInput
                style={styles.input}
                value={installation}
                onChangeText={setInstallation}
                placeholder="Professional required"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Thời hạn bảo hành</Text>
              <TextInput
                style={styles.input}
                value={warrantyPeriod}
                onChangeText={setWarrantyPeriod}
                placeholder="1 years remaining"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Phạm vi nhiệt độ</Text>
              <TextInput
                style={styles.input}
                value={temperatureRange}
                onChangeText={setTemperatureRange}
                placeholder="-20°C to 60°C"
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
                <Ionicons name="battery-charging" size={20} color="white" />
                <Text style={styles.submitButtonText}>Đăng bán pin</Text>
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
    backgroundColor: '#e74c3c',
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