import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import ExamLockScreen from '../../src/screens/ExamLockScreen';
import AppSelectorScreen from '../../src/screens/AppSelectorScreen';

let examStarted = false;

export default function App() {
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [password, setPassword] = useState('');
  const [examTime, setExamTime] = useState('');
  const [selectedApp, setSelectedApp] = useState<{ id: string; name: string } | null>(null);

  const handleLogin = () => {
    if (password === '1234') {
      if (!examTime || parseInt(examTime) <= 0) {
        Alert.alert('Error', 'Ingresa un tiempo válido (en minutos)');
        return;
      }
      setShowAppSelector(true);
    } else {
      Alert.alert('Error', 'Contraseña incorrecta');
      setPassword('');
    }
  };

  const handleAppSelected = (appId: string, appName: string) => {
    setSelectedApp({ id: appId, name: appName });
    setShowAppSelector(false);
    examStarted = true;
    setIsExamStarted(true);
    Alert.alert('Éxito', `Examen iniciado.\nApp bloqueada: ${appName}`);
  };

  const handleExamEnd = () => {
    examStarted = false;
    setIsExamStarted(false);
    setPassword('');
    setExamTime('');
    setSelectedApp(null);
  };

  if (showAppSelector) {
    return <AppSelectorScreen onAppSelected={handleAppSelected} />;
  }

  if (isExamStarted && selectedApp) {
    return <ExamLockScreen onExamEnd={handleExamEnd} examDurationMinutes={parseInt(examTime)} selectedApp={selectedApp} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>APP ANTI TRAMPAS</Text>
      <Text style={styles.subtitle}>Configura el examen</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Duración (minutos)"
        keyboardType="numeric"
        value={examTime}
        onChangeText={setExamTime}
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#888"
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>INICIAR EXAMEN</Text>
      </TouchableOpacity>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>© 2026 ABRAHAM ROJAS - App Anti Trampas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#fff',
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
