import { renderWaveform } from './visualizationRenderers';

describe('renderWaveform Performance', () => {
  let mockCtx;
  let mockCanvas;
  let mockAnalyser;
  let mockAudioBuffer;
  let mockAnimationRef;
  let originalRequestAnimationFrame;

  beforeEach(() => {
    mockCtx = {
      clearRect: jest.fn(),
      fillStyle: '',
      fillRect: jest.fn(),
      lineWidth: 0,
      strokeStyle: '',
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
    };

    mockCanvas = {
      width: 800,
      height: 400,
      getContext: jest.fn(() => mockCtx),
    };

    mockAnalyser = {
      fftSize: 0,
      frequencyBinCount: 1024,
      getByteTimeDomainData: jest.fn(),
    };

    mockAudioBuffer = {};

    mockAnimationRef = { current: null };

    originalRequestAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = jest.fn(() => 123);
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRequestAnimationFrame;
  });

  test('renderWaveform should NOT call requestAnimationFrame recursively', () => {
    renderWaveform(mockCtx, mockCanvas, mockAudioBuffer, mockAnalyser, mockAnimationRef);

    // The optimized version should NOT start its own animation loop
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();

    // Verify that drawing still happens
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 400); // Clears background
    expect(mockCtx.stroke).toHaveBeenCalled();
  });
});
