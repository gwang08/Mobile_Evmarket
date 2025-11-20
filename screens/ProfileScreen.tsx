import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import {
  useNavigation,
  useFocusEffect,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { RootStackParamList } from "../navigation/RootNavigator";
import { TabParamList } from "../navigation/TabNavigator";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";

type ProfileNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Profile">,
  StackNavigationProp<RootStackParamList>
>;

export default function ProfileScreen() {
  const {
    user,
    isLoading,
    isAuthenticated,
    logout,
    showLoginPrompt,
    setShowLoginPrompt,
  } = useAuth();
  const { showInfo } = useToast();
  const [showLogin, setShowLogin] = useState(true);
  const navigation = useNavigation<ProfileNavigationProp>();

  useEffect(() => {
    if (showLoginPrompt && !isAuthenticated) {
      setShowLoginPrompt(false);
      setShowLogin(true);
    }
  }, [showLoginPrompt, isAuthenticated, setShowLoginPrompt]);

  useFocusEffect(
    React.useCallback(() => {
      if (showLoginPrompt && !isAuthenticated) {
        setShowLoginPrompt(false);
        setShowLogin(true);
      }
    }, [showLoginPrompt, isAuthenticated, setShowLoginPrompt])
  );

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const menuItems = [
    {
      id: 1,
      title: "Lịch hẹn của tôi",
      icon: "calendar-outline",
      action: () => navigation.navigate("AppointmentList"),
    },
    {
      id: 2,
      title: "Sản phẩm của tôi",
      icon: "storefront-outline",
      action: () => navigation.navigate("MyListings"),
    },
    { id: 3, title: "Lịch sử đơn hàng", icon: "receipt-outline" },
    { id: 4, title: "Yêu thích", icon: "heart-outline" },
    { id: 5, title: "Cài đặt thanh toán", icon: "card-outline" },
    { id: 6, title: "Hỗ trợ khách hàng", icon: "headset-outline" },
    { id: 7, title: "Cài đặt thông báo", icon: "notifications-outline" },
    { id: 8, title: "Chính sách bảo mật", icon: "lock-closed-outline" },
    { id: 9, title: "Điều khoản sử dụng", icon: "document-text-outline" },
    {
      id: 10,
      title: "Ví của tôi",
      icon: "wallet-outline",
      action: () => navigation.navigate("Wallet"),
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        {showLogin ? (
          <LoginScreen onSwitchToRegister={() => setShowLogin(false)} />
        ) : (
          <RegisterScreen onSwitchToLogin={() => setShowLogin(true)} />
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={styles.avatar}
                defaultSource={{
                  uri: "https://via.placeholder.com/80x80?text=Avatar",
                }}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            {user?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={14} color="white" />
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || "Người dùng"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.memberSince}>
              Thành viên từ{" "}
              {new Date(user?.createdAt || "").toLocaleDateString("vi-VN", {
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Đã mua</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Đã bán</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={
                item.action || (() => showInfo("Chức năng đang phát triển"))
              }
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color="#3498db"
                style={styles.menuIcon}
              />
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Phiên bản 1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#7f8c8d",
  },
  content: {
    padding: 20,
  },
  profileHeader: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#27ae60",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: "#95a5a6",
    fontStyle: "italic",
  },
  statsSection: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3498db",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  menuSection: {
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  menuIcon: {
    marginRight: 15,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: "#2c3e50",
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 20,
  },
  appVersion: {
    fontSize: 12,
    color: "#95a5a6",
  },
});
