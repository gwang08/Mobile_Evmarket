import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { parseErrorMessage } from '../utils/errorHandler';
import { authService } from '../services/authService';

// Complete the auth session for Google Sign-In
WebBrowser.maybeCompleteAuthSession();

interface LoginScreenProps {
  onSwitchToRegister: () => void;
}

export default function LoginScreen({ onSwitchToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, reloadAuthStatus } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Step 1: Open Google OAuth in WebBrowser to get code
      const googleAuthUrl = authService.getGoogleAuthUrl('mobile');
      const result = await WebBrowser.openAuthSessionAsync(
        'https://evmarket-api-staging-backup.onrender.com/api/v1/auth/google?client_type=mobile',
        'evmarket://auth-callback'
      );

      if (result.type === 'success') {
        // Parse the callback URL to get the code
        const url = result.url;
        
        // Extract code from URL
        // Example: evmarket://auth-callback?code=xxx
        const urlParts = url.split('?');
        
        if (urlParts.length < 2) {
          showError('Không tìm thấy mã xác thực trong callback URL');
          return;
        }
        
        const params = new URLSearchParams(urlParts[1]);
        const code = params.get('code');
        
        // Clean the code - remove any fragment identifier (#) or trailing characters
        const cleanCode = code?.replace(/#.*$/, '').trim();
        
        if (cleanCode) {
          console.log('Exchanging code:', cleanCode);
          
          // Step 2: Exchange code for token using authService
          const response = await authService.exchangeGoogleCode(cleanCode);
          
          console.log('Exchange code response:', response);

          // Save token and user data
          await AsyncStorage.setItem('accessToken', response.data.accessToken);
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Reload auth context to update user state
          await reloadAuthStatus();
          
          showSuccess('Đăng nhập với Google thành công!');
        } else {
          console.error('🔴 No code found in callback URL');
          showError('Không thể lấy mã xác thực từ Google');
        }
      } else if (result.type === 'cancel') {
        showWarning('Bạn đã hủy đăng nhập với Google');
      }
    } catch (error: any) {
      const errorMessage = parseErrorMessage(error);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showWarning('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), password);
      showSuccess('Đăng nhập thành công!');
    } catch (error: any) {
      const errorMessage = parseErrorMessage(error);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    showInfo('Chức năng này sẽ được cập nhật trong phiên bản tiếp theo.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Đăng nhập</Text>
            <Text style={styles.subtitle}>Vui lòng nhập thông tin để tiếp tục</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Địa chỉ email</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email của bạn"
                  placeholderTextColor="#95a5a6"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Ionicons name="mail-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#95a5a6"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.inputIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#7f8c8d" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text style={styles.checkboxLabel}>Ghi nhớ đăng nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc đăng nhập bằng</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity 
              style={styles.googleButton} 
              onPress={handleGoogleLogin}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={styles.googleButtonText}>Google</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={onSwitchToRegister}>
                <Text style={styles.signupLink}>Đăng ký miễn phí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2c3e50',
  },
  inputIcon: {
    marginLeft: 10,
    padding: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3498db',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  forgotPasswordText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#3498db', // Gradient-like: blue to purple
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#3498db',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e1e8ed',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#7f8c8d',
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    marginBottom: 30,
  },
  googleButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  signupLink: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
});