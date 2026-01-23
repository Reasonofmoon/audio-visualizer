import { renderSpectrogram } from './visualizationRenderers';

describe('renderSpectrogram', () => {
  let mockCtx;
  let mockAnalyser;
  let mockData;
  const width = 100;
  const height = 100;
  const bufferLength = 10;

  beforeEach(() => {
    mockCtx = {
      getImageData: jest.fn(() => 'mockImageData'),
      putImageData: jest.fn(),
      drawImage: jest.fn(),
      fillRect: jest.fn(),
      fillStyle: '',
      canvas: { width, height }, // Mocking the canvas property on the context
    };

    mockAnalyser = {
      getByteFrequencyData: jest.fn(),
    };
    mockData = new Uint8Array(bufferLength);
  });

  test('uses drawImage for optimized scrolling', () => {
    renderSpectrogram(mockCtx, mockAnalyser, bufferLength, mockData, width, height);

    expect(mockCtx.drawImage).toHaveBeenCalledWith(
      mockCtx.canvas,
      1,
      0,
      width - 1,
      height,
      0,
      0,
      width - 1,
      height
    );
    expect(mockCtx.getImageData).not.toHaveBeenCalled();
    expect(mockCtx.putImageData).not.toHaveBeenCalled();
  });
});
