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

/**
 * Whisper + MediaRecorder with one shared getUserMedia stream.
 * Windows desktop must use this — Web Speech API fights the mic stream on Windows Chrome.
 */
export function usesRecorderVoicePath(windowWidth) {
  if (typeof windowWidth === 'number' && windowWidth < MOBILE_BREAKPOINT) return true;
  if (isIOSDevice()) return true;
  if (isWindowsDesktop()) return true;
  return false;
}

/** @deprecated use usesRecorderVoicePath */
export function usesMobileVoicePath(windowWidth) {
  return usesRecorderVoicePath(windowWidth);
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
