import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import ChatbotWidget from '../components/ChatbotWidget';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WalletScreen from '../screens/WalletScreen';
import SellScreen from '../screens/SellScreen';

export type TabParamList = {
  Home: undefined;
  Products: { initialTab?: 'vehicles' | 'batteries' } | undefined;
  // Sell is optional and only mounted when authenticated
  Sell?: undefined;
  // Wallet is optional and only mounted when authenticated
  Wallet?: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

interface TabNavigatorProps {
  initialRouteName?: keyof TabParamList;
}

export default function TabNavigator({ initialRouteName }: TabNavigatorProps) {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Tab.Navigator
        initialRouteName={initialRouteName || 'Home'}
        screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          let iconSize = size;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Sell') {
            iconName = 'add-circle';
            iconSize = 35; // Larger icon for sell tab
            return (
              <View style={[
                styles.sellTabIcon, 
                { backgroundColor: focused ? '#e74c3c' : '#3498db' }
              ]}>
                <Ionicons name={iconName} size={iconSize} color="white" />
              </View>
            );
          } else if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: '#2c3e50',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Trang chủ',
          headerTitle: 'EV Market',
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{
          title: 'Sản phẩm',
          headerTitle: 'Sản phẩm',
        }}
      />

      {/* Sell tab only visible when authenticated */}
      {isAuthenticated && (
        <Tab.Screen 
          name="Sell" 
          component={SellScreen}
          options={{
            title: '',
            headerTitle: 'Đăng bán sản phẩm',
            tabBarLabelStyle: styles.sellTabLabel,
          }}
        />
      )}

      {/* Wallet only visible when authenticated */}
      {isAuthenticated && (
        <Tab.Screen 
          name="Wallet" 
          component={WalletScreen}
          options={{
            title: 'Ví',
            headerTitle: 'Ví của tôi',
          }}
        />
      )}

      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Hồ sơ',
          headerTitle: 'Hồ sơ của tôi',
        }}
      />
    </Tab.Navigator>
    
    {/* Chatbot Widget */}
    <ChatbotWidget />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    height: 75,
    paddingBottom: 12,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sellTabIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sellTabLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3498db',
  },
  header: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
});