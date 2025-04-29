import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) => {
  const { theme } = useTheme();

  // Determine button background color based on variant
  const getBackgroundColor = () => {
    if (disabled) return theme.colors.border;

    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.background.secondary;
      case 'tertiary':
        return 'transparent';
      case 'outline':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };

  // Determine text color based on variant
  const getTextColor = () => {
    if (disabled) return theme.colors.text.tertiary;

    switch (variant) {
      case 'primary':
        return theme.colors.text.inverse;
      case 'secondary':
        return theme.colors.primary;
      case 'tertiary':
        return theme.colors.primary;
      case 'outline':
        return theme.colors.primary;
      default:
        return theme.colors.text.inverse;
    }
  };

  // Determine border styles based on variant
  const getBorderStyles = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 1,
        borderColor: disabled ? theme.colors.border : theme.colors.primary,
      };
    }
    return {};
  };

  // Determine padding based on size
  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 6, paddingHorizontal: 12 };
      case 'medium':
        return { paddingVertical: 10, paddingHorizontal: 16 };
      case 'large':
        return { paddingVertical: 14, paddingHorizontal: 20 };
      default:
        return { paddingVertical: 10, paddingHorizontal: 16 };
    }
  };

  // Determine text size based on button size
  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'medium':
        return 14;
      case 'large':
        return 16;
      default:
        return 14;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: theme.borderRadius.medium,
        },
        getBorderStyles(),
        getPadding(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          style={styles.indicator}
        />
      ) : (
        // <>
        //   {icon && iconPosition === 'left' && { icon }}
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: getTextSize(),
              fontFamily: 'Poppins-SemiBold',
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
        //   {icon && iconPosition === 'right' && { icon }}
        // </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
  indicator: {
    alignSelf: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default Button;
