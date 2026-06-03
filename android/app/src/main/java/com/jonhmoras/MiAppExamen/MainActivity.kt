package com.jonhmoras.MiAppExamen

import expo.modules.splashscreen.SplashScreenManager
import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import android.widget.Toast // Para mostrar mensaje al presionar atrás

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreenManager.registerOnActivity(this)
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  // ¡AQUÍ ESTÁ LA MAGIA PARA BLOQUEAR EL BOTÓN ATRÁS!
  override fun onBackPressed() {
      if (AntiCheatModule.isExamModeActive) {
          // Si el examen está activo, el botón atrás no hace nada, solo avisa
          Toast.makeText(this, "No puedes salir durante el examen", Toast.LENGTH_SHORT).show()
      } else {
          // Si no hay examen, funciona normal
          super.onBackPressed()
      }
  }

  override fun invokeDefaultOnBackPressed() {
      // Bloqueo adicional de seguridad
      if (AntiCheatModule.isExamModeActive) return 

      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              super.invokeDefaultOnBackPressed()
          }
          return
      }
      super.invokeDefaultOnBackPressed()
  }
}
