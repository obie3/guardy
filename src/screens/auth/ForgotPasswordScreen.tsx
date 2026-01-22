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
import { supabaseRest } from '../../services/supabaseRest';
import { useTheme } from '../../context/ThemeContext';
import { AuthStackParamList } from '../../types/navigation';
import * as yup from 'yup';
import { ArrowLeft, KeyRound } from 'lucide-react-native';
import Button from '../../components/common/Button';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

// Validation schema
const resetSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
});

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { theme } = useTheme();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  // Validate form
  const validateForm = async () => {
    try {
      await resetSchema.validate({ email }, { abortEarly: false });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: { email?: string } = {};
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path as 'email'] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Handle password reset
  const handleReset = async () => {
    if (!(await validateForm())) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabaseRest.auth.resetPasswordForEmail(email);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setResetSent(true);
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
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {resetSent 
              ? 'Check your email for a password reset link'
              : 'Enter your email to receive a password reset link'}
          </Text>
        </View>

        {!resetSent ? (
          <View style={styles.formContainer}>
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

            <Button
              title="Send Reset Link"
              onPress={handleReset}
              loading={loading}
              icon={<KeyRound size={20} color={theme.colors.text.inverse} />}
              style={{ marginTop: theme.spacing.l }}
            />
          </View>
        ) : (
          <View style={styles.successContainer}>
            <View style={[styles.successIconContainer, { backgroundColor: theme.colors.success + '20' }]}>
              <KeyRound size={40} color={theme.colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: theme.colors.text.primary }]}>
              Reset Link Sent
            </Text>
            <Text style={[styles.successMessage, { color: theme.colors.text.secondary }]}>
              We've sent a password reset link to {email}. Please check your inbox and follow the instructions.
            </Text>
            <Button
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
              style={{ marginTop: theme.spacing.xl }}
            />
          </View>
        )}

        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: theme.colors.text.secondary }]}>
            Remember your password?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.loginLink, { color: theme.colors.primary }]}>
              Log In
            </Text>
          </TouchableOpacity>
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
  backButton: {
    marginBottom: 16,
    marginTop: 16,
    padding: 8,
    alignSelf: 'flex-start',
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
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ForgotPasswordScreen;