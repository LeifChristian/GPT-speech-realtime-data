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
 * Whisper + MediaRecorder with shared mic stream.
 * Mobile/narrow, iOS, and all Windows desktop widths.
 */
export function usesMobileVoicePath(windowWidth) {
  if (typeof windowWidth === 'number' && windowWidth < MOBILE_BREAKPOINT) return true;
  if (isIOSDevice()) return true;
  if (isWindowsDesktop()) return true;
  return false;
}

/** @alias usesMobileVoicePath */
export function usesRecorderVoicePath(windowWidth) {
  return usesMobileVoicePath(windowWidth);
}

/** Mac/Linux wide desktop only — live mic bars for Web Speech path. */
export function shouldUseMicAnalyser(windowWidth) {
  if (usesMobileVoicePath(windowWidth)) return true;
  return hasSpeechRecognition();
}

export function canUseVoice(windowWidth) {
  if (usesMobileVoicePath(windowWidth)) {
    return typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';
  }
  return hasSpeechRecognition();
}

/** Decorative canvas bars when speech runs without a mic stream (unused on Windows now). */
export function usesDecorativeVoiceVisualizer(windowWidth) {
  return !usesMobileVoicePath(windowWidth) && !shouldUseMicAnalyser(windowWidth);
}
