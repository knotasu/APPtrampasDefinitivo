import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AVAILABLE_APPS } from '../utils/AppSelector';

interface AppSelectorScreenProps {
  onAppSelected: (appId: string, appName: string) => void;
}

export default function AppSelectorScreen({ onAppSelected }: AppSelectorScreenProps) {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedApp) {
      Alert.alert('Error', 'Selecciona una app');
      return;
    }

    const app = AVAILABLE_APPS.find(a => a.id === selectedApp);
    if (app) {
      onAppSelected(selectedApp, app.name);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona la app a bloquear</Text>
      <Text style={styles.subtitle}>La app seleccionada será monitoreada</Text>

      <ScrollView style={styles.appsContainer} showsVerticalScrollIndicator={false}>
        {AVAILABLE_APPS.map((app) => (
          <TouchableOpacity
            key={app.id}
            style={[
              styles.appButton,
              selectedApp === app.id && styles.appButtonSelected,
            ]}
            onPress={() => setSelectedApp(app.id)}
          >
            <Text style={styles.appIcon}>{app.icon}</Text>
            <Text style={styles.appName}>{app.name}</Text>
            {selectedApp === app.id && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>CONFIRMAR Y BLOQUEAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
  },
  appsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  appButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#333',
  },
  appButtonSelected: {
    borderColor: '#3498db',
    backgroundColor: '#1f3a52',
  },
  appIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  appName: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: '#3498db',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
