import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities for Capacitor native vs. web browser.
 *
 * Use these guards before calling any Capacitor plugin to prevent
 * runtime errors when the app is running in a regular web browser.
 */

/** True when running inside a Capacitor native shell (Android/iOS). */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/** Returns 'android', 'ios', or 'web'. */
export const getPlatform = (): 'android' | 'ios' | 'web' => {
  return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
};

/** True only on Android native. */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/** True only on iOS native. */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/** True when running in a standard web browser (not wrapped by Capacitor). */
export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};
