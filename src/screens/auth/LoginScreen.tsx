import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { LogIn } from 'lucide-react-native';
import Button from '../../components/common/Button';

type LoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Login'
>;

// Validation schema
const loginSchema = yup.object().shape({
  userId: yup.string().required('User ID is required'),
});

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();
  const { theme } = useTheme();

  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ userId?: string }>({});

  // Validate form
  const validateForm = async () => {
    try {
      await loginSchema.validate({ userId }, { abortEarly: false });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: { userId?: string } = {};
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path as 'userId'] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (!(await validateForm())) {
      return;
    }
    setLoading(true);
    try {
      const result = await login(userId);

      if (!result.success) {
        Alert.alert(
          'Login Failed',
          result.error || 'Please check your credentials and try again.'
        );
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
      style={[
        styles.container,
        { backgroundColor: theme.colors.background.primary },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Welcome Back
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.text.secondary }]}
          >
            Log in to your account to continue
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* User ID Input */}
          <View style={styles.inputContainer}>
            <Text
              style={[styles.label, { color: theme.colors.text.secondary }]}
            >
              User ID
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background.secondary,
                  color: theme.colors.text.primary,
                  borderColor: errors.userId
                    ? theme.colors.error
                    : theme.colors.border,
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

          {/* Password Input */}

          <Button
            title="Log In"
            onPress={handleLogin}
            loading={loading}
            icon={<LogIn size={20} color={theme.colors.text.inverse} />}
            style={{ marginTop: theme.spacing.l }}
          />
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
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 32,
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

  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
});

export default LoginScreen;
