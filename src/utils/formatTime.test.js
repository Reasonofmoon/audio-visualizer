import { formatTime } from '../components/AudioWaveformVisualization';

describe('formatTime', () => {
  test('should format 0 seconds correctly', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  test('should format 59 seconds correctly', () => {
    expect(formatTime(59)).toBe('00:59');
  });

  test('should format 60 seconds (1 minute) correctly', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  test('should format 150 seconds (2 minutes 30 seconds) correctly', () => {
    expect(formatTime(150)).toBe('02:30');
  });

  test('should handle NaN by returning 00:00', () => {
    expect(formatTime(NaN)).toBe('00:00');
  });

  test('should handle undefined by treating as NaN and returning 00:00', () => {
    expect(formatTime(undefined)).toBe('00:00');
  });

  test('should format 3600 seconds (60 minutes) correctly', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  test('should format 65 seconds (1 minute 5 seconds) correctly', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  test('should format 3599 seconds (59 minutes 59 seconds) correctly', () => {
    expect(formatTime(3599)).toBe('59:59');
  });
});
