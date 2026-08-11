import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.picklers.app',
  appName: 'Picklers',
  webDir: 'out',

  // ──────────────────────────────────────────────────────────────────
  // LIVE SERVER URL — Point to your deployed Vercel site.
  // The native app loads your production website inside a WebView
  // with full access to Capacitor native plugins.
  //
  // ⚠️  REPLACE THIS with your actual Vercel deployment URL:
  // ──────────────────────────────────────────────────────────────────
  server: {
    url: 'https://picklers.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https',
  },

  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a',
    },
  },

  // Android-specific configuration
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true during development
  },

  // iOS-specific configuration
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
};

export default config;
