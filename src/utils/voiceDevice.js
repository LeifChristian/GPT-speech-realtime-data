export const MOBILE_BREAKPOINT = 768;

export function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isWindowsDesktop() {
  if (typeof navigator === 'undefined') return false;
  return /Win/i.test(navigator.userAgent) || /Windows/i.test(navigator.platform);
}

export function hasSpeechRecognition() {
  return (
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

/** Whisper + MediaRecorder — mobile/narrow viewports and iOS only. */
export function usesRecorderVoicePath(windowWidth) {
  if (typeof windowWidth === 'number' && windowWidth < MOBILE_BREAKPOINT) return true;
  if (isIOSDevice()) return true;
  return false;
}

/** @deprecated use usesRecorderVoicePath */
export function usesMobileVoicePath(windowWidth) {
  return usesRecorderVoicePath(windowWidth);
}

/**
 * Windows wide desktop: Web Speech API only (same as legacy Start button).
 * Skip getUserMedia — a second mic stream blocks SpeechRecognition on Windows Chrome.
 */
export function usesWindowsDesktopSpeechPath(windowWidth) {
  if (usesRecorderVoicePath(windowWidth)) return false;
  return isWindowsDesktop() && hasSpeechRecognition();
}

export function needsMicStreamForVoice(windowWidth) {
  if (usesRecorderVoicePath(windowWidth)) return true;
  if (usesWindowsDesktopSpeechPath(windowWidth)) return false;
  return hasSpeechRecognition();
}

export function usesSyntheticVoiceVisualizer(windowWidth) {
  return usesWindowsDesktopSpeechPath(windowWidth);
}

/** Mac/Linux wide desktop — Web Speech API + live mic visualizer */
export function usesSpeechRecognitionPath(windowWidth) {
  return !usesRecorderVoicePath(windowWidth) && hasSpeechRecognition();
}

export function canUseVoice(windowWidth) {
  if (usesRecorderVoicePath(windowWidth)) {
    return typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';
  }
  return hasSpeechRecognition();
}
