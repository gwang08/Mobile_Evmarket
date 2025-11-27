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
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import AuctionDetailScreen from '../screens/AuctionDetailScreen';
import CreateAuctionScreen from '../screens/CreateAuctionScreen';
import WalletScreen from '../screens/WalletScreen';
import AppointmentListScreen from "../screens/AppointmentListScreen";
import AppointmentDetailScreen from "../screens/AppointmentDetailScreen";
import InspectionScreen from "../screens/InspectionScreen";
import FinalPaymentScreen from "../screens/FinalPaymentScreen";
import CartScreen from "../screens/CartScreen";

export type RootStackParamList = {
  Main: { screen?: keyof TabParamList } | undefined;
  VehicleDetail: { vehicleId: string };
  BatteryDetail: { batteryId: string };
  SellerDetail: { sellerId: string };
  Checkout: { productId: string; productType: "vehicle" | "battery" };
  Cart: undefined;
  CreateVehicle: undefined;
  CreateBattery: undefined;
  MyListings: undefined;
  TransactionHistory: undefined;
  Chatbot: undefined;
  AuctionDetail: { listingId: string; listingType: 'VEHICLE' | 'BATTERY' };
  CreateAuction: undefined;
  Wallet: undefined;
  AppointmentList: undefined;
  AppointmentDetail: { appointmentId: string };
  Inspection: { appointmentId: string };
  FinalPayment: {
    appointmentId: string;
    transactionId: string;
    productId: string;
    productType: "vehicle" | "battery";
  };
};

const Stack = createStackNavigator<RootStackParamList>();

// Wrapper component for TabNavigator to handle initial route
function MainTabNavigator({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
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
          backgroundColor: "#ffffff",
          shadowColor: "#000",
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
          fontWeight: "bold",
          color: "#2c3e50",
        },
        headerTintColor: "#2c3e50",
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{
          title: "Trang chủ",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="VehicleDetail"
        component={VehicleDetailScreen}
        options={{
          title: "Chi tiết xe",
        }}
      />
      <Stack.Screen
        name="BatteryDetail"
        component={BatteryDetailScreen}
        options={{
          title: "Chi tiết pin",
        }}
      />
      <Stack.Screen
        name="SellerDetail"
        component={SellerDetailScreen}
        options={{
          title: "Thông tin người bán",
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          title: "Đặt cọc 10%",
        }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: "Giỏ hàng",
        }}
      />
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{
          title: "Chi tiết lịch hẹn",
        }}
      />
      <Stack.Screen
        name="Inspection"
        component={InspectionScreen}
        options={{
          title: "Kiểm tra sản phẩm",
        }}
      />
      <Stack.Screen
        name="FinalPayment"
        component={FinalPaymentScreen}
        options={{
          title: "Thanh toán 90%",
        }}
      />
      <Stack.Screen
        name="CreateVehicle"
        component={CreateVehicleScreen}
        options={{
          title: "Đăng bán xe",
        }}
      />
      <Stack.Screen
        name="CreateBattery"
        component={CreateBatteryScreen}
        options={{
          title: "Đăng bán pin",
        }}
      />
      <Stack.Screen
        name="MyListings"
        component={MyListingsScreen}
        options={{
          title: "Sản phẩm của tôi",
        }}
      />
      <Stack.Screen
        name="AppointmentList"
        component={AppointmentListScreen}
        options={{
          title: "Lịch hẹn của tôi",
        }}
      />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
        options={{
          title: "Lịch sử mua hàng",
        }}
      />
      <Stack.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{
          title: "Trợ lý AI",
        }}
      />
      <Stack.Screen 
        name="AuctionDetail" 
        component={AuctionDetailScreen}
        options={{ 
          title: 'Chi tiết đấu giá',
        }}
      />
      <Stack.Screen 
        name="CreateAuction" 
        component={CreateAuctionScreen}
        options={{ 
          title: 'Tạo đấu giá',
        }}
      />
      <Stack.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{ 
          title: 'Ví của tôi',
        }}
      />
    </Stack.Navigator>
  );
}
