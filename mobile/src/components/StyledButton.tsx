import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

export function StyledButton({ title, onPress, variant = 'solid', icon }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, variant === 'outline' && styles.outline]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.text}>{title}</Text> {/* ✅ sempre dentro de <Text> */}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#5856D6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1,
    borderColor: '#5856D6',
    backgroundColor: 'transparent',
  },
  text: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  iconContainer: {
    marginRight: 8,
  },
});
