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

export function isWindowsChromium() {
  if (!isWindowsDesktop()) return false;
  return /Chrome|Chromium|Edg/i.test(navigator.userAgent);
}

export function hasSpeechRecognition() {
  return (
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

/**
 * Whisper + MediaRecorder — mobile/narrow viewports and iOS only.
 */
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
 * Windows Chromium desktop: Web Speech STT without getUserMedia.
 * Decorative animated visualizer — avoids mic conflict with SpeechRecognition.
 */
export function usesSyntheticVoiceVisualizer(windowWidth) {
  if (usesRecorderVoicePath(windowWidth)) return false;
  return isWindowsChromium() && hasSpeechRecognition();
}

/** Real mic stream for live frequency bars (recorder path + non-Windows desktop speech). */
export function needsMicStreamForVoice(windowWidth) {
  if (usesRecorderVoicePath(windowWidth)) return true;
  if (usesSyntheticVoiceVisualizer(windowWidth)) return false;
  return hasSpeechRecognition();
}

/** Desktop speech recognition (Mac/Linux + Windows Chromium). */
export function usesSpeechRecognitionPath(windowWidth) {
  return !usesRecorderVoicePath(windowWidth) && hasSpeechRecognition();
}

export function canUseVoice(windowWidth) {
  if (usesRecorderVoicePath(windowWidth)) {
    return typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';
  }
  return hasSpeechRecognition();
}
