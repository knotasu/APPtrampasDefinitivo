import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, TextInput, Modal, NativeModules } from 'react-native';
import FloatingButton from '../components/FloatingButton';

// Extraemos nuestro módulo nativo de Kotlin
const { AntiCheatModule } = NativeModules;

interface ExamLockScreenProps {
  onExamEnd?: () => void;
  examDurationMinutes: number;
  selectedApp?: { id: string; name: string };
}

export default function ExamLockScreen({ onExamEnd, examDurationMinutes, selectedApp }: ExamLockScreenProps) {
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopPassword, setStopPassword] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(examDurationMinutes * 60);
  const [showTimeModal, setShowTimeModal] = useState(false);

  useEffect(() => {
    // 1. Función para iniciar la vigilancia nativa
    const initAntiCheat = async () => {
      if (!AntiCheatModule) {
        console.warn("AntiCheatModule no está cargado. ¿Estás probando en Expo Go?");
        return;
      }
      
      // Verificamos si el alumno ya dio el permiso de uso de datos
      const hasPermission = await AntiCheatModule.checkPermission();
      if (!hasPermission) {
        Alert.alert(
          "Permiso requerido", 
          "Necesitamos acceso al Uso de Datos para vigilar el examen y evitar trampas.",
          [{ text: "Ir a Ajustes", onPress: () => AntiCheatModule.openSettings() }]
        );
        return;
      }

      // Si hay permiso, lanzamos la app del editor y empezamos a vigilar
      if (selectedApp && selectedApp.id) {
        AntiCheatModule.startMonitoring(selectedApp.id);
      }
    };

    // Llamamos a la función al cargar la pantalla
    initAntiCheat();

    // 2. Lógica del temporizador
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Si se acaba el tiempo, detenemos la alarma y la vigilancia
          if (AntiCheatModule) AntiCheatModule.stopMonitoring();
          
          Alert.alert('Tiempo terminado', 'El examen ha finalizado', [
            {
              text: 'OK',
              onPress: () => {
                if (onExamEnd) {
                  onExamEnd();
                }
              },
            },
          ]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 3. Limpieza: si la pantalla se cierra por cualquier razón, detenemos todo
    return () => {
      clearInterval(interval);
      if (AntiCheatModule) AntiCheatModule.stopMonitoring();
    };
  }, [onExamEnd, selectedApp]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopExam = () => {
    if (stopPassword === '5678') {
      setShowStopModal(false);
      setStopPassword('');
      // El profesor ingresó la clave, detenemos la vigilancia manualmente
      if (AntiCheatModule) AntiCheatModule.stopMonitoring();
      
      Alert.alert('Examen finalizado', 'El examen ha sido detenido', [
        {
          text: 'OK',
          onPress: () => {
            if (onExamEnd) {
              onExamEnd();
            }
          },
        },
      ]);
    } else {
      Alert.alert('Error', 'Contraseña incorrecta');
      setStopPassword('');
    }
  };

  const isTimeRunningOut = remainingSeconds < 300;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EXAMEN EN PROGRESO</Text>
      <Text style={styles.subtitle}>App bloqueada: {selectedApp?.name || 'Sistema'}</Text>
      
      <View style={styles.warningBox}>
        <Text style={styles.warning}>⚠️ ADVERTENCIA ⚠️</Text>
        <Text style={styles.warningText}>
          Si intentas cambiar de app, se activará una ALARMA MUY FUERTE
        </Text>
      </View>

      <View style={[styles.infoBox, isTimeRunningOut && styles.infoBoxDanger]}>
        <Text style={[styles.infoText, isTimeRunningOut && styles.infoTextDanger]}>
          Tiempo restante: {formatTime(remainingSeconds)}
        </Text>
        {isTimeRunningOut && (
          <Text style={styles.warningSmall}>⏰ ¡El tiempo se está acabando!</Text>
        )}
      </View>

      <TouchableOpacity 
        style={styles.stopButton} 
        onPress={() => setShowStopModal(true)}
      >
        <Text style={styles.stopButtonText}>DETENER EXAMEN</Text>
      </TouchableOpacity>

      {/* Botón flotante */}
      <FloatingButton onPress={() => setShowTimeModal(true)} />

      {/* Modal de tiempo flotante */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.floatingModalBackground}>
          <View style={styles.floatingModalContent}>
            <Text style={styles.floatingModalTime}>{formatTime(remainingSeconds)}</Text>
            <Text style={styles.floatingModalLabel}>Tiempo restante</Text>
            <TouchableOpacity 
              style={styles.floatingModalClose}
              onPress={() => setShowTimeModal(false)}
            >
              <Text style={styles.floatingModalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para detener */}
      <Modal
        visible={showStopModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Detener Examen</Text>
            <Text style={styles.modalSubtitle}>Ingresa la contraseña para detener</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Contraseña"
              secureTextEntry
              value={stopPassword}
              onChangeText={setStopPassword}
              placeholderTextColor="#888"
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowStopModal(false);
                  setStopPassword('');
                }}
              >
                <Text style={styles.modalButtonText}>CANCELAR</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleStopExam}
              >
                <Text style={styles.modalButtonText}>CONFIRMAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: '#0d0d0d',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#c0392b',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#a93226',
  },
  warning: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#2c3e50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  infoBoxDanger: {
    backgroundColor: '#e74c3c',
  },
  infoText: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  infoTextDanger: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  warningSmall: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  stopButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 30,
    paddingHorizontal: 25,
    width: '85%',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#fff',
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  floatingModalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
  floatingModalTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  floatingModalLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
  },
  floatingModalClose: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  floatingModalCloseText: {
    color: '#fff',
    fontSize: 14,
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
