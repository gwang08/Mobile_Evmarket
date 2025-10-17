import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking } from 'react-native';

import RootNavigator from './navigation/RootNavigator';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';

function AppContent() {
  const { showSuccess, showError, showWarning } = useToast();

  useEffect(() => {
    // Handle deep link when app is already running
    const handleDeepLink = (url: string) => {
      
      // Check if it's a payment success callback
      if (url.includes('evmarket://payment')) {
        const urlObj = new URL(url);
        const status = urlObj.searchParams.get('status');
        const orderId = urlObj.searchParams.get('orderId');
        
        if (status === 'success') {
          showSuccess('Thanh toán thành công! Tiền đã được nạp vào ví của bạn.');
        } else if (status === 'cancel') {
          showWarning('Bạn đã hủy quá trình thanh toán.');
        } else if (status === 'fail') {
          showError('Thanh toán thất bại. Vui lòng thử lại.');
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
    <NavigationContainer>
      <RootNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
