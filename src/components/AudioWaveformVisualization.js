import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, PauseCircle, SkipForward, SkipBack } from 'lucide-react';
import {
  renderOcean,
  renderBars,
  renderCircle,
  renderWaveform,
  renderSpectrogram,
} from '../utils/visualizationRenderers';

const AudioWaveformVisualization = () => {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [visualizationType, setVisualizationType] = useState('ocean');
  const [audioError, setAudioError] = useState(null); // For file loading/decoding errors
  const [hasAudioSupport, setHasAudioSupport] = useState(false); // Initialize to false
  const [initializationError, setInitializationError] = useState(null); // For setup errors

  const canvasRef = useRef(null);
  const spectrogramCanvasRef = useRef(null);
  const canvasCtxRef = useRef(null);
  const spectrogramCtxRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(0);
  const spectrogramDataRef = useRef(null);
  const spectrogramBufferLengthRef = useRef(0);
  const spectrogramWidth = 800;
  const spectrogramHeight = 400;
  const particlesRef = useRef([]);

  // Effect for checking comprehensive Audio Support
  useEffect(() => {
    const checkAudioSupport = () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        try {
          const testContext = new AudioContextClass();
          if (
            typeof testContext.createAnalyser === 'function' &&
            typeof testContext.createBufferSource === 'function' &&
            typeof testContext.decodeAudioData === 'function' // Check decodeAudioData as well
          ) {
            setHasAudioSupport(true);
            console.log("Web Audio API is supported.");
          } else {
            setHasAudioSupport(false);
            setInitializationError("Key audio features (e.g., createAnalyser, createBufferSource, decodeAudioData) are missing.");
            console.warn("Key audio features are missing from AudioContext prototype.");
          }
          // Attempt to close the test context, catching errors if it's already closed or invalid
          if (testContext.close && testContext.state !== 'closed') {
            testContext.close().catch(e => console.warn("Error closing test AudioContext:", e));
          }
        } catch (error) {
          setHasAudioSupport(false);
          setInitializationError(`AudioContext could not be created: ${error.message}`);
          console.warn('AudioContext could not be created during support check:', error);
        }
      } else {
        setHasAudioSupport(false);
        setInitializationError("Web Audio API is not supported in this browser.");
        console.warn('Web Audio API is not supported in this browser.');
      }
    };

    checkAudioSupport();
  }, []); // Runs once on mount

  // Effect for AudioContext and Analyser setup (conditional on hasAudioSupport)
  useEffect(() => {
    if (!hasAudioSupport) return; // Don't proceed if audio support is not confirmed

    // We assume AudioContextClass is available if hasAudioSupport is true
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    try {
      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 1024;
      spectrogramBufferLengthRef.current = analyserRef.current.frequencyBinCount;
      spectrogramDataRef.current = new Uint8Array(spectrogramBufferLengthRef.current);
      console.log("AudioContext and Analyser initialized for the component.");
    } catch (error) {
      console.warn('AudioContext/Analyser setup for component failed:', error);
      setInitializationError(`Audio setup failed: ${error.message}. Visualizer may not work.`);
      // setHasAudioSupport(false); // Optionally degrade if setup fails post-support-check
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.warn("Error closing component AudioContext:", e));
      }
    };
  }, [hasAudioSupport]); // Depends on hasAudioSupport

  // Effect for Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvasCtxRef.current = canvas.getContext('2d');
    }
  }, []);

  // Effect for Spectrogram Canvas setup
  useEffect(() => {
    const spectrogramCanvas = spectrogramCanvasRef.current;
    if (spectrogramCanvas) {
      spectrogramCtxRef.current = spectrogramCanvas.getContext('2d');
      spectrogramCtxRef.current.fillStyle = 'black';
      spectrogramCtxRef.current.fillRect(0, 0, spectrogramWidth, spectrogramHeight);
    }
  }, []);
  
  // Effect for Particles Initialization
  useEffect(() => {
    const initializeParticles = () => {
      const particles = [];
      const particleCount = 100;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * 800,
          y: Math.random() * 400,
          radius: Math.random() * 3 + 1,
          color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`,
        });
      }
      particlesRef.current = particles;
    };
    initializeParticles();
  }, []);

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const loadAudio = async (file) => {
    if (!audioContextRef.current) {
      setAudioError("Audio system not ready. Please ensure your browser supports Web Audio API.");
      return;
    }
    setAudioError(null); 
    try {
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedBuffer);
      setDuration(decodedBuffer.duration);
      setCurrentTime(0);
    } catch (error) {
      console.error("Error loading audio file:", error);
      setAudioError("Error decoding audio file. Please ensure it's a valid MP3 or WAV file.");
    }
  };

  const play = () => {
    if (!audioBuffer || !audioContextRef.current || !analyserRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    sourceNodeRef.current = audioContextRef.current.createBufferSource();
    sourceNodeRef.current.buffer = audioBuffer;
    sourceNodeRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);
    sourceNodeRef.current.start(0, currentTime);

    setIsPlaying(true);
    startTimeRef.current = audioContextRef.current.currentTime - currentTime;
    animate();

    sourceNodeRef.current.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      cancelAnimationFrame(animationRef.current);
    };
  };

  const pause = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      setIsPlaying(false);
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
      setCurrentTime(Math.min(elapsed, duration));
      cancelAnimationFrame(animationRef.current);
    }
  };

  const animate = () => {
    if (!analyserRef.current || !audioContextRef.current) return; 
    animationRef.current = requestAnimationFrame(animate);

    if (isPlaying) {
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
      setCurrentTime(Math.min(elapsed, duration));
    }

    if (spectrogramDataRef.current && analyserRef.current.frequencyBinCount > 0) {
        analyserRef.current.getByteFrequencyData(spectrogramDataRef.current);
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        switch (visualizationType) {
          case 'ocean':
            renderOcean(canvasCtxRef.current, canvasRef.current, dataArray, analyserRef.current, particlesRef);
            break;
          case 'bars':
            renderBars(canvasCtxRef.current, canvasRef.current, dataArray, analyserRef.current);
            break;
          case 'circle':
            renderCircle(canvasCtxRef.current, canvasRef.current, dataArray, analyserRef.current);
            break;
          case 'waveform':
            renderWaveform(canvasCtxRef.current, canvasRef.current, audioBuffer, analyserRef.current, animationRef);
            break;
          case 'spectrogram':
            renderSpectrogram(spectrogramCtxRef.current, analyserRef.current, spectrogramBufferLengthRef.current, spectrogramDataRef.current, spectrogramWidth, spectrogramHeight);
            break;
          default:
            renderOcean(canvasCtxRef.current, canvasRef.current, dataArray, analyserRef.current, particlesRef);
        }
    }
  };

  if (!hasAudioSupport) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-indigo-700 via-purple-700 to-pink-700 rounded-lg shadow-2xl text-white min-h-[300px] w-full max-w-2xl mx-auto my-10">
        <h2 className="text-2xl font-bold mb-4">Audio Visualization Not Available</h2>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 mb-4">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <p className="text-center mb-2 px-4">
          Unfortunately, your browser or current environment does not fully support the Web Audio API needed for this visualizer.
        </p>
        {initializationError && <p className="text-sm text-red-300 bg-black bg-opacity-20 px-3 py-1 rounded-md mt-2">Details: {initializationError}</p>}
        <p className="text-sm mt-6">
          Please try using a modern browser like Chrome, Firefox, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-8 bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-800 rounded-lg shadow-2xl">
      <h2 className="text-3xl font-bold text-white mb-6">Audio Visualizer</h2>
      <div className="relative w-[800px] h-[400px] mb-6">
        <canvas ref={canvasRef} width="800" height="400" className="absolute top-0 left-0 rounded-lg shadow-lg" />
        <canvas ref={spectrogramCanvasRef} width="800" height="400" className="absolute top-0 left-0 rounded-lg shadow-lg" style={{ display: visualizationType === 'spectrogram' ? 'block' : 'none' }} />
      </div>
      <div className="flex items-center space-x-4 mb-6">
        <button 
          className="p-3 bg-white rounded-full shadow-md hover:bg-indigo-100 transition-colors duration-200" 
          onClick={isPlaying ? pause : play}
          disabled={!audioBuffer} // Disable if no audio buffer
        >
          {isPlaying ? <PauseCircle size={32} className="text-indigo-600" /> : <PlayCircle size={32} className="text-indigo-600" />}
        </button>
        <button 
          className="p-3 bg-white rounded-full shadow-md hover:bg-indigo-100 transition-colors duration-200" 
          onClick={() => {
            const newTime = Math.max(0, currentTime - 5);
            setCurrentTime(newTime);
          }}
          disabled={!audioBuffer} // Disable if no audio buffer
        >
          <SkipBack size={32} className="text-indigo-600" />
        </button>
        <button 
          className="p-3 bg-white rounded-full shadow-md hover:bg-indigo-100 transition-colors duration-200" 
          onClick={() => {
            const newTime = Math.min(duration, currentTime + 5);
            setCurrentTime(newTime);
          }}
          disabled={!audioBuffer} // Disable if no audio buffer
        >
          <SkipForward size={32} className="text-indigo-600" />
        </button>
        <select 
          className="p-3 bg-white rounded-lg shadow-md text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onChange={(e) => setVisualizationType(e.target.value)}
          value={visualizationType}
          disabled={!audioBuffer} // Disable if no audio buffer
        >
          <option value="ocean">Ocean Waves</option>
          <option value="bars">Bar Graph</option>
          <option value="circle">Circle Visualization</option>
          <option value="waveform">Waveform</option>
          <option value="spectrogram">Spectrogram</option>
        </select>
      </div>
      <label className="w-full max-w-xs">
        <span className="sr-only">Choose audio file</span>
        <input
          type="file"
          accept="audio/mp3, audio/wav, audio/mpeg"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp3"];
              if (!allowedTypes.includes(file.type)) {
                setAudioError(`Invalid file type: ${file.name} (${file.type}). Please select an MP3 or WAV file.`);
                setAudioBuffer(null); 
                setDuration(0);
                setCurrentTime(0);
                return;
              }
              setAudioError(null); 
              loadAudio(file);
            }
          }}
          className="block w-full text-sm text-white
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0
                     file:text-sm file:font-semibold
                     file:bg-indigo-50 file:text-indigo-700
                     hover:file:bg-indigo-100
                     cursor-pointer focus:outline-none"
        />
      </label>
      {audioError && <p className="text-red-400 text-sm mt-3 mb-2 text-center">{audioError}</p>}
      <div className="w-full max-w-xs mt-4">
        <div className="flex justify-between text-white text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format time in mm:ss
export const formatTime = (time) => {
  if (isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default AudioWaveformVisualization;