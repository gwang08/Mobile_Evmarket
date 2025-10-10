import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator, { TabParamList } from './TabNavigator';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import BatteryDetailScreen from '../screens/BatteryDetailScreen';
import SellerDetailScreen from '../screens/SellerDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import CreateVehicleScreen from '../screens/CreateVehicleScreen';
import CreateBatteryScreen from '../screens/CreateBatteryScreen';
import MyListingsScreen from '../screens/MyListingsScreen';

export type RootStackParamList = {
  Main: { screen?: keyof TabParamList } | undefined;
  VehicleDetail: { vehicleId: string };
  BatteryDetail: { batteryId: string };
  SellerDetail: { sellerId: string };
  Checkout: { productId: string; productType: 'vehicle' | 'battery' };
  CreateVehicle: undefined;
  CreateBattery: undefined;
  MyListings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Wrapper component for TabNavigator to handle initial route
function MainTabNavigator({ route, navigation }: { route: any; navigation: any }) {
  const initialRouteName = route.params?.screen as any | undefined;

  // Pass initialRouteName to TabNavigator. TabNavigator will decide
  // whether to render the requested tab (e.g. Wallet) based on auth state.
  return <TabNavigator initialRouteName={initialRouteName} />;
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#2c3e50',
        },
        headerTintColor: '#2c3e50',
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={MainTabNavigator} 
        options={{ 
          title: 'Trang chủ',
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="VehicleDetail" 
        component={VehicleDetailScreen}
        options={{ 
          title: 'Trở về',
        }}
      />
      <Stack.Screen 
        name="BatteryDetail" 
        component={BatteryDetailScreen}
        options={{ 
          title: 'Chi tiết pin',
        }}
      />
      <Stack.Screen 
        name="SellerDetail" 
        component={SellerDetailScreen}
        options={{ 
          title: 'Thông tin người bán',
        }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ 
          title: 'Thanh toán',
        }}
      />
      <Stack.Screen 
        name="CreateVehicle" 
        component={CreateVehicleScreen}
        options={{ 
          title: 'Đăng bán xe',
        }}
      />
      <Stack.Screen 
        name="CreateBattery" 
        component={CreateBatteryScreen}
        options={{ 
          title: 'Đăng bán pin',
        }}
      />
      <Stack.Screen 
        name="MyListings" 
        component={MyListingsScreen}
        options={{ 
          title: 'Sản phẩm của tôi',
        }}
      />
    </Stack.Navigator>
  );
}