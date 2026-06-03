package com.jonhmoras.MiAppExamen

import android.app.AlertDialog
import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import com.facebook.react.bridge.*
import java.util.Timer
import java.util.TimerTask

class AntiCheatModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var timer: Timer? = null
    private var mediaPlayer: MediaPlayer? = null
    private var targetPackage: String = ""
    
    private var windowManager: WindowManager? = null
    private var floatingView: View? = null

    companion object {
        var isExamModeActive: Boolean = false
    }

    // MEMORIA: Esto se ejecuta apenas la app existe en la memoria RAM
    init {
        val prefs = reactContext.getSharedPreferences("ExamPrefs", Context.MODE_PRIVATE)
        if (prefs.getBoolean("isExamModeActive", false)) {
            targetPackage = prefs.getString("targetPackage", "") ?: ""
            isExamModeActive = true
            
            // Si reiniciaron el celular, reactivamos el secuestro silenciosamente
            timer = Timer()
            timer?.scheduleAtFixedRate(object : TimerTask() {
                override fun run() {
                    checkCurrentApp()
                }
            }, 2000, 2000)
        }
    }

    override fun getName() = "AntiCheatModule"

    @ReactMethod
    fun checkPermission(promise: Promise) {
        val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), reactApplicationContext.packageName)
        val hasUsageStats = mode == AppOpsManager.MODE_ALLOWED
        val hasOverlay = Settings.canDrawOverlays(reactApplicationContext)
        promise.resolve(hasUsageStats && hasOverlay)
    }

    @ReactMethod
    fun openSettings() {
        if (!Settings.canDrawOverlays(reactApplicationContext)) {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactApplicationContext.startActivity(intent)
        } else {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactApplicationContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun startMonitoring(packageName: String) {
        targetPackage = packageName
        isExamModeActive = true
        
        // Guardamos en la memoria interna (Inmortalidad)
        val prefs = reactApplicationContext.getSharedPreferences("ExamPrefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("isExamModeActive", true).putString("targetPackage", packageName).apply()
        
        val launchIntent = reactApplicationContext.packageManager.getLaunchIntentForPackage(packageName)
        if (launchIntent != null) {
            launchIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactApplicationContext.startActivity(launchIntent)
        }

        showFloatingButton()

        timer?.cancel()
        timer = Timer()
        timer?.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                checkCurrentApp()
            }
        }, 2000, 2000)
    }

    @ReactMethod
    fun stopMonitoring() {
        isExamModeActive = false
        
        // Borramos la memoria (Fin del examen legal)
        val prefs = reactApplicationContext.getSharedPreferences("ExamPrefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("isExamModeActive", false).putString("targetPackage", "").apply()

        timer?.cancel()
        timer = null
        stopAlarm()
        hideFloatingButton()
    }

    private fun checkCurrentApp() {
        val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val time = System.currentTimeMillis()
        val events = usageStatsManager.queryEvents(time - 5000, time)
        var currentApp = ""
        val event = UsageEvents.Event()
        
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                currentApp = event.packageName
            }
        }

        val myPackage = reactApplicationContext.packageName
        
        if (currentApp.isNotEmpty() && currentApp != targetPackage && currentApp != myPackage) {
            triggerAlarm()
            val forceIntent = reactApplicationContext.packageManager.getLaunchIntentForPackage(targetPackage)
            if (forceIntent != null) {
                forceIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                reactApplicationContext.startActivity(forceIntent)
            }
        }
    }

    private fun showFloatingButton() {
        if (!Settings.canDrawOverlays(reactApplicationContext)) return

        val handler = Handler(Looper.getMainLooper())
        handler.post {
            try {
                if (floatingView != null) return@post // Evitar botones duplicados
                
                val params = WindowManager.LayoutParams(
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else WindowManager.LayoutParams.TYPE_PHONE,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                    PixelFormat.TRANSLUCENT
                )
                params.gravity = Gravity.TOP or Gravity.START
                params.x = 20
                params.y = 150

                val button = Button(reactApplicationContext).apply {
                    text = "🚨"
                    textSize = 24f
                    setBackgroundColor(Color.parseColor("#cc0000"))
                    setPadding(10, 10, 10, 10)
                }

                var initialX = 0
                var initialY = 0
                var initialTouchX = 0f
                var initialTouchY = 0f
                var isMoved = false

                button.setOnTouchListener { view, event ->
                    when (event.action) {
                        MotionEvent.ACTION_DOWN -> {
                            initialX = params.x
                            initialY = params.y
                            initialTouchX = event.rawX
                            initialTouchY = event.rawY
                            isMoved = false
                            true
                        }
                        MotionEvent.ACTION_MOVE -> {
                            val dx = (event.rawX - initialTouchX).toInt()
                            val dy = (event.rawY - initialTouchY).toInt()

                            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                                isMoved = true
                            }

                            params.x = initialX + dx
                            params.y = initialY + dy
                            windowManager?.updateViewLayout(view, params)
                            true
                        }
                        MotionEvent.ACTION_UP -> {
                            if (!isMoved) {
                                showConfirmationDialog()
                            }
                            true
                        }
                        else -> false
                    }
                }
                
                windowManager = reactApplicationContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
                windowManager?.addView(button, params)
                floatingView = button
            } catch (e: Exception) {
                println("Error al mostrar el botón flotante")
            }
        }
    }

    private fun showConfirmationDialog() {
        val handler = Handler(Looper.getMainLooper())
        handler.post {
            try {
                val builder1 = AlertDialog.Builder(reactApplicationContext, android.R.style.Theme_DeviceDefault_Light_Dialog_Alert)
                builder1.setTitle("¿Detener Examen?")
                builder1.setMessage("¿Deseas intentar detener el examen?")
                builder1.setPositiveButton("Sí") { dialog1, _ ->
                    
                    val builder2 = AlertDialog.Builder(reactApplicationContext, android.R.style.Theme_DeviceDefault_Light_Dialog_Alert)
                    builder2.setTitle("Confirmación Final")
                    builder2.setMessage("¿Estás 100% seguro? Se te pedirá la contraseña del profesor para salir.")
                    builder2.setPositiveButton("Sí, detener") { dialog2, _ ->
                        val intent = Intent(reactApplicationContext, MainActivity::class.java)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                        reactApplicationContext.startActivity(intent)
                    }
                    builder2.setNegativeButton("No") { dialog2, _ -> dialog2.dismiss() }
                    
                    val alert2 = builder2.create()
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        alert2.window?.setType(WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY)
                    } else {
                        alert2.window?.setType(WindowManager.LayoutParams.TYPE_PHONE)
                    }
                    alert2.show()
                }
                builder1.setNegativeButton("No") { dialog1, _ -> dialog1.dismiss() }
                
                val alert1 = builder1.create()
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    alert1.window?.setType(WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY)
                } else {
                    alert1.window?.setType(WindowManager.LayoutParams.TYPE_PHONE)
                }
                alert1.show()
            } catch (e: Exception) {
                println("Error al mostrar dialogos")
            }
        }
    }

    private fun hideFloatingButton() {
        val handler = Handler(Looper.getMainLooper())
        handler.post {
            try {
                if (floatingView != null) {
                    windowManager?.removeView(floatingView)
                    floatingView = null
                }
            } catch (e: Exception) {}
        }
    }

    private fun triggerAlarm() {
        if (mediaPlayer?.isPlaying == true) return
        val audioManager = reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC), 0)
        val resId = reactApplicationContext.resources.getIdentifier("alarm", "raw", reactApplicationContext.packageName)
        if (resId != 0) {
            mediaPlayer = MediaPlayer.create(reactApplicationContext, resId)
            mediaPlayer?.isLooping = true
            mediaPlayer?.start()
        }
    }

    private fun stopAlarm() {
        mediaPlayer?.stop()
        mediaPlayer?.release()
        mediaPlayer = null
    }
}
