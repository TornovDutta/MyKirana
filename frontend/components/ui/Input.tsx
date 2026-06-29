import React, { useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export default function Input({ label, error, leftIcon, rightIcon, onRightIconPress, secureTextEntry, style, ...props }: InputProps) {
  const [secure, setSecure] = useState(secureTextEntry ?? false);

  const isPassword = secureTextEntry;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error && styles.inputError]}>
        {leftIcon && <Ionicons name={leftIcon} size={20} color={Colors.gray} style={styles.leftIcon} />}
        <TextInput
          {...props}
          secureTextEntry={secure}
          style={[styles.input, leftIcon && styles.inputWithLeft, style]}
          placeholderTextColor={Colors.textLight}
        />
        {isPassword ? (
          <Pressable onPress={() => setSecure(!secure)} style={({ pressed }) => [styles.rightIcon, pressed && { opacity: 0.7 }]}>
            <Ionicons name={secure ? 'eye-off' : 'eye'} size={20} color={Colors.gray} />
          </Pressable>
        ) : rightIcon ? (
          <Pressable onPress={onRightIconPress} style={({ pressed }) => [styles.rightIcon, pressed && { opacity: 0.7 }]}>
            <Ionicons name={rightIcon} size={20} color={Colors.gray} />
          </Pressable>
        ) : null}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputError: { borderColor: Colors.error },
  leftIcon: { marginRight: 8 },
  rightIcon: { padding: 4 },
  input: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 13 },
  inputWithLeft: { paddingLeft: 4 },
  errorText: { fontSize: 12, color: Colors.error, marginTop: 4 },
});
