/**
 * Haptic feedback utility for mobile devices
 * Uses the Vibration API where available
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error';

const patterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  selection: 8,
  success: [10, 30, 10],
  error: [20, 40, 20, 40, 20],
};

export function haptic(style: HapticStyle = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(patterns[style]);
  } catch {
    // silently fail on unsupported devices
  }
}
