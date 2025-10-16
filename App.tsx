import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking, Alert } from 'react-native';

import RootNavigator from './navigation/RootNavigator';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  useEffect(() => {
    // Handle deep link when app is already running
    const handleDeepLink = (url: string) => {
      
      // Check if it's a payment success callback
      if (url.includes('evmarket://payment')) {
        const urlObj = new URL(url);
        const status = urlObj.searchParams.get('status');
        const orderId = urlObj.searchParams.get('orderId');
        
        if (status === 'success') {
          Alert.alert(
            'Thanh toán thành công!',
            'Tiền đã được nạp vào ví của bạn.',
            [{ text: 'OK' }]
          );
        } else if (status === 'cancel') {
          Alert.alert(
            'Đã hủy thanh toán',
            'Bạn đã hủy quá trình thanh toán.',
            [{ text: 'OK' }]
          );
        } else if (status === 'fail') {
          Alert.alert(
            'Thanh toán thất bại',
            'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    // Handle deep link when app is opened from closed state
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    // Handle deep link when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    getInitialURL();

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
