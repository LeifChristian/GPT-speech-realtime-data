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

/** Mobile/narrow/iOS: Whisper + MediaRecorder. Desktop: Web Speech API. */
export function usesMobileVoicePath(windowWidth) {
  if (typeof windowWidth === 'number' && windowWidth < MOBILE_BREAKPOINT) return true;
  if (isIOSDevice()) return true;
  return false;
}

/** @alias usesMobileVoicePath */
export function usesRecorderVoicePath(windowWidth) {
  return usesMobileVoicePath(windowWidth);
}

/**
 * Live mic stream for the visualizer / MediaRecorder.
 * Windows wide desktop skips this — getUserMedia blocks SpeechRecognition there.
 */
export function shouldUseMicAnalyser(windowWidth) {
  if (usesMobileVoicePath(windowWidth)) return true;
  if (isWindowsDesktop()) return false;
  return hasSpeechRecognition();
}

export function canUseVoice(windowWidth) {
  if (usesMobileVoicePath(windowWidth)) {
    return typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';
  }
  return hasSpeechRecognition();
}
