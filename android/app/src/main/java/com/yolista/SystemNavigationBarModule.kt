package com.yolista

import android.graphics.Color
import android.os.Build
import androidx.core.view.WindowCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

class SystemNavigationBarModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "SystemNavigationBar"

  @ReactMethod
  fun setStyle(colorHex: String, lightNavigationBar: Boolean) {
    val activity = reactApplicationContext.currentActivity ?: return

    UiThreadUtil.runOnUiThread {
      val window = activity.window ?: return@runOnUiThread

      WindowCompat.setDecorFitsSystemWindows(window, true)
      val color = Color.parseColor(colorHex)
      window.statusBarColor = color
      window.navigationBarColor = color
      window.decorView.setBackgroundColor(color)

      WindowCompat.getInsetsController(window, window.decorView)?.apply {
        isAppearanceLightStatusBars = lightNavigationBar
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          isAppearanceLightNavigationBars = lightNavigationBar
        }
      }
    }
  }
}
