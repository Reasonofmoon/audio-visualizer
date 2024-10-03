import React from 'react';
import AudioWaveformVisualization from './components/AudioWaveformVisualization';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-800 flex flex-col items-center justify-center p-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Audio Visualizer</h1>
        <p className="text-xl text-indigo-200">Experience your music visually</p>
      </header>
      <main className="w-full max-w-4xl">
        <AudioWaveformVisualization />
      </main>
      <footer className="mt-8 text-center text-indigo-200">
        <p>&copy; 2024 Audio Visualizer. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;