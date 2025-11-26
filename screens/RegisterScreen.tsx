import React, { useState } from 'react';
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
  Linking,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { parseErrorMessage } from '../utils/errorHandler';
import { authService } from '../services/authService';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export default function RegisterScreen({ onSwitchToLogin }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const validateForm = () => {
    if (!name.trim()) {
      showWarning('Vui lòng nhập họ tên');
      return false;
    }

    if (!email.trim()) {
      showWarning('Vui lòng nhập email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showWarning('Email không hợp lệ');
      return false;
    }

    if (!password.trim()) {
      showWarning('Vui lòng nhập mật khẩu');
      return false;
    }

    if (password.length < 8) {
      showWarning('Mật khẩu phải có ít nhất 8 ký tự');
      return false;
    }

    if (password !== confirmPassword) {
      showWarning('Mật khẩu xác nhận không khớp');
      return false;
    }

    return true;
  };

  const handleGoogleRegister = async () => {
    try {
      showInfo('Đang chuyển đến trang đăng ký Google...', 2000);
      setTimeout(() => {
        Linking.openURL('https://evmarket-api-staging-backup.onrender.com/api/v1/auth/google');
      }, 500);
    } catch (error) {
      showError('Không thể mở trang đăng ký Google');
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      // Gọi API đăng ký nhưng không tự động đăng nhập
      const response = await fetch('https://evmarket-api-staging-backup.onrender.com/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim(), 
          password 
        }),
      });

      showSuccess('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.', 4000);
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    } catch (error: any) {
      const errorMessage = parseErrorMessage(error);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
            <Text style={styles.title}>Đăng ký</Text>
            <Text style={styles.subtitle}>Vui lòng nhập thông tin để tiếp tục</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Name Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Họ và tên</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ và tên của bạn"
                  placeholderTextColor="#95a5a6"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <Ionicons name="person-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
              </View>
            </View>

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
                  placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
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

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#95a5a6"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.inputIcon}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#7f8c8d" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.registerButtonText}>Đăng ký ngay</Text>
              )}
            </TouchableOpacity>

            {/* Terms */}
            <View style={styles.terms}>
              <Text style={styles.termsText}>
                Bằng việc đăng ký, bạn đồng ý với{' '}
                <Text style={styles.termsLink}>Điều khoản sử dụng</Text>
                {' '}và{' '}
                <Text style={styles.termsLink}>Chính sách bảo mật</Text>
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc đăng ký bằng</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity 
              style={styles.googleButton} 
              onPress={handleGoogleRegister}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={styles.googleButtonText}>Google</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={onSwitchToLogin}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
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
  registerButton: {
    backgroundColor: '#3498db', // Gradient-like: blue to purple
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#3498db',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  terms: {
    marginBottom: 30,
  },
  termsText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#3498db',
    fontWeight: '500',
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  loginLink: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
});