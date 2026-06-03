import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';

interface FloatingButtonProps {
  onPress: () => void;
}

export default function FloatingButton({ onPress }: FloatingButtonProps) {
  return (
    <TouchableOpacity style={styles.floatingButton} onPress={onPress}>
      <Text style={styles.floatingButtonText}>⏱️</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  floatingButtonText: {
    fontSize: 24,
  },
});
