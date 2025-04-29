import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AuthStackParamList } from '../../types/navigation';
import * as yup from 'yup';
import { Eye, EyeOff, UserPlus } from 'lucide-react-native';
import Button from '../../components/common/Button';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

// Validation schema
const registerSchema = yup.object().shape({
  userId: yup.string().required('User ID is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register } = useAuth();
  const { theme } = useTheme();
  
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    userId?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Validate form
  const validateForm = async () => {
    try {
      await registerSchema.validate(
        { userId, email, password, confirmPassword },
        { abortEarly: false }
      );
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: {
          userId?: string;
          email?: string;
          password?: string;
          confirmPassword?: string;
        } = {};
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path as 'userId' | 'email' | 'password' | 'confirmPassword'] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Handle registration
  const handleRegister = async () => {
    if (!(await validateForm())) {
      return;
    }

    setLoading(true);
    try {
      const result = await register(email, password, userId);
      
      if (result.success) {
        Alert.alert(
          'Registration Successful',
          'Your account has been created. You can now log in.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Registration Failed', result.error || 'Please try again with different credentials.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            Sign up to get started with scanning
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* User ID Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>User ID</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  borderColor: errors.userId ? theme.colors.error : theme.colors.border,
                },
              ]}
              placeholder="Enter your user ID"
              placeholderTextColor={theme.colors.text.tertiary}
              value={userId}
              onChangeText={(text) => {
                setUserId(text);
                if (errors.userId) {
                  setErrors((prev) => ({ ...prev, userId: undefined }));
                }
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.userId && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.userId}
              </Text>
            )}
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  borderColor: errors.email ? theme.colors.error : theme.colors.border,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.text.tertiary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.email}
              </Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    backgroundColor: theme.colors.background.secondary,
                    color: theme.colors.text.primary,
                    borderColor: errors.password ? theme.colors.error : theme.colors.border,
                  },
                ]}
                placeholder="Create a password"
                placeholderTextColor={theme.colors.text.tertiary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.colors.text.tertiary} />
                ) : (
                  <Eye size={20} color={theme.colors.text.tertiary} />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.password}
              </Text>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    backgroundColor: theme.colors.background.secondary,
                    color: theme.colors.text.primary,
                    borderColor: errors.confirmPassword ? theme.colors.error : theme.colors.border,
                  },
                ]}
                placeholder="Confirm your password"
                placeholderTextColor={theme.colors.text.tertiary}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={theme.colors.text.tertiary} />
                ) : (
                  <Eye size={20} color={theme.colors.text.tertiary} />
                )}
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.confirmPassword}
              </Text>
            )}
          </View>

          <Button
            title="Sign Up"
            onPress={handleRegister}
            loading={loading}
            icon={<UserPlus size={20} color={theme.colors.text.inverse} />}
            style={{ marginTop: theme.spacing.l }}
          />

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.colors.text.secondary }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: theme.colors.primary }]}>
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  headerContainer: {
    marginBottom: 32,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    borderWidth: 1,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    paddingRight: 50,
    borderWidth: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 4,
  },
});

export default RegisterScreen;