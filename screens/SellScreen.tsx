import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import { useAuth } from '../contexts/AuthContext';

type SellNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Sell'>,
  StackNavigationProp<RootStackParamList>
>;

export default function SellScreen() {
  const navigation = useNavigation<SellNavigationProp>();
  const { isAuthenticated, setShowLoginPrompt } = useAuth();

  const handleSellOption = (type: 'vehicle' | 'battery') => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      navigation.navigate('Profile');
      return;
    }

    if (type === 'vehicle') {
      navigation.navigate('CreateVehicle');
    } else {
      navigation.navigate('CreateBattery');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Đăng bán sản phẩm</Text>
          <Text style={styles.subtitle}>Chọn loại sản phẩm bạn muốn đăng bán</Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleSellOption('vehicle')}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🚗</Text>
            </View>
            <Text style={styles.optionTitle}>Đăng bán xe điện</Text>
            <Text style={styles.optionDescription}>
              Ô tô điện, xe máy điện, xe đạp điện
            </Text>
            <View style={styles.arrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleSellOption('battery')}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🔋</Text>
            </View>
            <Text style={styles.optionTitle}>Đăng bán pin điện</Text>
            <Text style={styles.optionDescription}>
              Pin lithium, pin sạc, phụ kiện pin
            </Text>
            <View style={styles.arrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {!isAuthenticated && (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>
              Bạn cần đăng nhập để có thể đăng bán sản phẩm
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 48,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  arrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -10,
  },
  arrowText: {
    fontSize: 20,
    color: '#3498db',
    fontWeight: 'bold',
  },
  loginPrompt: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginTop: 30,
  },
  loginPromptText: {
    color: '#856404',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});