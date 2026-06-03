package com.jonhmoras.MiAppExamen

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val prefs = context.getSharedPreferences("ExamPrefs", Context.MODE_PRIVATE)
            val isExamModeActive = prefs.getBoolean("isExamModeActive", false)

            if (isExamModeActive) {
                // Si apagaron el celular en pleno examen, le abrimos la app de castigo apenas prenda
                val launchIntent = Intent(context, MainActivity::class.java)
                launchIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                context.startActivity(launchIntent)
            }
        }
    }
}
