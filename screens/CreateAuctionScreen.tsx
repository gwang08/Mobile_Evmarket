import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { auctionService } from '../services/auctionService';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../contexts/ToastContext';
import * as ImagePicker from 'expo-image-picker';

type CreateAuctionScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function CreateAuctionScreen() {
  const navigation = useNavigation<CreateAuctionScreenNavigationProp>();
  const { showError, showSuccess } = useToast();

  const [listingType, setListingType] = useState<'VEHICLE' | 'BATTERY'>('VEHICLE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [bidIncrement, setBidIncrement] = useState('');
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Vehicle specific
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [location, setLocation] = useState('');

  // Battery specific
  const [capacity, setCapacity] = useState('');
  const [health, setHealth] = useState('');

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const selectedImages = result.assets.map(asset => asset.uri);
        setImages([...images, ...selectedImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      showError('Không thể chọn ảnh');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!title.trim()) {
      showError('Vui lòng nhập tiêu đề');
      return false;
    }
    if (!description.trim()) {
      showError('Vui lòng nhập mô tả');
      return false;
    }
    if (!brand.trim()) {
      showError('Vui lòng nhập thương hiệu');
      return false;
    }
    if (!startingPrice || isNaN(parseFloat(startingPrice))) {
      showError('Vui lòng nhập giá khởi điểm hợp lệ');
      return false;
    }
    if (!depositAmount || isNaN(parseFloat(depositAmount))) {
      showError('Vui lòng nhập tiền đặt cọc hợp lệ');
      return false;
    }
    if (!bidIncrement || isNaN(parseFloat(bidIncrement))) {
      showError('Vui lòng nhập bước giá hợp lệ');
      return false;
    }
    if (images.length === 0) {
      showError('Vui lòng chọn ít nhất 1 ảnh');
      return false;
    }

    if (listingType === 'VEHICLE') {
      if (!model.trim()) {
        showError('Vui lòng nhập model xe');
        return false;
      }
      if (!year || isNaN(parseInt(year))) {
        showError('Vui lòng nhập năm sản xuất hợp lệ');
        return false;
      }
      if (!mileage || isNaN(parseFloat(mileage))) {
        showError('Vui lòng nhập số km đã đi hợp lệ');
        return false;
      }
      if (!location.trim()) {
        showError('Vui lòng nhập địa điểm');
        return false;
      }
    } else {
      if (!capacity || isNaN(parseFloat(capacity))) {
        showError('Vui lòng nhập dung lượng hợp lệ');
        return false;
      }
      if (!health || isNaN(parseFloat(health))) {
        showError('Vui lòng nhập sức khỏe pin hợp lệ');
        return false;
      }
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    Alert.alert(
      'Xác nhận tạo đấu giá',
      'Sau khi tạo, sản phẩm sẽ được gửi để admin duyệt trước khi bắt đầu đấu giá.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Tạo', onPress: submitAuction },
      ]
    );
  };

  const submitAuction = async () => {
    try {
      setIsCreating(true);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('brand', brand);
      formData.append('startingPrice', startingPrice);
      formData.append('depositAmount', depositAmount);
      formData.append('bidIncrement', bidIncrement);
      if (buyNowPrice) {
        formData.append('buyNowPrice', buyNowPrice);
      }

      // Add images
      images.forEach((imageUri, index) => {
        const filename = imageUri.split('/').pop() || `image${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('images', {
          uri: imageUri,
          name: filename,
          type: type,
        } as any);
      });

      if (listingType === 'VEHICLE') {
        formData.append('model', model);
        formData.append('year', year);
        formData.append('mileage', mileage);
        formData.append('location', location);
        
        // Add minimal specifications
        const specs = {
          warranty: { basic: '', battery: '', drivetrain: '' },
          dimensions: { width: '', height: '', length: '', curbWeight: '' },
          performance: { topSpeed: '', motorType: '', horsepower: '', acceleration: '' },
          batteryAndCharging: { range: '', chargeTime: '', chargingSpeed: '', batteryCapacity: '' },
        };
        formData.append('specifications', JSON.stringify(specs));

        await auctionService.createVehicleAuction(formData);
      } else {
        formData.append('capacity', capacity);
        formData.append('year', year || '2024');
        formData.append('health', health);
        
        // Add minimal specifications
        const specs = {
          weight: '',
          voltage: '',
          chemistry: '',
          degradation: '',
          chargingTime: '',
          installation: '',
          warrantyPeriod: '',
          temperatureRange: '',
        };
        formData.append('specifications', JSON.stringify(specs));

        await auctionService.createBatteryAuction(formData);
      }

      showSuccess('Tạo đấu giá thành công! Đang chờ admin duyệt.');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating auction:', error);
      showError(error.response?.data?.message || 'Không thể tạo đấu giá');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Type Selection */}
          <Text style={styles.sectionTitle}>Loại sản phẩm</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeButton, listingType === 'VEHICLE' && styles.activeTypeButton]}
              onPress={() => setListingType('VEHICLE')}
            >
              <Ionicons
                name="car"
                size={24}
                color={listingType === 'VEHICLE' ? 'white' : '#7f8c8d'}
              />
              <Text style={[styles.typeButtonText, listingType === 'VEHICLE' && styles.activeTypeButtonText]}>
                Xe điện
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, listingType === 'BATTERY' && styles.activeTypeButton]}
              onPress={() => setListingType('BATTERY')}
            >
              <Ionicons
                name="battery-charging"
                size={24}
                color={listingType === 'BATTERY' ? 'white' : '#7f8c8d'}
              />
              <Text style={[styles.typeButtonText, listingType === 'BATTERY' && styles.activeTypeButtonText]}>
                Pin
              </Text>
            </TouchableOpacity>
          </View>

          {/* Basic Info */}
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <TextInput
            style={styles.input}
            placeholder="Tiêu đề *"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả *"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
          <TextInput
            style={styles.input}
            placeholder="Thương hiệu *"
            value={brand}
            onChangeText={setBrand}
          />

          {/* Type-specific fields */}
          {listingType === 'VEHICLE' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Model *"
                value={model}
                onChangeText={setModel}
              />
              <TextInput
                style={styles.input}
                placeholder="Năm sản xuất *"
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Số km đã đi *"
                value={mileage}
                onChangeText={setMileage}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Địa điểm *"
                value={location}
                onChangeText={setLocation}
              />
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Dung lượng (kWh) *"
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Sức khỏe pin (%) *"
                value={health}
                onChangeText={setHealth}
                keyboardType="numeric"
              />
            </>
          )}

          {/* Auction Settings */}
          <Text style={styles.sectionTitle}>Cài đặt đấu giá</Text>
          <TextInput
            style={styles.input}
            placeholder="Giá khởi điểm (VND) *"
            value={startingPrice}
            onChangeText={setStartingPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Tiền đặt cọc (VND) *"
            value={depositAmount}
            onChangeText={setDepositAmount}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Bước giá (VND) *"
            value={bidIncrement}
            onChangeText={setBidIncrement}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Giá mua ngay (VND - không bắt buộc)"
            value={buyNowPrice}
            onChangeText={setBuyNowPrice}
            keyboardType="numeric"
          />

          {/* Images */}
          <Text style={styles.sectionTitle}>Hình ảnh *</Text>
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImages}>
            <Ionicons name="images" size={24} color="#3498db" />
            <Text style={styles.imagePickerText}>Chọn ảnh ({images.length})</Text>
          </TouchableOpacity>

          {images.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Note */}
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle" size={20} color="#f39c12" />
            <Text style={styles.noteText}>
              Sau khi tạo, sản phẩm của bạn sẽ được admin xem xét và duyệt trước khi bắt đầu đấu giá.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, isCreating && styles.disabledButton]}
          onPress={handleCreate}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.submitButtonText}>Tạo đấu giá</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 15,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  activeTypeButton: {
    backgroundColor: '#e74c3c',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeTypeButtonText: {
    color: 'white',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#3498db',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 20,
    gap: 10,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#ecf0f1',
    position: 'relative',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 10,
  },
  submitButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
