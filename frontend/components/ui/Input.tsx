import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  TextInputProps,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [secure, setSecure] = useState(secureTextEntry ?? false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>}
      <View
        style={[
          styles.inputRow,
          isFocused && styles.inputRowFocused,
          error && styles.inputRowError,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={19}
            color={isFocused ? Colors.primary : Colors.gray}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          {...props}
          secureTextEntry={secure}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, leftIcon && styles.inputWithLeft, style]}
          placeholderTextColor={Colors.textLight}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setSecure(!secure)}
            style={({ pressed }) => [styles.rightIcon, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name={secure ? 'eye-off' : 'eye'} size={19} color={Colors.gray} />
          </Pressable>
        ) : rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            style={({ pressed }) => [styles.rightIcon, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name={rightIcon} size={19} color={Colors.gray} />
          </Pressable>
        ) : null}
      </View>
      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  labelFocused: {
    color: Colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 48,
    ...(Platform.OS === 'web'
      ? {
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }
      : {}),
  },
  inputRowFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FAFCFA',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.12)',
        }
      : {}),
  },
  inputRowError: {
    borderColor: Colors.error,
    backgroundColor: '#FFFBFB',
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    padding: 6,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 12,
    ...(Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as any) : {}),
  },
  inputWithLeft: {
    paddingLeft: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },
});
