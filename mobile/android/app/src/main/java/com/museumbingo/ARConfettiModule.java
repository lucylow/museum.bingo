package com.museumbingo;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.google.ar.core.ArCoreApk;
import com.google.ar.core.Config;
import com.google.ar.core.Session;

public class ARConfettiModule extends ReactContextBaseJavaModule {
  private Session arSession;
  private boolean isActive = false;

  ARConfettiModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return "ARConfettiModule";
  }

  @ReactMethod
  public void startConfetti(Callback callback) {
    if (isActive) {
      callback.invoke(true, "Already active");
      return;
    }

    ArCoreApk.Availability availability = ArCoreApk.getInstance().checkAvailability(getReactApplicationContext());
    switch (availability) {
      case SUPPORTED_INSTALLED:
        startSession(callback);
        return;
      case SUPPORTED_APK_TOO_OLD:
      case SUPPORTED_NOT_INSTALLED:
        callback.invoke(false, "ARCore must be installed or updated");
        return;
      default:
        callback.invoke(false, "AR not supported on this device");
    }
  }

  @ReactMethod
  public void startConfettiWithPlaneDetection(Callback callback) {
    startConfetti(callback);
  }

  @ReactMethod
  public void stopConfetti() {
    if (arSession != null) {
      arSession.pause();
      arSession.close();
      arSession = null;
    }
    isActive = false;
  }

  private void startSession(Callback callback) {
    try {
      Session session = new Session(getReactApplicationContext());
      Config config = new Config(session);
      config.setPlaneFindingMode(Config.PlaneFindingMode.HORIZONTAL);
      session.configure(config);
      session.resume();
      arSession = session;
      isActive = true;
      callback.invoke(true, "AR confetti session started");
    } catch (Exception e) {
      callback.invoke(false, "Failed to start AR session: " + e.getMessage());
    }
  }
}
