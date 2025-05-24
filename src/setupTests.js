// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createAnalyser: jest.fn(() => ({
    fftSize: 1024, // Default, component can change this
    frequencyBinCount: 512, // Default based on fftSize 1024
    getByteFrequencyData: jest.fn(array => {
      if (array) {
        for (let i = 0; i < array.length; i++) {
          array[i] = 0; // Fill with some default
        }
      }
    }),
    getByteTimeDomainData: jest.fn(array => {
      if (array) {
        for (let i = 0; i < array.length; i++) {
          array[i] = 128; // Midpoint for Uint8Array
        }
      }
    }),
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: {
      value: 1,
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(), // Common gain method
      exponentialRampToValueAtTime: jest.fn(), // Common gain method
    }
  })),
  createBufferSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    buffer: null,
    onended: jest.fn(), // Can be assigned to by component
    loop: false,
    loopStart: 0,
    loopEnd: 0,
  })),
  decodeAudioData: jest.fn((audioData, successCallback, errorCallback) => {
    const mockAudioBuffer = {
      duration: 120,
      length: 44100 * 120,
      sampleRate: 44100,
      numberOfChannels: 2,
      getChannelData: jest.fn(channel => new Float32Array(44100 * 120)),
    };
    // Support both promise-based and callback-based decodeAudioData
    if (typeof successCallback === 'function') {
      successCallback(mockAudioBuffer);
      return undefined; 
    }
    return Promise.resolve(mockAudioBuffer);
  }),
  destination: { type: 'destination' }, // Mock destination node
  currentTime: 0,
  state: 'running', // Default state
  suspend: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
}));

// Ensure webkitAudioContext is also covered
global.webkitAudioContext = global.AudioContext;

// Mock Canvas API (keeping existing comprehensive mock)
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === '2d') {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn((sx, sy, sw, sh) => ({
          data: new Uint8ClampedArray(sw * sh * 4)
      })),
      putImageData: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      quadraticCurveTo: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      save: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      restore: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      fillText: jest.fn(),
    };
  }
  return null;
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  // Using setTimeout to better mimic async behavior and allow jest to control timers
  return setTimeout(callback, 0);
});
global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// Mock for HTMLMediaElement (as per feedback, for completeness)
// Check if HTMLMediaElement is defined (it should be in JSDOM)
if (typeof global.HTMLMediaElement !== 'undefined') {
  global.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined); // play returns a Promise
  global.HTMLMediaElement.prototype.pause = jest.fn();
  global.HTMLMediaElement.prototype.load = jest.fn();
  // Add other commonly used properties/methods if necessary
  Object.defineProperty(global.HTMLMediaElement.prototype, 'muted', {
    get: jest.fn(() => false),
    set: jest.fn(),
    configurable: true,
  });
  Object.defineProperty(global.HTMLMediaElement.prototype, 'src', {
    get: jest.fn(() => ''),
    set: jest.fn(),
    configurable: true,
  });
  // ... any other properties like volume, currentTime, duration that might be accessed
} else {
  // If HTMLMediaElement is somehow not defined, mock it minimally
  global.HTMLMediaElement = class HTMLMediaElement extends EventTarget {
    play = jest.fn().mockResolvedValue(undefined);
    pause = jest.fn();
    load = jest.fn();
    // other properties
  };
}
