import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, PauseCircle, SkipForward, SkipBack } from 'lucide-react';

const AudioWaveformVisualization = () => {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [visualizationType, setVisualizationType] = useState('ocean');

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

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 1024;
    spectrogramBufferLengthRef.current = analyserRef.current.frequencyBinCount;
    spectrogramDataRef.current = new Uint8Array(spectrogramBufferLengthRef.current);

    const canvas = canvasRef.current;
    if (canvas) {
      canvasCtxRef.current = canvas.getContext('2d');
    }

    const spectrogramCanvas = spectrogramCanvasRef.current;
    if (spectrogramCanvas) {
      spectrogramCtxRef.current = spectrogramCanvas.getContext('2d');
      spectrogramCtxRef.current.fillStyle = 'black';
      spectrogramCtxRef.current.fillRect(0, 0, spectrogramWidth, spectrogramHeight);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const particlesRef = useRef([]);
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

  const loadAudio = async (file) => {
    if (!audioContextRef.current) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedBuffer);
      setDuration(decodedBuffer.duration);
      setCurrentTime(0);
    } catch (error) {
      console.error("Error loading audio file:", error);
      alert("오디오 파일을 로드하는 중 오류가 발생했습니다.");
    }
  };

  const play = () => {
    if (!audioBuffer) return;
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

  const animate = () => { // Ensure single definition
    animationRef.current = requestAnimationFrame(animate);

    if (isPlaying) {
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
      setCurrentTime(Math.min(elapsed, duration));
    }

    analyserRef.current.getByteFrequencyData(spectrogramDataRef.current);
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    switch (visualizationType) {
      case 'ocean':
        renderOcean(dataArray);
        break;
      case 'bars':
        renderBars(dataArray);
        break;
      case 'circle':
        renderCircle(dataArray);
        break;
      case 'waveform':
        renderWaveform();
        break;
      case 'spectrogram':
        renderSpectrogram();
        break;
      default:
        renderOcean(dataArray);
    }
  };

  const renderOcean = (dataArray) => {
    const ctx = canvasCtxRef.current;
    if (!ctx) return;

    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#1E90FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    drawOceanWave(ctx, dataArray, width, height, analyserRef.current.frequencyBinCount);
    drawOceanParticles(ctx, dataArray, width, height, analyserRef.current.frequencyBinCount);
  };

  const drawOceanWave = (ctx, dataArray, width, height, bufferLength) => {
    let x = 0;
    const sliceWidth = width / bufferLength;

    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 255;
      const y = v * height;
      const midX = x + sliceWidth / 2;
      const midY = (y + (dataArray[i + 1] / 255) * height) / 2;
      ctx.quadraticCurveTo(x, y, midX, midY);
      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.stroke();

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
  };

  const drawOceanParticles = (ctx, dataArray, width, height, bufferLength) => {
    const particles = particlesRef.current;

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();

      const movement = (dataArray[i % bufferLength] / 255) * 2 - 1;
      particle.y += movement * 2;
      particle.x += Math.sin(particle.y / 20) * 2;

      if (particle.y > height) {
        particle.y = 0;
      } else if (particle.y < 0) {
        particle.y = height;
      }

      if (particle.x > width) {
        particle.x = 0;
      } else if (particle.x < 0) {
        particle.x = width;
      }
    }
  };

  const renderBars = (dataArray) => {
    const ctx = canvasCtxRef.current;
    if (!ctx) return;

    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const barWidth = (width / analyserRef.current.frequencyBinCount) * 2.5;
    let x = 0;

    for (let i = 0; i < analyserRef.current.frequencyBinCount; i++) {
      const v = dataArray[i];
      const y = (v / 255) * height;

      ctx.fillStyle = `rgb(${v + 100},50,50)`;
      ctx.fillRect(x, height - y, barWidth, y);

      x += barWidth + 1;
    }
  };

  const renderCircle = (dataArray) => {
    const ctx = canvasCtxRef.current;
    if (!ctx) return;

    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const radius = Math.min(width, height) / 4;
    const bars = analyserRef.current.frequencyBinCount;

    for (let i = 0; i < bars; i++) {
      const angle = (i / bars) * Math.PI * 2;
      const v = dataArray[i];
      const length = (v / 255) * radius;

      const x = centerX + Math.cos(angle) * (radius + length);
      const y = centerY + Math.sin(angle) * (radius + length);

      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `hsl(${(i / bars) * 360}, 100%, 50%)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const renderWaveform = () => {
    if (!audioBuffer || !canvasRef.current) return;
  
    const ctx = canvasCtxRef.current;
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
  
    ctx.clearRect(0, 0, width, height);
  
    // Using an analyser with the current audio context
    analyserRef.current.fftSize = 2048;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
   
    // Reading from the current play time rather than creating a full new audio source
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
  
      analyserRef.current.getByteTimeDomainData(dataArray);
  
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, width, height);
  
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(0, 255, 0)';
      ctx.beginPath();
  
      const sliceWidth = (width * 1.0) / bufferLength;
      let x = 0;
  
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
  
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  
        x += sliceWidth;
      }
  
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };
  
    draw();
  };
  
  const renderSpectrogram = () => {
    const ctx = spectrogramCtxRef.current;
    if (!ctx) return;
  
    const width = spectrogramWidth;
    const height = spectrogramHeight;
  
    // Shift the spectrogram image to the left
    const imageData = ctx.getImageData(1, 0, width - 1, height);
    ctx.putImageData(imageData, 0, 0);
  
    const barHeight = height / spectrogramBufferLengthRef.current;
  
    analyserRef.current.getByteFrequencyData(spectrogramDataRef.current);
  
    for (let i = 0; i < spectrogramBufferLengthRef.current; i++) {
      const value = spectrogramDataRef.current[i];
      const percent = value / 255;
      const hue = (i / spectrogramBufferLengthRef.current) * 360;
      const saturation = '100%';
      const lightness = `${percent * 50}%`;
  
      ctx.fillStyle = `hsl(${hue}, ${saturation}, ${lightness})`;
      ctx.fillRect(width - 1, height - i * barHeight, 1, barHeight);
    }
  };

  return (
    <div className="flex flex-col items-center p-8 bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-800 rounded-lg shadow-2xl">
      <h2 className="text-3xl font-bold text-white mb-6">Audio Visualizer</h2>
      <div className="relative w-[800px] h-[400px] mb-6">
        <canvas ref={canvasRef} width="800" height="400" className="absolute top-0 left-0 rounded-lg shadow-lg" />
        <canvas ref={spectrogramCanvasRef} width="800" height="400" className="absolute top-0 left-0 rounded-lg shadow-lg" style={{ display: visualizationType === 'spectrogram' ? 'block' : 'none' }} />
      </div>
      <div className="flex items-center space-x-6 mb-6">
        <button 
          className="p-3 bg-white rounded-full shadow-md hover:bg-indigo-100 transition-colors duration-200" 
          onClick={isPlaying ? pause : play}
        >
          {isPlaying ? <PauseCircle size={32} className="text-indigo-600" /> : <PlayCircle size={32} className="text-indigo-600" />}
        </button>
        <button 
          className="p-3 bg-white rounded-full shadow-md hover:bg-indigo-100 transition-colors duration-200" 
          onClick={() => {
            const newTime = Math.max(0, currentTime - 5);
            setCurrentTime(newTime);
          }}
        >
          <SkipBack size={32} className="text-indigo-600" />
        </button>
        <button 
          className="p-3 bg-white rounded-full shadow-md hover:bg-indigo-100 transition-colors duration-200" 
          onClick={() => {
            const newTime = Math.min(duration, currentTime + 5);
            setCurrentTime(newTime);
          }}
        >
          <SkipForward size={32} className="text-indigo-600" />
        </button>
        <select 
          className="p-3 bg-white rounded-lg shadow-md text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onChange={(e) => setVisualizationType(e.target.value)}
          value={visualizationType}
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
            if (e.target.files.length > 0) {
              loadAudio(e.target.files[0]);
            }
          }}
          className="block w-full text-sm text-white
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-indigo-50 file:text-indigo-700
                     hover:file:bg-indigo-100
                     cursor-pointer focus:outline-none"
        />
      </label>
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
const formatTime = (time) => {
  if (isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default AudioWaveformVisualization;